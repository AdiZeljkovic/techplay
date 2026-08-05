"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeService = void 0;
const ApiService_1 = require("./ApiService");
const BuffyService_1 = require("./BuffyService");
const axios_1 = __importDefault(require("axios"));
const he = __importStar(require("he"));
/**
 * Manages 1v1 trivia duels between users.
 */
class ChallengeService {
    constructor(client) {
        // Active duels by channel ID
        this.activeDuels = new Map();
        // Pending challenges (waiting for acceptance)
        this.pendingChallenges = new Map();
        // Configuration
        this.TRIVIA_API_URL = 'https://opentdb.com/api.php?amount=1&category=15&type=multiple'; // Video Games
        this.QUESTIONS_PER_DUEL = 5;
        this.ANSWER_TIME_SECONDS = 30;
        this.CHALLENGE_TIMEOUT_SECONDS = 60;
        this.XP_REWARD = 100;
        this.client = client;
        this.api = ApiService_1.ApiService.getInstance();
        this.buffy = BuffyService_1.BuffyService.getInstance();
    }
    static getInstance(client) {
        if (!ChallengeService.instance && client) {
            ChallengeService.instance = new ChallengeService(client);
        }
        return ChallengeService.instance;
    }
    /**
     * Start listening for duel answers
     */
    start() {
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot)
                return;
            await this.handleMessage(message);
        });
        console.log('⚔️ Challenge Service started');
    }
    /**
     * Create a new challenge
     */
    async createChallenge(challenger, opponent, channel) {
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
        const duel = {
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
    async acceptChallenge(userId, channelId) {
        const pending = this.pendingChallenges.get(channelId);
        if (!pending || pending.opponentId !== userId) {
            return false;
        }
        // Move to active duels
        pending.status = 'active';
        this.activeDuels.set(channelId, pending);
        this.pendingChallenges.delete(channelId);
        // Start the duel
        const channel = await this.client.channels.fetch(channelId);
        if (channel) {
            await channel.send(`⚔️ **${pending.opponentName}** accepted! Let the duel begin!`);
            await this.askNextQuestion(channelId);
        }
        return true;
    }
    /**
     * Decline a pending challenge
     */
    async declineChallenge(userId, channelId) {
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
    isUserInDuel(userId) {
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
    async handleMessage(message) {
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
            }
            else {
                // Next question after a short delay
                setTimeout(() => this.askNextQuestion(message.channelId), 3000);
            }
        }
    }
    /**
     * Ask the next trivia question
     */
    async askNextQuestion(channelId) {
        const duel = this.activeDuels.get(channelId);
        if (!duel)
            return;
        const channel = await this.client.channels.fetch(channelId);
        if (!channel)
            return;
        try {
            const response = await axios_1.default.get(this.TRIVIA_API_URL);
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
            const embed = this.buffy.createDuelQuestionEmbed(questionText, category, duel.currentQuestion, duel.totalQuestions);
            await channel.send({ embeds: [embed] });
            // Set timeout for answer
            duel.questionTimeout = setTimeout(async () => {
                if (duel.currentAnswer) {
                    duel.currentAnswer = null;
                    await channel.send(`⏰ Time's up! The answer was: **${correctAnswer}**`);
                    if (duel.currentQuestion >= duel.totalQuestions) {
                        await this.endDuel(channelId);
                    }
                    else {
                        setTimeout(() => this.askNextQuestion(channelId), 3000);
                    }
                }
            }, this.ANSWER_TIME_SECONDS * 1000);
        }
        catch (error) {
            console.error('Error fetching trivia question:', error);
            await channel.send('❌ Failed to fetch trivia question. Ending duel...');
            await this.endDuel(channelId);
        }
    }
    /**
     * End the duel and determine winner
     */
    async endDuel(channelId) {
        const duel = this.activeDuels.get(channelId);
        if (!duel)
            return;
        duel.status = 'finished';
        const channel = await this.client.channels.fetch(channelId);
        if (!channel)
            return;
        const score1 = duel.scores[duel.challengerId];
        const score2 = duel.scores[duel.opponentId];
        let winner = null;
        let winnerId = null;
        if (score1 > score2) {
            winner = duel.challengerName;
            winnerId = duel.challengerId;
        }
        else if (score2 > score1) {
            winner = duel.opponentName;
            winnerId = duel.opponentId;
        }
        // Award XP
        if (winnerId) {
            await this.api.addXp(winnerId, this.XP_REWARD);
        }
        else {
            // Tie - both get half XP
            await this.api.addXp(duel.challengerId, Math.floor(this.XP_REWARD / 2));
            await this.api.addXp(duel.opponentId, Math.floor(this.XP_REWARD / 2));
        }
        const embed = this.buffy.createDuelResultEmbed(winner, duel.challengerName, score1, duel.opponentName, score2, this.XP_REWARD);
        await channel.send({ embeds: [embed] });
        // Clean up
        this.activeDuels.delete(channelId);
    }
    /**
     * Get pending challenge for a channel
     */
    getPendingChallenge(channelId) {
        return this.pendingChallenges.get(channelId);
    }
}
exports.ChallengeService = ChallengeService;
