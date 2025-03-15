const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const client = require("../../department-utilities");
const config = require("../../config/config.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: "syncLeavesAndBans"
}

const departmentServers = [
    "1258472595527958638", // OSP
    "1151275644802580580", // FPD
    "1209648230753640550", // MCSO
    "1264344936703066266", // FFD
    "1258645245072117890", // ODOT
    "1074381965983227986", // MCC
    "1218160960771063838", // HTPD
];

const mainServerId = "1072621508175876218";

client.on('guildMemberRemove', async (member) => {
    try {
        const guildId = member.guild.id;
        const userId = member.id;

        // Check if the user was banned
        const banList = await member.guild.bans.fetch();
        const isBanned = banList.has(userId);

        if (!isBanned && guildId === mainServerId) {
            // User left on their own, kick from all department servers
            departmentServers.forEach(async (serverId) => {
                const deptGuild = client.guilds.cache.get(serverId);
                if (deptGuild) {
                    const user = await deptGuild.members.fetch(userId).catch(() => null);
                    if (user) {
                        await user.kick("User left the main server.");
                    }
                }
            });
        }
    } catch (error) {
        console.error(`Error while kicking user from department servers: ${error.message}`);
    }
});

client.on('guildBanAdd', async (ban) => {
    try {
        const { user, guild } = ban;

        if (guild.id === mainServerId) {
            // User got banned from the main server, ban them from all department servers
            departmentServers.forEach(async (serverId) => {
                const deptGuild = client.guilds.cache.get(serverId);
                if (deptGuild) {
                    await deptGuild.members.ban(user.id, { reason: "Banned from the main server." })
                        .catch((error) => console.error(`Failed to ban user in ${deptGuild.name}: ${error.message}`));
                }
            });
        }
    } catch (error) {
        console.error(`Error while banning user from department servers: ${error.message}`);
    }
});

// Listen for guildBanRemove to unban users from department servers when unbanned from the main server
client.on('guildBanRemove', async (ban) => {
    try {
        const { user, guild } = ban;

        if (guild.id === mainServerId) {
            // User got unbanned from the main server, unban them from all department servers
            departmentServers.forEach(async (serverId) => {
                const deptGuild = client.guilds.cache.get(serverId);
                if (deptGuild) {
                    await deptGuild.members.unban(user.id)
                        .catch((error) => console.error(`Failed to unban user in ${deptGuild.name}: ${error.message}`));
                }
            });
        }
    } catch (error) {
        console.error(`Error while unbanning user from department servers: ${error.message}`);
    }
});