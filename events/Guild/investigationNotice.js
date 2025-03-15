const { 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    GatewayIntentBits, 
    ThreadAutoArchiveDuration
} = require('discord.js');
const client = require('../../department-utilities.js');

module.exports = {
    name: "investigationNoticeSubmitted"
};

client.on('messageCreate', async (message) => {
    // Ensure the message is from the specified guild and channel
    if (!message.guild) return
    if (message.guild.id !== '1072621508175876218') return;
    if (message.channel.id !== '1072621509388017721') return;

    // Check if the message contains any embeds
    if (message.embeds.length > 0) {
        // Get the first embed in the message
        const firstEmbed = message.embeds[0];

        // Initialize the report ID
        let reportID = '0000';

        // Check if the first embed has a footer and extract the report ID
        if (firstEmbed.footer && firstEmbed.footer.text) {
            const regexPattern = /\|\s*(\d+)\s*$/;  // Regex to extract the last number in the format
            const match = firstEmbed.footer.text.match(regexPattern);

            if (match && match[1]) {
                reportID = match[1];  // Use the extracted report ID
                console.log(`Extracted Report ID: ${reportID}`);
            } else {
                console.error("No valid report ID found in the embed footer.");
            }
        }

        // Check if the description contains "INVESTIGATION NOTICE" and "ADDED"
        if (firstEmbed.description && firstEmbed.description.includes("INVESTIGATION NOTICE") && firstEmbed.description.includes("ADDED")) {
            // Send all embeds to the target channel
            const targetChannel = await client.channels.fetch('1210697855392681994');
            const sentMessage = await targetChannel.send({
                content: `<@&1279447492118974557> <@&1279447526402949202> | [Mod Reference](${message.url})`,
                embeds: message.embeds
            });

            // Create a thread from the sent message with the extracted or default report ID
            const thread = await sentMessage.startThread({
                name: `Investigation Notice | Report #${reportID}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
            });

            // Add a message in the thread
            thread.send("Use this thread to attach any necessary files and discuss this case.");
        } else {
            return;
        }
    }
});
