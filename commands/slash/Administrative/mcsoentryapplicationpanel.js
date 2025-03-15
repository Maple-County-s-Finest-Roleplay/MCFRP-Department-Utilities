const { performance } = require('perf_hooks');
const database = require('../../../schemas/shift');
const { EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: "mcsoentryapplicationpanel",
    description: "does very skibiti things",
    type: 1,
    permissions: {
        DEFAULT_PERMISSIONS: [], // Client permissions needed
        DEFAULT_MEMBER_PERMISSIONS: [PermissionFlagsBits.Administrator] // Only high command can run this command
    },
    run: async (client, interaction, config, db) => {
        if (!interaction.user.id == "802325785507397672") {
            return interaction.reply("Only high command can run this command!");
        }

        // Split description into smaller strings and concatenate them
        const description = 
            "**Entry Requirements**\n" +
            "- Must have basic LEO knowledge/experience\n" +
            "- Must be over the age of 13 (14+ preferred)\n" +
            "- Must show good grammar, spelling, capitalization, and punctuation throughout the application\n" +
            "- Must be professional and willing to go through our training academy and ride along processes.\n\n" +
            
            "**Benefits of working at MCSO**\n" +
            "- Work in the best department in the State of Oakland\n" +
            "- PTO and VTO (LOA) offered\n" +
            "- Hourly pay + bonuses\n" +
            "- 4 divisions for you to join\n" +
            "- Opportunities to expand your knowledge in Law Enforcement and other fields\n\n" +
            
            "On behalf of everyone at the MCSO, good luck on your application! Select \"Apply\" to proceed with the application.";

        // Create the embed
        const mcsoEmbed = new EmbedBuilder()
            .setColor('#c5a86b') // Set the embed color
            .setTitle('Thank you for choosing MCSO!')
            .setDescription(description);

        // Create the button
        const mcsoButton = new ButtonBuilder()
            .setCustomId('mcso-entry-application') // Set the custom ID
            .setLabel('Apply') // Set the button label
            .setStyle(ButtonStyle.Primary); // Set the button style

        // Create an action row and add the button
        const actionRow = new ActionRowBuilder().addComponents(mcsoButton);

        // Send the embed and button in response to an interaction
        await interaction.channel.send({ 
            embeds: [mcsoEmbed], 
            components: [actionRow],
            ephemeral: true // Make it only visible to the user
        });
    }
};
