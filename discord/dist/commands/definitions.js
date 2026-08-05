"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const discord_js_1 = require("discord.js");
/**
 * All slash command definitions for the TechPlay Discord bot.
 * These are registered with Discord's API on startup.
 */
exports.commands = [
    {
        name: 'profile',
        description: '📜 View your or someone else\'s TechPlay profile',
        options: [
            {
                name: 'user',
                description: 'The user to view (leave empty for yourself)',
                type: discord_js_1.ApplicationCommandOptionType.User,
                required: false,
            }
        ]
    },
    {
        name: 'link',
        description: '🔗 Link your Discord account to TechPlay',
    },
    {
        name: 'sync',
        description: '🔄 Sync your Discord roles with your TechPlay rank',
    },
    {
        name: 'search',
        description: '🔍 Search for articles on TechPlay',
        options: [
            {
                name: 'query',
                description: 'What to search for',
                type: discord_js_1.ApplicationCommandOptionType.String,
                required: true,
            }
        ]
    },
    {
        name: 'game',
        description: '🎮 Look up a game in the TechPlay database',
        options: [
            {
                name: 'name',
                description: 'Game name to search for',
                type: discord_js_1.ApplicationCommandOptionType.String,
                required: true,
            }
        ]
    },
    {
        name: 'trivia',
        description: '🧠 Start a tech trivia question (win XP!)',
    },
    {
        name: 'daily',
        description: '🎁 Claim your daily XP bonus',
    },
    {
        name: 'leaderboard',
        description: '🏆 View the TechPlay XP leaderboard',
    },
    {
        name: 'stats',
        description: '📊 Show server statistics',
    },
    {
        name: 'help',
        description: '❓ Show all available commands',
    },
    {
        name: 'tip',
        description: '💡 Get a random gaming/tech tip from Professor Buffy',
    },
    {
        name: 'techplay',
        description: '🌐 Check the status of TechPlay.gg services',
    },
    {
        name: 'latest',
        description: '📰 Get the latest news articles',
    },
    {
        name: 'giveaways',
        description: '🎁 List active giveaways',
    },
    {
        name: 'forum',
        description: '💬 Show trending forum discussions',
    },
    {
        name: 'subscribe',
        description: '📬 Manage notification subscriptions',
        options: [
            {
                name: 'news',
                description: 'Toggle news notifications',
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'giveaway',
                description: 'Toggle giveaway notifications',
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'status',
                description: 'View your current subscriptions',
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            }
        ]
    },
    {
        name: 'gift',
        description: '🎁 Gift XP to another user',
        options: [
            {
                name: 'user',
                description: 'The user to gift XP to',
                type: discord_js_1.ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount of XP to gift (minimum 10)',
                type: discord_js_1.ApplicationCommandOptionType.Integer,
                required: true,
                min_value: 10,
                max_value: 1000,
            }
        ]
    },
    {
        name: 'challenge',
        description: '⚔️ Challenge another user to a trivia duel',
        options: [
            {
                name: 'user',
                description: 'The user to challenge',
                type: discord_js_1.ApplicationCommandOptionType.User,
                required: true,
            }
        ]
    },
    {
        name: 'admin',
        description: '⚙️ Admin tools for TechPlay',
        default_member_permissions: discord_js_1.PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'stats',
                description: 'Get detailed site and discord stats',
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'recap',
                description: 'Manually trigger the weekly recap post',
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'xp',
                description: 'Manage user XP',
                type: discord_js_1.ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'give',
                        description: 'Give XP to a user',
                        type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'user',
                                description: 'The user to give XP to',
                                type: discord_js_1.ApplicationCommandOptionType.User,
                                required: true,
                            },
                            {
                                name: 'amount',
                                description: 'Amount of XP to give',
                                type: discord_js_1.ApplicationCommandOptionType.Integer,
                                required: true,
                                min_value: 1,
                            }
                        ]
                    },
                    {
                        name: 'remove',
                        description: 'Remove XP from a user',
                        type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'user',
                                description: 'The user to remove XP from',
                                type: discord_js_1.ApplicationCommandOptionType.User,
                                required: true,
                            },
                            {
                                name: 'amount',
                                description: 'Amount of XP to remove',
                                type: discord_js_1.ApplicationCommandOptionType.Integer,
                                required: true,
                                min_value: 1,
                            }
                        ]
                    }
                ]
            },
            {
                name: 'announce',
                description: 'Make an announcement as Professor Buffy',
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'message',
                        description: 'The announcement message',
                        type: discord_js_1.ApplicationCommandOptionType.String,
                        required: true,
                    }
                ]
            },
            {
                name: 'event',
                description: 'Start a community event',
                type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Name of the event',
                        type: discord_js_1.ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'duration',
                        description: 'Duration in hours',
                        type: discord_js_1.ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 1,
                        max_value: 168,
                    }
                ]
            }
        ]
    }
];
