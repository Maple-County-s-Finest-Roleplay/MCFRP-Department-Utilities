const { performance } = require('perf_hooks');
const database = require('../../../schemas/shift');

module.exports = {
    name: "ping",
    description: "Replies with pong!",
    type: 1,
    options: [
        {
            type: 1, // Sub-command type
            name: "bot",
            description: "Check the bot ping.",
            options: []
        },
        {
            type: 1, // Sub-command type
            name: "database",
            description: "Check the database ping.",
            options: []
        }
    ],
    permissions: {
        DEFAULT_MEMBER_PERMISSIONS: "SendMessages"
    },
    run: async (client, interaction, config, db) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "bot") {
            await interaction.reply("Pinging Dallas, TX...");
            const ping = client.ws.ping;

            let serverPingMessage;
            if (ping >= 150) {
                serverPingMessage = `<:red:1109452796845105184> Pong! Bot ping: \`${ping}ms\``;
            } else if (ping >= 100) {
                serverPingMessage = `<:orange:1109452795834269726> Pong! Bot ping: \`${ping}ms\``;
            } else if (ping <= 34) {
                serverPingMessage = `<:green:1109452798103404624> Pong! Bot ping: \`${ping}ms\``;
            }

            await interaction.editReply(serverPingMessage);
        } else if (subcommand === "database") {
            await interaction.reply("Pinging Iowa, USA...");

            try {
                const databaseStartTime = performance.now();

                await database.findOne({ userId: '802325785507397672' });

                const databasePing = performance.now() - databaseStartTime;
                const formattedDatabasePing = databasePing.toFixed(0);

                let databasePingMsg;
                if (formattedDatabasePing >= 150) {
                    databasePingMsg = `<:red:1109452796845105184> Possible issues at MongoDB. Contact Dylan if errors with the shifts system occur. Database ping: \`${formattedDatabasePing}ms\``;
                } else if (formattedDatabasePing >= 100) {
                    databasePingMsg = `<:orange:1109452795834269726> Pong! Database ping: \`${formattedDatabasePing}ms\``;
                } else if (formattedDatabasePing <= 34) {
                    databasePingMsg = `<:green:1109452798103404624> Pong! Database ping: \`${formattedDatabasePing}ms\``;
                }

                await interaction.editReply({ content: `${databasePingMsg}` });
            } catch (error) {
                console.error("Error occurred while pinging the database:", error);
                await interaction.editReply("An error occurred while pinging the database.");
            }
        } else {
            await interaction.reply("Please specify a valid subcommand: `bot` or `database`.");
        }
    }
};
