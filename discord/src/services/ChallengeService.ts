import { Client, Message, TextChannel, User, EmbedBuilder } from 'discord.js';
import { ApiService } from './ApiService';
import { BuffyService } from './BuffyService';
import axios from 'axios';
import * as he from 'he';

interface ActiveDuel {
    challengerId: string;
    challengerName: string;
    opponentId: string;
    opponentName: string;
    channelId: string;
    scores: { [userId: string]: number };
    currentQuestion: number;
    totalQuestions: number;
    currentAnswer: string | null;
    questionTimeout: NodeJS.Timeout | null;
    status: 'pending' | 'active' | 'finished';
}

/**
 * Manages 1v1 trivia duels between users.
 */
export class ChallengeService {
    private static instance: ChallengeService;
    private client: Client;
    private api: ApiService;
    private buffy: BuffyService;

    // Active duels by channel ID
    private activeDuels: Map<string, ActiveDuel> = new Map();

    // Pending challenges (waiting for acceptance)
    private pendingChallenges: Map<string, ActiveDuel> = new Map();

    // Configuration
    private readonly TRIVIA_API_URL = 'https://opentdb.com/api.php?amount=1&category=15&type=multiple'; // Video Games
    private readonly QUESTIONS_PER_DUEL = 5;
    private readonly ANSWER_TIME_SECONDS = 30;
    private readonly CHALLENGE_TIMEOUT_SECONDS = 60;
    private readonly XP_REWARD = 100;

    private constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
        this.buffy = BuffyService.getInstance();
    }

    public static getInstance(client?: Client): ChallengeService {
        if (!ChallengeService.instance && client) {
            ChallengeService.instance = new ChallengeService(client);
        }
        return ChallengeService.instance;
    }

    /**
     * Start listening for duel answers
     */
    public start() {
        this.client.on('messageCreate', async (message: Message) => {
            if (message.author.bot) return;
            await this.handleMessage(message);
        });

        console.log('⚔️ Challenge Service started');
    }

    /**
     * Create a new challenge
     */
    public async createChallenge(
        challenger: User,
        opponent: User,
        channel: TextChannel
    ): Promise<EmbedBuilder | null> {
        // Check if either user is already in a duel
        if (this.isUserInDuel(challenger.id) || this.isUserInDuel(opponent.id)) {
            return this.buffy.createErrorEmbed('One of the users is already in a duel!');
        }

        // Can't challenge yourself
        if (challenger.id === opponent.id) {
            return this.buffy.createErrorEmbed("You can't challenge yourself, silly!");
        }

        // Can't challenge a bot
        if (opponent.bot) {
            return this.buffy.createErrorEmbed("You can't challenge a bot!");
        }

        // Create pending challenge
        const duel: ActiveDuel = {
            challengerId: challenger.id,
            challengerName: challenger.username,
            opponentId: opponent.id,
            opponentName: opponent.username,
            channelId: channel.id,
            scores: {
                [challenger.id]: 0,
                [opponent.id]: 0
            },
            currentQuestion: 0,
            totalQuestions: this.QUESTIONS_PER_DUEL,
            currentAnswer: null,
            questionTimeout: null,
            status: 'pending'
        };

        this.pendingChallenges.set(channel.id, duel);

        // Set timeout for challenge acceptance
        setTimeout(async () => {
            const pending = this.pendingChallenges.get(channel.id);
            if (pending && pending.status === 'pending') {
                this.pendingChallenges.delete(channel.id);
                await channel.send(`⏰ Challenge expired! **${opponent.username}** didn't respond in time.`);
            }
        }, this.CHALLENGE_TIMEOUT_SECONDS * 1000);

        return this.buffy.createChallengeEmbed(challenger.username, opponent.username);
    }

    /**
     * Accept a pending challenge
     */
    public async acceptChallenge(userId: string, channelId: string): Promise<boolean> {
        const pending = this.pendingChallenges.get(channelId);

        if (!pending || pending.opponentId !== userId) {
            return false;
        }

        // Move to active duels
        pending.status = 'active';
        this.activeDuels.set(channelId, pending);
        this.pendingChallenges.delete(channelId);

        // Start the duel
        const channel = await this.client.channels.fetch(channelId) as TextChannel;
        if (channel) {
            await channel.send(`⚔️ **${pending.opponentName}** accepted! Let the duel begin!`);
            await this.askNextQuestion(channelId);
        }

        return true;
    }

    /**
     * Decline a pending challenge
     */
    public async declineChallenge(userId: string, channelId: string): Promise<boolean> {
        const pending = this.pendingChallenges.get(channelId);

        if (!pending || pending.opponentId !== userId) {
            return false;
        }

        this.pendingChallenges.delete(channelId);
        return true;
    }

    /**
     * Check if user is in an active duel
     */
    public isUserInDuel(userId: string): boolean {
        for (const duel of this.activeDuels.values()) {
            if (duel.challengerId === userId || duel.opponentId === userId) {
                return true;
            }
        }
        for (const duel of this.pendingChallenges.values()) {
            if (duel.challengerId === userId || duel.opponentId === userId) {
                return true;
            }
        }
        return false;
    }

    /**
     * Handle incoming messages for duel answers
     */
    private async handleMessage(message: Message) {
        const duel = this.activeDuels.get(message.channelId);

        if (!duel || duel.status !== 'active' || !duel.currentAnswer) {
            return;
        }

        // Check if message is from one of the duel participants
        if (message.author.id !== duel.challengerId && message.author.id !== duel.opponentId) {
            return;
        }

        // Check answer
        const userAnswer = message.content.toLowerCase().trim();
        const correctAnswer = duel.currentAnswer.toLowerCase().trim();

        if (userAnswer === correctAnswer) {
            // Correct answer!
            if (duel.questionTimeout) {
                clearTimeout(duel.questionTimeout);
            }

            duel.scores[message.author.id]++;
            duel.currentAnswer = null;

            await message.reply(`✅ Correct! **${message.author.username}** earns a point!`);

            // Check if duel is complete
            if (duel.currentQuestion >= duel.totalQuestions) {
                await this.endDuel(message.channelId);
            } else {
                // Next question after a short delay
                setTimeout(() => this.askNextQuestion(message.channelId), 3000);
            }
        }
    }

    /**
     * Ask the next trivia question
     */
    private async askNextQuestion(channelId: string) {
        const duel = this.activeDuels.get(channelId);
        if (!duel) return;

        const channel = await this.client.channels.fetch(channelId) as TextChannel;
        if (!channel) return;

        try {
            const response = await axios.get(this.TRIVIA_API_URL);
            const result = response.data.results?.[0];

            if (!result) {
                await channel.send('❌ Failed to fetch trivia question. Ending duel...');
                await this.endDuel(channelId);
                return;
            }

            duel.currentQuestion++;
            const questionText = he.decode(result.question);
            const correctAnswer = he.decode(result.correct_answer);
            const category = he.decode(result.category);

            duel.currentAnswer = correctAnswer;

            const embed = this.buffy.createDuelQuestionEmbed(
                questionText,
                category,
                duel.currentQuestion,
                duel.totalQuestions
            );

            await channel.send({ embeds: [embed] });

            // Set timeout for answer
            duel.questionTimeout = setTimeout(async () => {
                if (duel.currentAnswer) {
                    duel.currentAnswer = null;
                    await channel.send(`⏰ Time's up! The answer was: **${correctAnswer}**`);

                    if (duel.currentQuestion >= duel.totalQuestions) {
                        await this.endDuel(channelId);
                    } else {
                        setTimeout(() => this.askNextQuestion(channelId), 3000);
                    }
                }
            }, this.ANSWER_TIME_SECONDS * 1000);

        } catch (error) {
            console.error('Error fetching trivia question:', error);
            await channel.send('❌ Failed to fetch trivia question. Ending duel...');
            await this.endDuel(channelId);
        }
    }

    /**
     * End the duel and determine winner
     */
    private async endDuel(channelId: string) {
        const duel = this.activeDuels.get(channelId);
        if (!duel) return;

        duel.status = 'finished';

        const channel = await this.client.channels.fetch(channelId) as TextChannel;
        if (!channel) return;

        const score1 = duel.scores[duel.challengerId];
        const score2 = duel.scores[duel.opponentId];

        let winner: string | null = null;
        let winnerId: string | null = null;

        if (score1 > score2) {
            winner = duel.challengerName;
            winnerId = duel.challengerId;
        } else if (score2 > score1) {
            winner = duel.opponentName;
            winnerId = duel.opponentId;
        }

        // Award XP
        if (winnerId) {
            await this.api.addXp(winnerId, this.XP_REWARD);
        } else {
            // Tie - both get half XP
            await this.api.addXp(duel.challengerId, Math.floor(this.XP_REWARD / 2));
            await this.api.addXp(duel.opponentId, Math.floor(this.XP_REWARD / 2));
        }

        const embed = this.buffy.createDuelResultEmbed(
            winner,
            duel.challengerName,
            score1,
            duel.opponentName,
            score2,
            this.XP_REWARD
        );

        await channel.send({ embeds: [embed] });

        // Clean up
        this.activeDuels.delete(channelId);
    }

    /**
     * Get pending challenge for a channel
     */
    public getPendingChallenge(channelId: string): ActiveDuel | undefined {
        return this.pendingChallenges.get(channelId);
    }
}
