"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    apiUrl: process.env.API_URL || 'https://techplay.gg/api/v1',
    botSecret: process.env.DISCORD_BOT_SECRET || '', // Must match backend DISCORD_BOT_SECRET
    recapChannelId: process.env.RECAP_CHANNEL_ID || '', // Channel for weekly recaps
    checkInterval: parseInt(process.env.CHECK_INTERVAL_SECONDS || '600', 10) * 1000,
    priveeUserId: process.env.PRIVEE_USER_ID || '',
};
// Validate required config
if (!exports.config.token) {
    console.error("❌ DISCORD_TOKEN is missing in .env file");
}
if (!exports.config.botSecret) {
    console.warn("⚠️ DISCORD_BOT_SECRET is missing - XP sync will not work");
}
