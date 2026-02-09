import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';

/**
 * All slash command definitions for the TechPlay Discord bot.
 * These are registered with Discord's API on startup.
 */
export const commands = [
    {
        name: 'profile',
        description: '📜 View your or someone else\'s TechPlay profile',
        options: [
            {
                name: 'user',
                description: 'The user to view (leave empty for yourself)',
                type: ApplicationCommandOptionType.User,
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
                type: ApplicationCommandOptionType.String,
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
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'giveaway',
                description: 'Toggle giveaway notifications',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'status',
                description: 'View your current subscriptions',
                type: ApplicationCommandOptionType.Subcommand,
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
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount of XP to gift (minimum 10)',
                type: ApplicationCommandOptionType.Integer,
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
                type: ApplicationCommandOptionType.User,
                required: true,
            }
        ]
    },
    {
        name: 'admin',
        description: '⚙️ Admin tools for TechPlay',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'stats',
                description: 'Get detailed site and discord stats',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'recap',
                description: 'Manually trigger the weekly recap post',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'xp',
                description: 'Manage user XP',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'give',
                        description: 'Give XP to a user',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'user',
                                description: 'The user to give XP to',
                                type: ApplicationCommandOptionType.User,
                                required: true,
                            },
                            {
                                name: 'amount',
                                description: 'Amount of XP to give',
                                type: ApplicationCommandOptionType.Integer,
                                required: true,
                                min_value: 1,
                            }
                        ]
                    },
                    {
                        name: 'remove',
                        description: 'Remove XP from a user',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'user',
                                description: 'The user to remove XP from',
                                type: ApplicationCommandOptionType.User,
                                required: true,
                            },
                            {
                                name: 'amount',
                                description: 'Amount of XP to remove',
                                type: ApplicationCommandOptionType.Integer,
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
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'message',
                        description: 'The announcement message',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    }
                ]
            },
            {
                name: 'event',
                description: 'Start a community event',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Name of the event',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'duration',
                        description: 'Duration in hours',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 1,
                        max_value: 168,
                    }
                ]
            }
        ]
    }
];
