const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const applicationResponseSchemas = require('../../../schemas/applicationResponses.js');

module.exports = {
    name: "application", // Name of the command
    description: "Manage applications", // Command description
    type: 1, // Command type (1 is for chat input commands)
    options: [
        {
            name: "history",
            description: "Get the application history of a user",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "The user to get the application history for",
                    type: 6, // User type
                    required: true
                }
            ]
        },
        {
            name: "stats",
            description: "Get application statistics",
            type: 1,
            options: []
        },
    ],
    permissions: {
        DEFAULT_PERMISSIONS: [], // Client permissions needed
        DEFAULT_MEMBER_PERMISSIONS: [PermissionFlagsBits.ManageGuild] // User permissions needed
    },
    run: async (client, interaction, config, db) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'history') {
            const user = interaction.options.getUser('user');
            await handleApplicationHistory(interaction, user);
        } else if (subcommand === 'stats') {
            await handleApplicationStats(interaction, 'Application Statistics');
        }
    },
};

// Fetch and display the application history for a specific user
async function handleApplicationHistory(interaction, user) {
    const applications = await applicationResponseSchemas.find({ userId: user.id }).sort({ submittedTimestamp: -1 });

    if (applications.length === 0) {
        await interaction.reply({ content: 'No application history found.', ephemeral: true });
        return;
    }

    const applicationsDescription = applications.map(app => {
        const lastUpdatedTimestamp = app.lastUpdated ? `<t:${Math.floor(new Date(app.lastUpdated).getTime() / 1000)}:R>` : 'N/A';
        return (
            `**Application Name:** ${app.applicationName}\n` +
            `**Status:** ${app.status}\n` +
            `**Submitted:** <t:${Math.floor(new Date(app.submittedTimestamp).getTime() / 1000)}:R>\n` +
            `**Last Updated:** ${lastUpdatedTimestamp}\n` +
            `**Updated By:** <@${app.updatedBy}>\n` +
            `[**Jump to Application**](${app.messageLink})\n`
        );
    }).join('\n');

    const historyEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`${user.username}'s Applications`)
        .setDescription(applicationsDescription);

    await interaction.reply({ embeds: [historyEmbed], ephemeral: true });
}

// Fetch and display statistics for a specific type of application
async function handleApplicationStats(interaction, embedTitle) {
    const totalApplications = await applicationResponseSchemas.countDocuments({ guildId: interaction.guild.id });
    const acceptedApplications = await applicationResponseSchemas.countDocuments({ guildId: interaction.guild.id, status: "Accepted" });
    const pendingApplications = await applicationResponseSchemas.countDocuments({
        guildId: interaction.guild.id,
        status: { $in: ["Pending", "Additional Review - Further Feedback", "Additional Review - Ticket Opened"] }
    });

    const acceptanceRate = totalApplications > 0 ? ((acceptedApplications / totalApplications) * 100).toFixed(2) : 0;

    const reviewers = await applicationResponseSchemas.aggregate([
        { $match: { guildId: interaction.guild.id, status: { $ne: "Pending" } } },
        { $group: { _id: "$updatedBy", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
    ]);

    const topReviewer = reviewers.length > 0 ? `<@${reviewers[0]._id}> with ${reviewers[0].count} reviews` : 'No reviewers found';

    const statsEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(embedTitle)
        .setDescription(
            `**Total Responses:** ${totalApplications}\n` +
            `**Acceptance Rate:** ${acceptanceRate}%\n` +
            `**Total Pending Applications:** ${pendingApplications}\n` +
            `**Top Reviewer:** ${topReviewer}`
        );

    await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
}