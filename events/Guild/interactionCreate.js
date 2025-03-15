const { EmbedBuilder } = require("discord.js");
const client = require("../../department-utilities");
const config = require("../../config/config.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  name: "interactionCreate"
};

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.slash_commands.get(interaction.commandName);

      if (!command) {
        console.error(`Command ${interaction.commandName} not found.`);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`Command \`${interaction.commandName}\` not found.`)
              .setColor('Red')
          ],
          ephemeral: true
        });
      }

      console.log(`The ${command.name} command has been run by ${interaction.user.username}`);
      await command.run(client, interaction, config, db);
    }

  } catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setDescription('An unexpected error occurred while processing the interaction.')
            .setColor('Red')
        ],
        ephemeral: true
      });
    } else {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription('An unexpected error occurred while processing the interaction.')
            .setColor('Red')
        ],
        ephemeral: true
      });
    }
  }
});