const { 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    GatewayIntentBits 
} = require('discord.js');
const leaveSchema = require('../../schemas/leave');
const guildConfigSchema = require('../../schemas/guildConfig');
const client = require('../../department-utilities.js');
const cron = require('node-cron');

module.exports = {
    name: "leaveHandler"
};

const formatDiscordTimestamp = (date) => `<t:${Math.floor(date.getTime() / 1000)}:F>`;

// Function to fetch and format leaves
const fetchAndFormatLeaves = async () => {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    try {
        const activeLeaves = await leaveSchema.find({
            active: true
        });

        const upcomingLeaves = await leaveSchema.find({
            active: false,
            startDate: { $gte: now, $lte: threeDaysLater }
        });

        const formatLeaves = async (leaves) => {
            const formattedLeaves = await Promise.all(leaves.map(async (leave) => {
                const user = await client.users.fetch(leave.userId);
                const endDate = new Date(leave.startDate);
                endDate.setDate(endDate.getDate() + parseInt(leave.duration, 10));
                return `${user}'s ${leave.leaveType}:\n**Leave ID:** ${leave.leaveId}\n**Start Date:** ${formatDiscordTimestamp(new Date(leave.startDate))}\n**End Date:** ${formatDiscordTimestamp(new Date(endDate))}\n**Reason:** ${leave.reason}`;
            }));
            return formattedLeaves.join('\n') || 'None';
        };

        const activeLeavesFormatted = await formatLeaves(activeLeaves);
        const upcomingLeavesFormatted = await formatLeaves(upcomingLeaves);

        return {
            activeLeaves: `\u200B\n${activeLeavesFormatted}`,
            upcomingLeaves: `\u200B\n${upcomingLeavesFormatted}`,
        };
    } catch (error) {
        console.error('Error fetching leaves:', error);
        return {
            activeLeaves: 'Error fetching active leaves',
            upcomingLeaves: 'Error fetching upcoming leaves',
        };
    }
};

// Function to update the leave panel for a specific guild
const updateLeavePanel = async (guildConfig) => {
    const guild = await client.guilds.fetch(guildConfig.guildId);
    const channel = guild.channels.cache.get(guildConfig.leavePanelChannelId);

    if (!channel) {
        console.error(`Channel with ID ${guildConfig.leavePanelChannelId} not found`);
        return;
    }

    try {
        const fetchedMessages = await channel.messages.fetch({ limit: 50 });
        const panelMessage = fetchedMessages.find(msg => msg.embeds.length > 0);

        if (!panelMessage) {
            console.error(`No message with an embed found in channel ${guildConfig.leavePanelChannelId}`);
            return;
        }

        const leaveData = await fetchAndFormatLeaves();

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .addFields(
                { name: 'Active Leaves', value: leaveData.activeLeaves, inline: true },
                { name: 'Upcoming Leaves', value: leaveData.upcomingLeaves, inline: true }
            )

        if (typeof panelMessage.edit === 'function') {
            await panelMessage.edit({ embeds: [embed] });
            console.log(`Leave panel updated for guild ${guildConfig.guildId}`);
        } else {
            console.error('panelMessage.edit is not a function');
        }
    } catch (error) {
        console.error(`Error updating leave panel for guild ${guildConfig.guildId}: ${error.message}`);
    }
};

// Function to activate leaves whose start date is today for a specific guild
const activateLeaves = async (guildId) => {
    const today = new Date().toDateString();
    const leavesToActivate = await leaveSchema.find({ guildId: guildId, startDate: today, active: false });

    const guild = await client.guilds.fetch(guildId);
    const guildName = guild ? guild.name : 'your guild';

    for (const leave of leavesToActivate) {
        leave.active = true;
        await leave.save();

        const user = await client.users.fetch(leave.userId);
        await user.send(`Your leave request \`${leave.leaveId}\` is now active in **${guildName}**.`);
    }

    const guildConfig = await guildConfigSchema.findOne({ guildId });
    if (guildConfig) {
        await updateLeavePanel(guildConfig);
    }
};

// Function to deactivate leaves whose end date has passed for a specific guild
const deactivateLeaves = async (guildId) => {
    const today = new Date();
    const leavesToDeactivate = await leaveSchema.find({ guildId: guildId, active: true });

    const guild = await client.guilds.fetch(guildId);
    const guildName = guild ? guild.name : 'your guild';

    for (const leave of leavesToDeactivate) {
        const endDate = new Date(leave.startDate);
        endDate.setDate(endDate.getDate() + parseInt(leave.duration));

        if (today > endDate) {
            leave.active = false;
            await leave.save();

            const user = await client.users.fetch(leave.userId);
            await user.send(`Your leave request \`${leave.leaveId}\` has ended and is now deactivated in **${guildName}**.`);
        }
    }

    const guildConfig = await guildConfigSchema.findOne({ guildId });
    if (guildConfig) {
        await updateLeavePanel(guildConfig);
    }
};

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_leave_type') {
            const leaveType = interaction.values[0];

            const modal = new ModalBuilder()
                .setCustomId(`loa_modal_${leaveType}`)
                .setTitle('Request Leave of Absence');

            const startDateInput = new TextInputBuilder()
                .setCustomId('start_date')
                .setLabel('Start Date (MM-DD-YYYY)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const durationInput = new TextInputBuilder()
                .setCustomId('duration')
                .setLabel('Duration (in days)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(startDateInput),
                new ActionRowBuilder().addComponents(durationInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );

            await interaction.showModal(modal);
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('approve_leave_') || interaction.customId.startsWith('deny_leave_')) {
            const leaveId = interaction.customId.split('_')[2];
            const leave = await leaveSchema.findOne({ leaveId: leaveId });

            if (!leave) {
                return interaction.reply({ content: 'Leave request not found.', ephemeral: true });
            }

            try {
                const originalUser = await interaction.client.users.fetch(leave.userId);

                const startDate = new Date(leave.startDate);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + parseInt(leave.duration));

                const guild = await client.guilds.fetch(interaction.guild.id);
                const guildName = guild ? guild.name : 'your department';

                if (interaction.customId.startsWith('approve_leave_')) {
                    const leaveRequest = new EmbedBuilder()
                        .setTitle(`Leave request from ${originalUser.username}`)
                        .setAuthor({
                            name: originalUser.username,
                            iconURL: originalUser.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
                        })
                        .setDescription(
                            `Approved by ${interaction.user}\n\n**Leave ID:** ${leaveId}\n**Leave Type:** ${leave.leaveType}\n**Start Date:** ${formatDiscordTimestamp(new Date(leave.startDate))}\n**End Date:** ${formatDiscordTimestamp(new Date(endDate))}\n**Reason:** ${leave.reason}`
                        )
                        .setTimestamp()
                        .setColor('Green');

                    await interaction.message.edit({ embeds: [leaveRequest], components: [] });

                    const currentDate = new Date();
                    if (currentDate.toDateString() === startDate.toDateString()) {
                        leave.active = true;
                        await leave.save();
                        await interaction.reply({ content: `Leave request \`${leaveId}\` has been approved and is now active.`, ephemeral: true });
                        await originalUser.send(`Your leave request for **${guildName}** has been approved and is now active in.`);
                    } else {
                        await interaction.reply({ content: `Leave request \`${leaveId}\` has been approved and will be activated on the start date.`, ephemeral: true });
                        await originalUser.send(`Your leave request for **${guildName}** has been approved and will begin on the start date.`);
                    }
                } else if (interaction.customId.startsWith('deny_leave_')) {
                    await leaveSchema.deleteOne({ leaveId: leaveId });
                    const leaveRequest = new EmbedBuilder()
                        .setTitle(`Leave request from ${originalUser.username}`)
                        .setAuthor({
                            name: originalUser.username,
                            iconURL: originalUser.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
                        })
                        .setDescription(
                            `Denied by ${interaction.user}\n\n**Leave ID:** ${leaveId}\n**Leave Type:** ${leave.leaveType}\n**Start Date:** ${formatDiscordTimestamp(new Date(leave.startDate))}\n**End Date:** ${formatDiscordTimestamp(new Date(endDate))}\n**Reason:** ${leave.reason}`
                        )
                        .setTimestamp()
                        .setColor('Red');

                    await interaction.message.edit({ embeds: [leaveRequest], components: [] });
                    await interaction.reply({ content: `Leave request #${leaveId} has been denied and deleted.`, ephemeral: true });
                    await originalUser.send(`Your leave request has been denied and deleted in **${guildName}**.`);
                }

                const guildConfig = await guildConfigSchema.findOne({ guildId: interaction.guild.id });
                if (guildConfig) {
                    await updateLeavePanel(guildConfig);
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'An error occurred while processing the leave request.', ephemeral: true });
            }
        }
    } else if (interaction.isModalSubmit()) {
        const leaveType = interaction.customId.split('_')[2];
        const customId = interaction.customId;

        if (customId.startsWith('edit_loa_')) {
            const leaveId = parseInt(customId.split('_')[2], 10);
            const startDateString = interaction.fields.getTextInputValue('start_date');
            const duration = parseInt(interaction.fields.getTextInputValue('duration'), 10);
            const reason = interaction.fields.getTextInputValue('reason');
            const startDate = new Date(startDateString);

            if (isNaN(startDate.getTime())) {
                return interaction.reply({ content: 'Invalid date format. Please use MM-DD-YYYY.', ephemeral: true });
            }

            const leave = await leaveSchema.findOne({ leaveId: leaveId });

            if (!leave) {
                return interaction.reply({ content: 'Leave request not found.', ephemeral: true });
            }

            leave.startDate = startDate;
            leave.duration = duration;
            leave.reason = reason;
            await leave.save();

            await interaction.reply({ content: `Leave request #${leaveId} has been updated.`, ephemeral: true });

            const guildConfig = await guildConfigSchema.findOne({ guildId: interaction.guild.id });
            if (guildConfig) {
                await updateLeavePanel(guildConfig);
            }
        } else if (customId.startsWith('loa_modal')) {
            const startDateString = interaction.fields.getTextInputValue('start_date');
            const duration = parseInt(interaction.fields.getTextInputValue('duration'), 10);
            const reason = interaction.fields.getTextInputValue('reason');
            const startDate = new Date(startDateString);

            if (isNaN(startDate.getTime())) {
                return interaction.reply({ content: 'Invalid date format. Please use MM-DD-YYYY.', ephemeral: true });
            }

            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + duration);

            try {
                const leaveId = `L-${Math.random().toString(36).substring(2, 14)}`;
                const leave = new leaveSchema({
                    leaveId: leaveId,
                    userId: interaction.user.id,
                    guildId: interaction.guild.id,
                    leaveType: leaveType,
                    startDate: startDate,
                    duration: duration,
                    reason: reason,
                    guildId: interaction.guild.id,
                    active: false,
                });
                await leave.save();

                const leaveRequest = {
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`New leave request from ${interaction.user.username}`)
                            .setAuthor({
                                name: interaction.user.username,
                                iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
                            })
                            .setDescription(`**Leave ID:** ${leaveId}\n**Leave Type:** ${leaveType}\n**Start Date:** ${formatDiscordTimestamp(new Date(leave.startDate))}\n**End Date:** ${formatDiscordTimestamp(new Date(endDate))}\n**Reason:** ${reason}`)
                            .setTimestamp()
                            .setColor('Blue')
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`approve_leave_${leaveId}`)
                                .setLabel('Accept')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`deny_leave_${leaveId}`)
                                .setLabel('Deny')
                                .setStyle(ButtonStyle.Danger)
                        )
                    ]
                };

                const guildConfig = await guildConfigSchema.findOne({ guildId: interaction.guild.id });
                if (guildConfig) {
                    const hrChannel = interaction.client.channels.cache.get(guildConfig.leaveApprovalChannelId);
                    if (hrChannel) {
                        await hrChannel.send(leaveRequest);
                    }
                }

                await interaction.reply({ content: `Leave request #${leaveId} has been submitted.`, ephemeral: true });

                if (guildConfig) {
                    await updateLeavePanel(guildConfig);
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'An error occurred while processing your leave request.', ephemeral: true });
            }
        }
    }
});

// Combined function to update panel, activate and deactivate leaves for all guilds
const dailyTask = async () => {
    const guildConfigs = await guildConfigSchema.find();

    for (const guildConfig of guildConfigs) {
        await updateLeavePanel(guildConfig);
        await activateLeaves(guildConfig.guildId);
        await deactivateLeaves(guildConfig.guildId);
    }
};

// Schedule the cron job to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily task at midnight');
    await dailyTask();
});
