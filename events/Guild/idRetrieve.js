const { EmbedBuilder, PermissionsBitField, codeBlock, MessageType } = require("discord.js");
const client = require("../../department-utilities");
const config = require("../../config/config.js");
const db = require('../../schemas/shift.js');

module.exports = {
  name: "idRetrieve"
};

client.on("messageCreate", async (message) => {
  // Check if the message is a reply
  if (message.type === MessageType.Reply) {
    try {
      // Fetch the referenced message
      const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);

      // Check if the referenced message is the "shift end" message
      if (referencedMessage.content.includes("Shift ended successfully")) {
        // Check if the reply contains the specific user mention and the word "id"
        const userMention = message.mentions.users.first();
        if (userMention && message.content.toLowerCase().includes("id")) {
          // Extract the duration from the referenced message
          const durationMatch = referencedMessage.content.match(/Duration:\s*(\d+h,?\s*\d+m,?\s*\d+s)/);
          if (durationMatch && durationMatch[1]) {
            const durationString = durationMatch[1];

            // Convert duration string to seconds
            const durationInSeconds = convertDurationToSeconds(durationString);
            console.log(`Extracted duration in seconds: ${durationInSeconds}`);

            // Use the original author's ID to search the database
            const originalAuthorId = referencedMessage.author.id;

            // Search the database for the shift with the exact duration and user ID
            const shift = await db.findOne({ userId: originalAuthorId, shiftDuration: durationInSeconds, guildId: message.guild.id });
            console.log(`Database query result: ${shift}`);

            if (shift) {
              // Send the shift ID to the user who replied
              await message.reply(`The shift ID is: \`${shift.shiftId}\``);
            } else {
              await message.reply("Could not find a shift with the specified duration for the original message sender.");
            }
          } else {
            await message.reply("Could not find a duration in the referenced message.");
          }
        }
      }
    } catch (error) {
      console.error("Error processing the reply message: ", error);
      await message.reply("An error occurred while processing your request. Please try again later.");
    }
  }
});

// Helper function to convert duration string to seconds
function convertDurationToSeconds(duration) {
  const regex = /(\d+)h,?\s*(\d+)m,?\s*(\d+)s/;
  const matches = duration.match(regex);

  let totalSeconds = 0;
  if (matches[1]) totalSeconds += parseInt(matches[1]) * 3600; // hours to seconds
  if (matches[2]) totalSeconds += parseInt(matches[2]) * 60;   // minutes to seconds
  if (matches[3]) totalSeconds += parseInt(matches[3]);       // seconds

  return totalSeconds;
}
