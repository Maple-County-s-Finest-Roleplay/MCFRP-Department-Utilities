const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    name: "mcsoaprequestpanel", // Command name
    description: "does very skibiti things", // Command description
    type: 1, // Command type
    options: [], // Command options
    permissions: {
        DEFAULT_PERMISSIONS: "", // Client permissions needed
        DEFAULT_MEMBER_PERMISSIONS: "Administrator" // User permissions needed
    },
    run: async (client, interaction, config, db) => {
        if (interaction.user.id !== "802325785507397672") {
            return interaction.reply({ content: "Only high command can run this command!", ephemeral: true });
        }

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor("#c5a86b")
            .setTitle("Department AP Request")
            .setDescription("Please provide all the necessary information in the AP request, as it will be used to include you in our department roster. When this is completed successfully, you will receive your cadet roles in the MCSO.\n\n**Before submitting a request, make sure to join the [MCSO ROBLOX Group](https://www.roblox.com/groups/33812377/mcso#!/about).**");

        // Create a button that will trigger a modal
        const button = new ButtonBuilder()
            .setCustomId('mcso-ap-request')
            .setLabel('AP Request')
            .setStyle(ButtonStyle.Success);

        // Create an action row to hold the button
        const row = new ActionRowBuilder().addComponents(button);

        // Send the embed and button
        await interaction.channel.send({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });

    }
};
