"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkService = void 0;
const ApiService_1 = require("./ApiService");
class LinkService {
    constructor() {
        // Map TechPlay Rank Name -> Discord Role Name
        this.rankRoleMap = {
            'Newbie': 'Newbie',
            'Gamer': 'Gamer',
            'Pro Gamer': 'Pro Gamer',
            'Elite': 'Elite',
            'Legend': 'Legend',
            // Staff Roles
            'Admin': 'Admin',
            'Moderator': 'Moderator',
            'Editor': 'Editor'
        };
        this.api = ApiService_1.ApiService.getInstance();
    }
    async handleLinkCommand(interaction) {
        // Instruction to link via website
        await interaction.reply({
            content: `🔗 **Connect your account!**\n\nTo link your Discord, simply go to your [Profile Settings](https://techplay.gg/settings) on the website and click "Connect Discord Account".\n\nAfter connecting, run \`/sync\` here to get your roles!`,
            ephemeral: true
        });
    }
    async handleSyncCommand(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const discordId = interaction.user.id;
        const data = await this.api.getUserByDiscordId(discordId);
        if (data && data.user) {
            const user = data.user;
            const rankName = user.rank;
            // Assign Rank roles
            await this.syncRoles(interaction.member, rankName);
            // Assign Achievement roles
            if (data.achievements && Array.isArray(data.achievements)) {
                for (const achievement of data.achievements) {
                    await this.syncRoleByName(interaction.member, achievement);
                }
            }
            await interaction.editReply(`✅ **Synced!**\nConnected to: **${user.name}** (@${user.username})\nRank: **${rankName}**\nXP: **${user.xp}**`);
        }
        else {
            await interaction.editReply({
                content: `❌ **Not Linked!**\nWe couldn't find a TechPlay account connected to this Discord ID.\n\nPlease go to [TechPlay Profile Settings](https://techplay.gg/settings) and connect your Discord account.`
            });
        }
    }
    async syncRoles(member, rankName) {
        if (!rankName)
            return;
        const roleName = this.rankRoleMap[rankName];
        if (!roleName)
            return;
        await this.syncRoleByName(member, roleName);
    }
    async syncRoleByName(member, roleName) {
        // Find role in guild
        const role = member.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        if (role) {
            try {
                // Check if user already has it
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    console.log(`Assigned role ${roleName} to ${member.user.tag}`);
                }
            }
            catch (error) {
                console.error(`Failed to assign role ${roleName}:`, error);
            }
        }
    }
}
exports.LinkService = LinkService;
