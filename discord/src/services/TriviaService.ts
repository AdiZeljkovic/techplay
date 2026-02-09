import { Client, CommandInteraction, Message, EmbedBuilder } from 'discord.js';
import { ApiService } from './ApiService';
import axios from 'axios';
import * as he from 'he';

export class TriviaService {
    private static instance: TriviaService;
    private client: Client;
    private api: ApiService;
    private activeQuestion: { q: string, a: string[] } | null = null;

    // Config
    private readonly TRIVIA_XP_REWARD = 50;
    private readonly TRIVIA_API_URL = 'https://opentdb.com/api.php?amount=1&category=18'; // Category 18 = Computers/Tech

    private constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
    }

    public static getInstance(client?: Client): TriviaService {
        if (!TriviaService.instance && client) {
            TriviaService.instance = new TriviaService(client);
        }
        return TriviaService.instance;
    }

    private normalizeAnswer(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')       // Normalize multiple spaces to single space
            .replace(/['']/g, "'")      // Normalize quotes
            .replace(/[""]/g, '"');     // Normalize double quotes
    }

    public start() {
        this.client.on('messageCreate', async (message: Message) => {
            if (message.author.bot) return;
            if (!this.activeQuestion) return;

            const content = this.normalizeAnswer(message.content);
            // Check if user answer matches any of the valid answers (case-insensitive)
            if (this.activeQuestion.a.some(ans => this.normalizeAnswer(ans) === content)) {
                await this.handleWin(message);
            }
        });
    }

    public async startTrivia(interaction: CommandInteraction) {
        if (this.activeQuestion) {
            await interaction.reply({ content: "⚠️ A trivia question is already active!", ephemeral: true });
            return;
        }

        await interaction.deferReply();

        try {
            const response = await axios.get(this.TRIVIA_API_URL);
            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];

                // Decode HTML entities (e.g. &quot; -> ")
                const questionText = he.decode(result.question);
                const correctAnswer = he.decode(result.correct_answer).toLowerCase();

                // Store question and possible correct variations
                this.activeQuestion = {
                    q: questionText,
                    a: [correctAnswer]
                };

                const embed = new EmbedBuilder()
                    .setTitle("🧠 TechPlay Infinite Trivia")
                    .setDescription(`**Topic:** ${result.category}\n\n**Question:** ${questionText}`)
                    .setColor(0x5865F2)
                    .setFooter({ text: `First to answer correctly gets ${this.TRIVIA_XP_REWARD} XP! (Type your answer in chat)` });

                await interaction.editReply({ embeds: [embed] });
            } else {
                throw new Error("No trivia results");
            }
        } catch (error) {
            console.error('Trivia API failed:', error);
            await interaction.editReply("❌ Failed to fetch trivia from the global database. Try again later.");
        }
    }

    private async handleWin(message: Message) {
        if (!this.activeQuestion) return;

        const winner = message.author;
        this.activeQuestion = null; // Reset

        await message.reply(`🎉 **Correct!** ${winner} answered correctly and earned **${this.TRIVIA_XP_REWARD} XP**!`);

        // Award XP
        await this.api.addXp(winner.id, this.TRIVIA_XP_REWARD);
    }
}
