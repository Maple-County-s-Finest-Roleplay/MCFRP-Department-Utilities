const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    Events,
    Colors
} = require("discord.js");
const client = require("../../department-utilities");

module.exports = {
    name: "mcso-ap-modal",
};

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === "mcso-ap-request") {
            const modal = new ModalBuilder()
                .setCustomId('infoModal')
                .setTitle('Department Roster Submission');

            // Add text input fields to the modal
            const nameInput = new TextInputBuilder()
                .setCustomId('nameInput')
                .setLabel('Full Roleplay Name')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const timezoneInput = new TextInputBuilder()
                .setCustomId('timezoneInput')
                .setLabel('What is your timezone?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const notesInput = new TextInputBuilder()
                .setCustomId('notesInput')
                .setLabel('Anything we should know?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            // Replace the dropdown with a text input for Yes/No question
            const robloxGroupInput = new TextInputBuilder()
                .setCustomId('robloxGroupJoin')
                .setLabel('Have you joined the MCSO ROBLOX group? (Y/N)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            // Create action rows for inputs
            const nameRow = new ActionRowBuilder().addComponents(nameInput);
            const timezoneRow = new ActionRowBuilder().addComponents(timezoneInput);
            const notesRow = new ActionRowBuilder().addComponents(notesInput);
            const robloxGroupRow = new ActionRowBuilder().addComponents(robloxGroupInput);

            // Add inputs to the modal
            modal.addComponents(nameRow, timezoneRow, notesRow, robloxGroupRow);

            // Show the modal to the user
            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'infoModal') {
        const fullName = interaction.fields.getTextInputValue('nameInput');
        const timezone = interaction.fields.getTextInputValue('timezoneInput');
        const notes = interaction.fields.getTextInputValue('notesInput');
        const robloxGroupJoin = interaction.fields.getTextInputValue('robloxGroupJoin'); // Now a text input

        // Create an embed with the submitted data
        const submissionEmbed = new EmbedBuilder()
            .setColor('#c5a86b')
            .setTitle('New AP Request')
            .setDescription(`**Discord User ID:** ${interaction.user.id}\n**Discord Username:** ${interaction.user.username}\n**Roleplay Name:** ${fullName}\n**Timezone:** ${timezone}\n**Notes:** ${notes}\n**Joined MCSO ROBLOX Group:** ${robloxGroupJoin}`)
            .setFooter({ text: `${interaction.user.id}` });

        // Create accept and deny buttons
        const acceptButton = new ButtonBuilder()
            .setCustomId('accept-request')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const denyButton = new ButtonBuilder()
            .setCustomId('deny-request')
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder().addComponents(acceptButton, denyButton);

        // Send the embed with buttons to the designated channel
        const requestChannel = client.channels.cache.get('1286796856533192755');
        const message = await requestChannel.send({
            embeds: [submissionEmbed],
            components: [actionRow]
        });

        await interaction.reply({ content: 'Your request has been submitted.', ephemeral: true });
    }

    // Handle the Accept/Deny button interaction
    if (interaction.isButton()) {
        const embed = interaction.message.embeds[0];
        const userId = embed && embed.footer ? embed.footer.text : null;

        if (interaction.customId === 'accept-request') {
            // Assign roles in the first guild
            const mainGuild = client.guilds.cache.get('1209648230753640550');
            const mainMember = await mainGuild.members.fetch(userId);
            await mainMember.roles.add([
                '1209665751305162833',
                '1209674572094382140',
                '1209671781217214486',
                '1261094754754498623',
                '1209671858949988372'
            ]);

            // Assign roles in the second guild
            const secondGuild = client.guilds.cache.get('1072621508175876218');
            const secondMember = await secondGuild.members.fetch(userId);
            await secondMember.roles.add([
                '1072621508456882301',
                '1072621508377186352',
                '1072621508377186349'
            ]);

            // Send DM to the user
            const dmEmbed = new EmbedBuilder()
                .setColor("Green")
                .setTitle('Request Accepted')
                .setDescription('Your department AP request has been accepted! You have been added to the roster, and have been given your cadet roles. Check out <#1286081547451105321> for training information. Welcome aboard!');

            await mainMember.send({ embeds: [dmEmbed] });

            // Update the original embed color to green
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor('Green')
                .setFooter({ text: `Accepted by ${interaction.user.tag}` });

            // Acknowledge the button press and update the message
            await interaction.update({
                embeds: [updatedEmbed],
                content: `Request has been accepted by ${interaction.user}`,
                components: []
            });
        }

        if (interaction.customId === 'deny-request') {
            // Send a DM to the user informing about denial
            const denialEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle('Request Denied')
                .setDescription('Your AP request has been denied. Please ensure all your information is correct and try again.');

            await member.send({ embeds: [denialEmbed] });

            // Update the original embed color to red
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor('Red')
                .setFooter({ text: `Denied by ${interaction.user.tag}` });

            // Acknowledge the button press and update the message
            await interaction.update({
                embeds: [updatedEmbed],
                content: `Request has been denied by ${interaction.user}`,
                components: []
            });
        }
    }
});
