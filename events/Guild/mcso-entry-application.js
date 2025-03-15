const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
    ActionRowBuilder,
    EmbedBuilder,
    PermissionsBitField,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    Events,
    ChannelType,
    Embed
} = require("discord.js");

const ftp = require("basic-ftp");
const fs = require("fs");
const path = require("path");
const client = require("../../department-utilities");
const applicationResponseSchemas = require('../../schemas/applicationResponses.js');

module.exports = {
    name: "mcsoentryapplication",
};

let isWaitingForResponse = new Map();

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === "mcso-entry-application") {
            handleApplicationStart(interaction);
        } else if (interaction.customId.startsWith("mcsoentry_accept-") || interaction.customId.includes("mcsoentry_deny-") || interaction.customId.startsWith('mcsoentry_accept_') || interaction.customId.startsWith('mcsoentry_deny_')) {
            handleApplicationReview(interaction);
        } else if (interaction.customId.includes("mcsoentry_application_history")) {
            handleApplicationHistory(interaction);
        } else if (interaction.customId.includes("mcsoentry_open_ticket")) {
            handleOpenTicket(interaction);
        } else if (interaction.customId.includes("mcsoentry_further_feedback")) {
            handleFurtherFeedback(interaction);
        }
    } else if (interaction.isModalSubmit() && interaction.customId.includes('-modal') &&  interaction.customId.includes('mcsoentry')) {
        handleModalSubmit(interaction);
    }
});

async function handleApplicationStart(interaction) {
    const user = interaction.user;
    const questions = getQuestions();

    if (isWaitingForResponse.get(user.id)) {
        await interaction.reply({ content: "You are already in the process of filling out an application. Please complete the current one before starting a new one.", ephemeral: true });
        return;
    }

    try {
        await interaction.reply({ content: "The application process has started. Please check your DMs.", ephemeral: true });
        const initialEmbed = new EmbedBuilder()
            .setColor("#c5a86b")
            .setTitle("MCSO Entry Application")
            .setDescription("Please answer the questions below. Use proper grammar, punctuation, spelling, detail, and professionalism in written response questions.");
        await user.send({ embeds: [initialEmbed] });

        let responses = {};
        isWaitingForResponse.set(user.id, true);

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const questionEmbed = new EmbedBuilder()
                .setColor("#c5a86b")
                .setDescription(question);

            let response;
            if (question.includes("(Yes, No)")) {
                const options = question.match(/\(([^)]+)\)/)[1].split(', ');
                questionEmbed.setFooter({ text: "Select an option below" });
                response = await getSelectionResponse(user, options, questionEmbed);
            } else {
                await user.send({ embeds: [questionEmbed] });
            
                const responseCollection = await user.dmChannel.awaitMessages({
                    filter: msg => msg.author.id === user.id,
                    max: 1,
                    time: 1200000, // 10 minutes
                });
            
                if (responseCollection.size > 0) {
                    response = responseCollection.first().content;
                } else {
                    response = 'No response';
                }
            }            

            responses[`question${i + 1}`] = response;

            const answeredEmbed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(`**${question}**\n${response}`);

            const messages = await user.dmChannel.messages.fetch({ limit: 10 });
            const questionMessage = messages.find(msg => msg.embeds.length && msg.embeds[0].description === question);

            if (questionMessage) {
                await questionMessage.edit({ embeds: [answeredEmbed] });
            } else {
                await user.send({ embeds: [answeredEmbed] });
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        await saveApplication(interaction, user, responses, questions);

    } catch (error) {
        console.error(error);
        const errorEmbed = new EmbedBuilder()
            .setDescription("There was an error processing your application. Please try again later or open a ticket in <#1091904274650374316>.")
            .setColor('Red');
        await user.send({ embeds: [errorEmbed] });
    } finally {
        isWaitingForResponse.delete(user.id);
    }
}

function getQuestions() {
    return [
        "How old are you?",
        "Why do you want to join the Maple County Sheriff's Office?",
        "Why should we select you over other applicants?",
        "How would you perform a routine traffic stop? List all steps. You may use bullet points or paragraph form (recommended).",
        "What would you do if another vehicle pulled up while on a routine traffic stop? List all steps. You may use bullet points or paragraph form (recommended).",
        "What items are required on a traffic stop?",
        "How would you perform a code 5 (felony traffic stop)? List all steps. You may use bullet points or paragraph form (recommended).",
        "Are you familiar with 10-codes? If so, which ones are you familiar with?",
        "How would you handle a situation in which you believe another deputy is in the wrong?",
        "How would you rate your grammar on a scale of 1-10?",
        "How would you rate your maturity on a scale of 1-10?",
        "Do you understand that MCSO administration can deny your application for any reason they see fit, that you will have 14 days to go through training and ride along processes, and that you will not be allowed to patrol as a cadet? (Yes, No)"
    ];
}

async function getSelectionResponse(user, options, embed) {
    const selectionMenu = new StringSelectMenuBuilder()
        .setCustomId('select')
        .setPlaceholder('Select an option')
        .addOptions(
            options.map(option => ({
                label: option,
                value: option,
            }))
        );

    const selectionRow = new ActionRowBuilder().addComponents(selectionMenu);
    const message = await user.send({ embeds: [embed], components: [selectionRow] });

    const collected = await message.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        time: 600000,
    });

    await collected.update({ components: [] });
    return collected.values[0];
}

async function saveApplication(interaction, user, responses, questions) {
    const now = new Date();
    const application = new applicationResponseSchemas({
        applicationName: "mcso-entry-application",
        userId: user.id,
        submittedTimestamp: now.toISOString(),
        lastUpdated: now.toISOString(),
        messageLink: "",
        status: "Pending",
        updatedBy: `1253333155792818197`
    });

    await application.save();

    const duration = Math.floor((Date.now() - interaction.createdTimestamp) / 1000);
    const joinedAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
    const joinedGuild = `<t:${Math.floor((await interaction.guild.members.fetch(user)).joinedAt / 1000)}:R>`;

    const embedDescription = `**Questions and Answers:**\n${Object.keys(responses).map((key, index) => `**${questions[index]}**\n${responses[key]}`).join('\n\n')}\n\n` +
        `**Application Stats:**\n` +
        `**User ID:** \`${user.id}\`\n` +
        `**Username:** \`${user.username}\`\n` +
        `**User:** ${user}\n` +
        `**Duration:** \`${duration} seconds (${(duration / 60).toFixed(2)} minutes)\`\n` +
        `**Account created** ${joinedAt}\n` +
        `**Joined guild** ${joinedGuild}`;
        
    const summaryEmbed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle(`${user.tag}'s MCSO Entry Application`);

    if (embedDescription.length > 4096) {
        const htmlContent = generateApplicationHTML(user.username, questions, responses);
        const uploadLink = await uploadApplicationToFTP(application, htmlContent, user);

        summaryEmbed.setDescription(`This application is too long to display in an embed. Please view it [on the web](${uploadLink}).\n\n` +
        `**Application Stats:**\n` +
        `**User ID:** \`${user.id}\`\n` +
        `**Username:** \`${user.username}\`\n` +
        `**User:** ${user}\n` +
        `**Duration:** \`${duration} seconds (${(duration / 60).toFixed(2)} minutes)\`\n` +
        `**Account created** ${joinedAt}\n` +
        `**Joined guild** ${joinedGuild}`);
    } else {
        summaryEmbed.setDescription(embedDescription);
    }

    try {
        const channel = await client.channels.fetch('1284262549511995433');
        const message = await channel.send({
            content: "@everyone",
            embeds: [summaryEmbed],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`mcsoentry_accept-${user.id}`)
                            .setLabel('Accept')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`mcsoentry_deny-${user.id}`)
                            .setLabel('Deny')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(`mcsoentry_accept_feedback-${user.id}`)
                            .setLabel('Accept with Feedback')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`mcsoentry_deny_reason-${user.id}`)
                            .setLabel('Deny with Reason')
                            .setStyle(ButtonStyle.Danger),
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`mcsoentry_application_history-${user.id}`)
                            .setLabel('Application History')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`mcsoentry_further_feedback-${user.id}`)
                            .setLabel('Further Feedback')
                            .setStyle(ButtonStyle.Secondary),
                    )
            ]
        });

        application.messageLink = message.url;
        await application.save();

        const thankYouEmbed = new EmbedBuilder()
            .setColor("#c5a86b")
            .setDescription("Thank you for submitting your application! You should receive your results within the next 72 hours (3 days). If you do not, reach out to a high command member.");

        await user.send({ embeds: [thankYouEmbed] });

    } catch (error) {
        console.error("Failed to send message to channel:", error);
        const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("There was an error processing your application. Please try again later or reach out to a high command member.");
        await user.send({ embeds: [errorEmbed] });
    }
}

function generateApplicationHTML(username, questions, responses) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mcsoentry Application</title>
    <link rel="icon" type="image/x-icon" href="https://cdn.maplecountysfinestroleplay.xyz/mcfrp-mcso.png">
    <link rel="stylesheet" type="text/css" href="https://maplecountysfinestroleplay.xyz/style.css">
</head>
<body>
    <header>
        <h1>MCSO Entry Application for ${username}</h1>
        <p>Review the application carefully!</p>
    </header>

    <div class="content">
        <section class="description">
            ${questions.map((question, index) => `
                <div class="application-log">
                    <h3>${question}</h3>
                    <p>${responses[`question${index + 1}`]}</p>
                    <hr>
                </div>
            `).join('')}
        </section>
    </div>

    <footer>
        <p>&copy; 2024 Maple County's Finest Roleplay & TheDylanator. All rights reserved. | THIS IS CONFIDENTIAL INFORMATION.</p>
    </footer>
</body>
</html>`;
}

async function uploadApplicationToFTP(application, content, user) {
    const ftpClient = new ftp.Client();
    ftpClient.ftp.verbose = true;
    let uploadLink = "";

    try {
        console.log("Connecting to FTP server...");
        await ftpClient.access({
            host: "",
            user: '',
            password: '',
            secure: false
        });

        const fileName = `application_${user.username}_${Date.now()}.html`;
        const remoteFilePath = `/mcso/${fileName}`;

        await ftpClient.ensureDir("/mcso/");

        const tempFilePath = path.join(__dirname, fileName);
        fs.writeFileSync(tempFilePath, content);

        console.log(`Uploading file to: ${remoteFilePath}`);
        await ftpClient.uploadFrom(tempFilePath, remoteFilePath);

        fs.unlinkSync(tempFilePath);

        uploadLink = `https://app.maplecountysfinestroleplay.xyz/mcso/${fileName}`;
        console.log(`File uploaded successfully. Access it at: ${uploadLink}`);

    } catch (err) {
        console.error("FTP upload failed", err);
    } finally {
        ftpClient.close();
    }

    return uploadLink;
}

async function findApplication(userId) {
    const statuses = ["Pending", "Additional Review - Further Feedback", "Additional Review - Ticket Opened"];
    for (const status of statuses) {
        const application = await applicationResponseSchemas.findOne({ userId, status, applicationName: "mcso-entry-application" });
        if (application) return application;
    }
    return null;
}

async function handleApplicationReview(interaction) {
    const { customId, message } = interaction;
    const embed = message.embeds[0];
    const actionParts = customId.split('-');
    const action = actionParts[0];
    const userId = actionParts[1].split('_')[0];

    const now = new Date();

    if (action === "mcsoentry_accept_feedback" || action === "mcsoentry_deny_reason") {
        const modal = new ModalBuilder()
            .setCustomId(`${customId}-modal`)
            .setTitle(action === 'mcsoentry_accept_feedback' ? 'Accept Feedback' : 'Deny Reason')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('reason')
                        .setLabel(action === 'mcsoentry_accept_feedback' ? 'Feedback' : 'Reason')
                        .setStyle(TextInputStyle.Paragraph)
                )
            );

        return await interaction.showModal(modal);
    } else {
        const status = action.includes("accept") ? 'Accepted' : 'Denied';
        const statusColor = status === 'Accepted' ? 'Green' : 'Red';

        const updatedEmbed = EmbedBuilder.from(embed).setColor(statusColor);

        let newContent = message.content.replace(/<@&\d+>/g, "");
        newContent = `${interaction.user} ${status.toLowerCase()} <@${userId}>'s MCSO Entry Application`;

        await message.edit({ content: newContent, embeds: [updatedEmbed], components: [] });
        await interaction.update({ content: newContent, embeds: [updatedEmbed], components: [] });

        const application = await findApplication(userId);
        if (!application) {
            await interaction.followUp({ content: 'Application not found.', ephemeral: true });
            return;
        }

        application.status = status;
        application.updatedBy = interaction.user.id;
        application.lastUpdated = now.toISOString();
        await application.save();

        const applicant = await client.users.fetch(userId);
        const applicantMember = await interaction.guild.members.fetch(userId);

        if (status.toLowerCase() === "accepted") {
            await applicantMember.roles.add('1283918634657386507');
        }

        const applicationMessage = `Your MCSO Entry Application has been ${status.toLowerCase()}.`;

        const additionalText = status === 'Accepted'
            ? `Please review and follow all steps in <#1283915435032576135> to become a cadet in the MCSO. We can't wait to see you in the department!`
            : `You may reapply at any time. Please do not contact the HR team about why your application was denied.`;

        const finalMessage = `${applicationMessage}\n\n${additionalText}`;

        const resultEmbed = new EmbedBuilder()
            .setColor(statusColor)
            .setDescription(finalMessage);

        await applicant.send({ embeds: [resultEmbed] });
    }
}

async function handleApplicationHistory(interaction) {
    const userId = interaction.customId.split('-')[1];
    const user = await client.users.fetch(userId);
    const applications = await applicationResponseSchemas.find({ guildId: interaction.guild.id, userId }).sort({ submittedTimestamp: -1 });

    if (applications.length === 0) {
        await interaction.reply({ content: 'No application history found.', ephemeral: true });
        return;
    }

    const applicationsDescription = applications.map(app => {
        return (
            `**Application Name:** ${app.applicationName}\n` +
            `**Status:** ${app.status}\n` +
            `**Submitted:** <t:${Math.floor(new Date(app.submittedTimestamp).getTime() / 1000)}:R>\n` +
            `**Last Updated:** <t:${Math.floor(new Date(app.lastUpdated).getTime() / 1000)}:R>\n` +
            `**Updated By:** <@${app.updatedBy}>\n` +
            `[**Jump to Application**](${app.messageLink})\n`
        )
    }).join('\n');

    const historyEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`${user.username}'s Applications`)
        .setDescription(applicationsDescription);

    await interaction.reply({ embeds: [historyEmbed], ephemeral: true });
}

async function handleFurtherFeedback(interaction) {
    const { customId, message } = interaction;
    const userId = customId.split('-')[1];
    const now = new Date();

    const application = await findApplication(userId);
    const originalUser = await interaction.client.users.fetch(userId);

    if (!application) {
        await interaction.followUp({ content: 'Application not found.', ephemeral: true });
        return;
    }

    const threadName = `${originalUser.username}'s MCSO Entry Application`;
    const thread = await message.startThread({
        name: threadName,
        autoArchiveDuration: 1440,
        reason: 'Further Feedback Requested'
    });

    application.status = "Additional Review - Further Feedback";
    application.updatedBy = interaction.user.id;
    application.lastUpdated = now.toISOString();
    await application.save();

    const newContent = `${interaction.user} has requested additional feedback on this application.`;
    await message.edit({ content: newContent, embeds: message.embeds });

    const feedbackEmbed = new EmbedBuilder()
        .setColor("Orange")
        .setDescription("A further review of this application has been requested. Please participate in the discussion in the newly created thread.");
    await thread.send({ embeds: [feedbackEmbed], content: `<@${userId}>` });

    await interaction.reply({ content: `Thread for further feedback has been created: ${thread}`, ephemeral: true });
}

async function handleModalSubmit(interaction) {
    const { customId, fields } = interaction;
    const userId = customId.split('-')[1];
    const action = customId.split('_')[0];
    const status = action === 'mcsoentry_accept' ? 'Accepted' : 'Denied';
    const reason = fields.getTextInputValue('reason');
    const now = new Date();

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(status === 'Accepted' ? 'Green' : 'Red');

    await interaction.update({ content: `${interaction.user} has ${status.toLowerCase()} <@${userId}>'s MCSO Entry Application\n\n**Feedback provided by application reviewer:**\n\`\`\`${reason}\`\`\``, embeds: [embed], components: [] });

    const application = await findApplication(userId);
    if (!application) {
        await interaction.followUp({ content: 'Application not found.', ephemeral: true });
        return;
    }

    application.status = status;
    application.updatedBy = interaction.user.id;
    application.lastUpdated = now.toISOString();
    await application.save();

    const applicant = await client.users.fetch(userId);
    const applicantMember = await interaction.guild.members.fetch(userId);

    if (status.toLowerCase() === "accepted") {
        await applicantMember.roles.add('1283918634657386507');
    }

    const applicationMessage = `**Your MCSO Entry Application has been ${status.toLowerCase()}.**`;

    const additionalText = status === 'Accepted'
        ? `Please review and follow all steps in <#1283915435032576135> to become a cadet in the MCSO. We can't wait to see you in the department!`
        : `You may reapply at any time. Please do not contact HR about why your application was denied.`;

    const finalMessage = reason
        ? `${applicationMessage}\n\n${additionalText}\n\n**Feedback provided by application reviewer:**\n\`\`\`${reason}\`\`\``
        : `${applicationMessage}\n\n${additionalText}`;

    const resultEmbed = new EmbedBuilder()
        .setColor(status === 'Accepted' ? 'Green' : 'Red')
        .setDescription(finalMessage);

    await applicant.send({ embeds: [resultEmbed] });
}