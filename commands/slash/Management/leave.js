const { 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder, 
    StringSelectMenuBuilder, 
    ApplicationCommandType, 
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    PermissionsBitField,
} = require('discord.js');
const leaveSchema = require('../../../schemas/leave.js');
const guildConfigSchema = require('../../../schemas/guildConfig.js');
const cron = require('node-cron');

const formatDiscordTimestamp = (date) => `<t:${Math.floor(date.getTime() / 1000)}:F>`;

module.exports = {
    name: "loa",
    description: "LOA Management",
    type: 1,
    options: [
        {
            name: 'view',
            description: "View a user's leaves of absence",
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'The user to view past LOAs for',
                    type: 6,
                    required: true,
                }
            ]
        },
        {
            name: 'edit',
            description: 'Edit a current or upcoming leave of absence by ID',
            type: 1,
            options: [
                {
                    name: 'leave_id',
                    description: 'The ID of the leave to edit',
                    type: 3,
                    required: true,
                }
            ]
        },
        {
            name: 'setup',
            description: 'Sets up the leave system in your department',
            type: 1,
            options: [
                {
                    name: 'leave_approval_channel',
                    description: 'The channel for leave approval',
                    type: 7,
                    required: true
                },
                {
                    name: 'leave_panel_channel',
                    description: 'The channel for leave panel',
                    type: 7,
                    required: true
                },
                {
                    name: 'leave_request_panel_channel',
                    description: 'The channel for leave request panel',
                    type: 7,
                    required: true
                }
            ]
        },
        {
            name: 'end',
            description: 'End a current leave of absence by ID',
            type: 1,
            options: [
                {
                    name: 'leave_id',
                    description: 'The ID of the leave to end',
                    type: 3,
                    required: true,
                }
            ]
        },
        {
            name: 'delete',
            description: 'Delete a leave of absence by ID',
            type: 1,
            options: [
                {
                    name: 'leave_id',
                    description: 'The ID of the leave to delete',
                    type: 3,
                    required: true,
                }
            ]
        },
        {
            name: 'reset',
            description: 'Reset the LOA configuration for this guild',
            type: 1
        }
    ],
    permissions: {
        DEFAULT_PERMISSIONS: "",
        DEFAULT_MEMBER_PERMISSIONS: PermissionFlagsBits.BanMembers
    },
    run: async (client, interaction) => {
        const subCommand = interaction.options.getSubcommand();

        const guildConfig = await guildConfigSchema.findOne({ guildId: interaction.guild.id });

        if (!guildConfig && subCommand !== "setup") {
            return interaction.reply({ content: 'Guild configuration not found. Please run the setup command first.', ephemeral: true });
        }

        if (subCommand === 'view') {
            const user = interaction.options.getUser('user');
            const pastLeaves = await leaveSchema.find({ 
                userId: user.id,
                startDate: { $lt: new Date() }
            });

            const formattedLeaves = pastLeaves.map(leave => {
                const endDate = new Date(leave.startDate);
                endDate.setDate(endDate.getDate() + parseInt(leave.duration));
                return `**Leave ID:** ${leave.leaveId}\n**Leave Type:** ${leave.leaveType}\n**Start Date:** ${formatDiscordTimestamp(new Date(leave.startDate))}\n**End Date:** ${formatDiscordTimestamp(endDate)}\n**Reason:** ${leave.reason}\n`;
            }).join('\n') || 'None';

            const embed = new EmbedBuilder()
                .setTitle(`${user.username}'s Leaves of Absence`)
                .setDescription(formattedLeaves)
                .setColor('Blue');

            await interaction.reply({ embeds: [embed] });

        } else if (subCommand === 'edit') {
            const leaveId = interaction.options.getString('leave_id');
            const leave = await leaveSchema.findOne({ leaveId: leaveId });

            if (!leave) {
                return interaction.reply({ content: 'Leave request not found.', ephemeral: true });
            }

            if (leave.active) {
                return interaction.reply({ content: 'Cannot edit an active leave.', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId(`edit_loa_${leaveId}`)
                .setTitle('Edit Leave of Absence');

            const startDateInput = new TextInputBuilder()
                .setCustomId('start_date')
                .setLabel('Start Date (MM-DD-YYYY)')
                .setStyle(TextInputStyle.Short)
                .setValue(new Date(leave.startDate).toLocaleDateString('en-US'))
                .setRequired(true);

            const durationInput = new TextInputBuilder()
                .setCustomId('duration')
                .setLabel('Duration (in days)')
                .setStyle(TextInputStyle.Short)
                .setValue(leave.duration.toString())
                .setRequired(true);

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(leave.reason)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(startDateInput),
                new ActionRowBuilder().addComponents(durationInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );

            await interaction.showModal(modal);

        } else if (subCommand === 'setup') {
            // Check for admin permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            // Get channels and guild ID
            const guildId = interaction.guildId;
            const leaveApprovalChannelId = interaction.options.getChannel('leave_approval_channel').id;
            const leavePanelChannelId = interaction.options.getChannel('leave_panel_channel').id;
            const leaveRequestPanelChannelId = interaction.options.getChannel('leave_request_panel_channel').id;

            try {
                // Check if configuration exists
                const existingConfig = await guildConfigSchema.findOne({ guildId });
                if (existingConfig) {
                    existingConfig.leaveApprovalChannelId = leaveApprovalChannelId;
                    existingConfig.leavePanelChannelId = leavePanelChannelId;
                    existingConfig.leaveRequestPanelChannelId = leaveRequestPanelChannelId;
                    await existingConfig.save();
                } else {
                    const newConfig = new guildConfigSchema({
                        guildId,
                        leaveApprovalChannelId,
                        leavePanelChannelId,
                        leaveRequestPanelChannelId,
                    });
                    await newConfig.save();
                }

                // Fetch leaves with client passed to the helper function
                const { activeLeaves, upcomingLeaves } = await fetchAndFormatLeaves(client);

                // Send leave panels to the channels
                const leavePanel = new EmbedBuilder()
                    .setColor('Blue')
                    .addFields(
                        { name: 'Active Leaves', value: activeLeaves, inline: true },
                        { name: 'Upcoming Leaves', value: upcomingLeaves, inline: true }
                    );

                const leaveTypeMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_leave_type')
                    .setPlaceholder('Select Leave Type')
                    .addOptions([
                        { label: 'Leave of Absence', value: 'Leave of Absence' },
                        { label: 'Leave of Absence (Game Only)', value: 'Leave of Absence (Game Only)' },
                        { label: 'Reduced Activity', value: 'Reduced Activity' },
                        { label: 'Other', value: 'Other' }
                    ]);

                const embed = new EmbedBuilder()
                    .setTitle('Request a Leave')
                    .setDescription("Use the drop-down menu to select a leave type, and then fill out the information in the form to request your leave.")
                    .setColor('Blue');

                const row1 = new ActionRowBuilder().addComponents(leaveTypeMenu);

                const leaveRequestPanelChannel = interaction.client.channels.cache.get(leaveRequestPanelChannelId);
                if (!leaveRequestPanelChannel) {
                    return interaction.followUp({ content: 'Error: Leave request panel channel not found or inaccessible.', ephemeral: true });
                }

                await leaveRequestPanelChannel.send({ embeds: [embed], components: [row1] });

                const leavePanelChannel = interaction.client.channels.cache.get(leavePanelChannelId);
                if (!leavePanelChannel) {
                    return interaction.followUp({ content: 'Error: Leave panel channel not found or inaccessible.', ephemeral: true });
                }

                await leavePanelChannel.send({ embeds: [leavePanel] });

                interaction.reply('Guild configuration has been saved and panels have been sent.');
            } catch (error) {
                console.error(error);
                interaction.reply('There was an error saving the configuration and sending the panels.');
            }
        } else if (subCommand === 'end') {
            const leaveId = interaction.options.getString('leave_id');
            const leave = await leaveSchema.findOne({ leaveId: leaveId });

            if (!leave) {
                return interaction.reply({ content: 'Leave request not found.', ephemeral: true });
            }

            leave.active = false;
            leave.upcoming = false;
            await leave.save();

            interaction.reply({ content: `Leave request with ID ${leaveId} has been marked as ended.`, ephemeral: true });

        } else if (subCommand === 'delete') {
            const leaveId = interaction.options.getString('leave_id');
            const leave = await leaveSchema.findOneAndDelete({ leaveId: leaveId });

            if (!leave) {
                return interaction.reply({ content: 'Leave request not found.', ephemeral: true });
            }

            interaction.reply({ content: `Leave request with ID ${leaveId} has been deleted.`, ephemeral: true });

        } else if (subCommand === 'reset') {
            try {
                const deletedConfig = await guildConfigSchema.findOneAndDelete({ guildId: interaction.guild.id });

                if (!deletedConfig) {
                    return interaction.reply({ content: 'No configuration found to reset for this guild.', ephemeral: true });
                }

                interaction.reply({ content: 'Guild LOA configuration has been reset.', ephemeral: true });
            } catch (error) {
                console.error(error);
                interaction.reply({ content: 'There was an error resetting the LOA configuration.', ephemeral: true });
            }
        }
    }
};

// Updated fetchAndFormatLeaves to accept client as an argument
const fetchAndFormatLeaves = async (client) => {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    try {
        const activeLeaves = await leaveSchema.find({ active: true });
        const upcomingLeaves = await leaveSchema.find({ active: false, startDate: { $gte: now, $lte: threeDaysLater } });

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
        console.error(error);
        throw new Error('Error while formatting leaves.');
    }
};