const { EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
    name: "execute",
    description: "Executes code on the MCFRP Bot server",
    type: 1,
    options: [
        {
            name: "command",
            type: 3,
            description: "The command to execute on the server",
            required: false,
        }
    ],
    permissions: {
        DEFAULT_PERMISSIONS: "",
        DEFAULT_MEMBER_PERMISSIONS: "Administrator"
    },
    run: async (client, interaction, config, db) => {
        // Verify the user has the right permissions
        if (interaction.user.id !== '802325785507397672') {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: false });
        }

        const command = interaction.options.getString('command');

        try {
            interaction.reply({ content: `Executing command: \`${command}\``, ephemeral: false });

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error occurred:', error.message);
                    return interaction.followUp({ content: `Error occurred: \`\`\`${error.message}\`\`\``, ephemeral: false });
                }

                if (stderr) {
                    console.error('Standard error:', stderr);
                    return interaction.followUp({ content: `Standard error: \`\`\`${stderr}\`\`\``, ephemeral: false });
                }

                console.log('Command output:', stdout);
                interaction.followUp({ content: `\`\`\`${stdout}\`\`\``, ephemeral: false });
            });
        } catch (e) {
            console.error('Exception caught:', e);
            interaction.followUp({ content: `Exception caught: \`${e.message}\``, ephemeral: false });
        }
    },
};
