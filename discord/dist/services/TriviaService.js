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
exports.TriviaService = void 0;
const discord_js_1 = require("discord.js");
const ApiService_1 = require("./ApiService");
const axios_1 = __importDefault(require("axios"));
const he = __importStar(require("he"));
class TriviaService {
    constructor(client) {
        this.activeQuestion = null;
        this.questionTimeout = null;
        // Config
        this.TRIVIA_XP_REWARD = 50;
        this.QUESTION_TIMEOUT_SECONDS = 60;
        this.TRIVIA_API_URL = 'https://opentdb.com/api.php?amount=1&category=18'; // Category 18 = Computers/Tech
        this.client = client;
        this.api = ApiService_1.ApiService.getInstance();
    }
    static getInstance(client) {
        if (!TriviaService.instance && client) {
            TriviaService.instance = new TriviaService(client);
        }
        return TriviaService.instance;
    }
    normalizeAnswer(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
            .replace(/['']/g, "'") // Normalize quotes
            .replace(/[""]/g, '"'); // Normalize double quotes
    }
    start() {
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot)
                return;
            if (!this.activeQuestion)
                return;
            const content = this.normalizeAnswer(message.content);
            // Check if user answer matches any of the valid answers (case-insensitive)
            if (this.activeQuestion.a.some(ans => this.normalizeAnswer(ans) === content)) {
                await this.handleWin(message);
            }
        });
    }
    async startTrivia(interaction) {
        if (this.activeQuestion) {
            await interaction.reply({ content: "⚠️ A trivia question is already active!", ephemeral: true });
            return;
        }
        await interaction.deferReply();
        try {
            const response = await axios_1.default.get(this.TRIVIA_API_URL);
            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                // Decode HTML entities (e.g. &quot; -> ")
                const questionText = he.decode(result.question);
                const correctAnswer = he.decode(result.correct_answer).toLowerCase();
                // Store question and possible correct variations
                this.activeQuestion = {
                    q: questionText,
                    a: [correctAnswer],
                    correctAnswer: he.decode(result.correct_answer)
                };
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle("🧠 TechPlay Infinite Trivia")
                    .setDescription(`**Topic:** ${result.category}\n\n**Question:** ${questionText}`)
                    .setColor(0x5865F2)
                    .setFooter({ text: `First to answer correctly gets ${this.TRIVIA_XP_REWARD} XP! You have ${this.QUESTION_TIMEOUT_SECONDS}s!` });
                await interaction.editReply({ embeds: [embed] });
                // Set timeout — clear question if no one answers in time
                const channel = interaction.channel;
                this.questionTimeout = setTimeout(async () => {
                    if (this.activeQuestion) {
                        const answer = this.activeQuestion.correctAnswer;
                        this.activeQuestion = null;
                        this.questionTimeout = null;
                        if (channel && channel.isTextBased()) {
                            await channel.send(`⏰ Time's up! Nobody answered in time. The correct answer was: **${answer}**`);
                        }
                    }
                }, this.QUESTION_TIMEOUT_SECONDS * 1000);
            }
            else {
                throw new Error("No trivia results");
            }
        }
        catch (error) {
            console.error('Trivia API failed:', error);
            await interaction.editReply("❌ Failed to fetch trivia from the global database. Try again later.");
        }
    }
    async handleWin(message) {
        if (!this.activeQuestion)
            return;
        const winner = message.author;
        this.activeQuestion = null;
        if (this.questionTimeout) {
            clearTimeout(this.questionTimeout);
            this.questionTimeout = null;
        }
        await message.reply(`🎉 **Correct!** ${winner} answered correctly and earned **${this.TRIVIA_XP_REWARD} XP**!`);
        // Award XP
        await this.api.addXp(winner.id, this.TRIVIA_XP_REWARD);
    }
}
exports.TriviaService = TriviaService;
