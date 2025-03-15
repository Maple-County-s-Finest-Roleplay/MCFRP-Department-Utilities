const { performance } = require('perf_hooks');
const Shift = require('../../../schemas/shift.js');
const Counter = require('../../../schemas/counter.js')
const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const parseTime = require('../../../utils/timeParser.js')

module.exports = {
    name: "shift",
    description: "Manage shifts for users",
    type: 1,
    options: [
        {
            type: 1,
            name: "leaderboard",
            description: "Display the leaderboard of users with the most shifts",
            options: [
                {
                    type: 3,
                    name: "shift_type",
                    description: "The type of shift to filter by",
                    required: false,
                    choices: [
                        { name: 'Standard (default)', value: 'Standard' },
                        { name: 'Department Work', value: 'Department Work' }
                    ]
                },
                {
                    type: 3,
                    name: "guild",
                    description: "The guild to filter by",
                    required: false,
                    choices: [
                        { name: 'Oakland State Police', value: 'Oakland State Police' },
                        { name: 'Maple County Sheriff\'s Office', value: 'Maple County Sheriff\'s Office' },
                        { name: 'Fairfield Police Department', value: 'Fairfield Police Department' },
                        { name: 'Fairfield Fire Rescue', value: 'Fairfield Fire Department' },
                        { name: 'Maple County Communications', value: 'Maple County Communications' },
                        { name: 'Oakland Department of Transportation', value: 'Oakland Department of Transportation' },
                        { name: 'Hanover Township Police Department', value: 'Hanover Township Police Department' },
                        { name: 'All Law Enforcement', value: 'All Law Enforcement' }
                    ]
                },
                {
                    type: 5,
                    name: "show_no_logs",
                    description: "Toggle whether the leaderboard embed will show users who have not logged a shift yet",
                    required: false,
                },
                {
                    type: 3,
                    name: "time_interval",
                    description: "The time interval to filter shifts by",
                    required: false,
                    choices: [
                        { name: "This Week (since last Sunday)", value: "this_week" },
                        { name: "Past 7 Days", value: "past_7_days" },
                        { name: "Past 14 Days", value: "past_14_days" },
                        { name: "Past 1 Month", value: "past_30_days" },
                        { name: "Past 2 Months", value: "past_2_months" },
                        { name: "Past 6 Months", value: "past_6_months" },
                        { name: "Past 12 Months", value: "past_year" },
                        { name: "All Time", value: "all_time" }
                    ]
                }
            ]
        },
        {
            type: 1,
            name: "start",
            description: "Start a new shift",
            options: [
                {
                    type: 3,
                    name: "type",
                    description: "The type of shift to start",
                    required: false,
                    choices: [
                        { name: 'Standard (default)', value: 'Standard' },
                        { name: 'Department Work', value: 'Department Work' }
                    ]
                }
            ]
        },
        {
            type: 1,
            name: "break",
            description: "Record a break during the shift",
            options: [
                {
                    type: 3,
                    name: "action",
                    description: "Start or end a break",
                    required: true,
                    choices: [
                        { name: 'Start', value: 'start' },
                        { name: 'End', value: 'end' }
                    ]
                }
            ]
        },
        {
            type: 1,
            name: "end",
            description: "End the current shift",
            options: []
        },
        {
            type: 2,
            name: "admin",
            description: "Manage a user's shifts and view information about them",
            options: [
                {
                    type: 1,
                    name: "view",
                    description: "View a user's shifts",
                    options: [
                        {
                            type: 6,
                            name: "user",
                            description: "The user to view shifts for",
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    name: "add",
                    description: "Add a shift for a user",
                    options: [
                        {
                            type: 6,
                            name: "user",
                            description: "The user to add a shift for",
                            required: true
                        },
                        {
                            type: 3,
                            name: "duration",
                            description: "The duration of the shift",
                            required: true
                        },
                        {
                            type: 3,
                            name: "type",
                            description: "The type of shift to add",
                            required: false,
                            choices: [
                                { name: 'Standard (default)', value: 'Standard' },
                                { name: 'Department Work', value: 'Department Work' }
                            ]
                        }
                    ]
                },
                {
                    type: 1,
                    name: "remove",
                    description: "Remove a shift for a user",
                    options: [
                        {
                            type: 3,
                            name: "shift_id",
                            description: "ID of the shift to remove",
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    name: "edit",
                    description: "Edit a user's shift",
                    options: [
                        {
                            type: 3,
                            name: "shift_id",
                            description: "ID of the shift to edit",
                            required: true
                        },
                        {
                            type: 3,
                            name: "duration",
                            description: "New duration for the shift",
                            required: false
                        },
                        {
                            type: 3,
                            name: "type",
                            description: "The new shift type",
                            required: false,
                            choices: [
                                { name: 'Standard (default)', value: 'Standard' },
                                { name: 'Department Work', value: 'Department Work' }
                            ]
                        }
                    ]
                },
                {
                    type: 1,
                    name: "end-shift",
                    description: "End a user's shift",
                    options: [
                        {
                            type: 3,
                            name: "shift_id",
                            description: "ID of the shift to edit",
                            required: false
                        },
                        {
                            type: 6,
                            name: "user",
                            description: "The user's shift to end",
                            required: false
                        }
                    ]
                },
                {
                    type: 1,
                    name: "active",
                    description: "See active shifts",
                    options: []
                }
            ]
        },
        {
            type: 1,
            name: "wipe",
            description: "Wipe all shifts for the current guild",
            options: []
        },
        {
            type: 1,
            name: "reassign_ids",
            description: "Reassign shift IDs",
            options: []
        }
    ],
    permissions: {
        DEFAULT_MEMBER_PERMISSIONS: "SendMessages"
    },
    run: async (client, interaction, config, db) => {
    // Function to get next shift ID
    const getNextShiftId = async () => {
        const result = await Counter.findOneAndUpdate(
            { name: 'shifts' },
            { $inc: { currentShiftId: 1 } },
            { new: true, upsert: true }
        );
        return `S-${result.currentShiftId.toString()}`;
    };

    const guildMapping = {
        'Oakland State Police': '1258472595527958638',
        'Maple County Sheriff\'s Office': '1209648230753640550',
        'Fairfield Police Department': '1151275644802580580',
        'Fairfield Fire Department': '938502800193748992',
        'Oakland Department of Transportation': '1258645245072117890',
        'Maple County Communications': '1074381965983227986',
        'Hanover Township Police Department': '1218160960771063838',
        'All Law Enforcement': '1209648230753640550,1151275644802580580,1218160960771063838,1258472595527958638'
    };

        const user = interaction.options.getUser('user');
        const guildName = interaction.options.getString('guild');
        const shiftType = interaction.options.getString('shift_type');
        let guildIds = [interaction.guildId];

        if (guildName && guildMapping[guildName]) {
            if (guildName === 'All Law Enforcement') {
                guildIds = guildMapping[guildName].split(','); 
            } else {
                guildIds = [guildMapping[guildName]];
            }
        }

        const allowedGuildIds = ['1072621508175876218', '1252448984891658342'];
        const allowedRoleIds = ['1072621508591095923', '1243608764825862194'];
        const subcommand = interaction.options.getSubcommand();

        if (subcommand !== "leaderboard" && interaction.guild.id === "1072621508175876218") { 
            return interaction.reply("You can't run this command in the main server!"); 
        }

        await interaction.deferReply();

        try {
            if (subcommand === "reassign_ids") {
                // Fetch all shifts
                const shifts = await Shift.find({});
                if (shifts.length === 0) {
                    return interaction.editReply("There are no shifts to reassign.");
                }
    
                // Reassign IDs
                for (const shift of shifts) {
                    const newShiftId = await getNextShiftId();
                    shift.shiftId = newShiftId;
                    await shift.save();
                }
    
                await interaction.editReply(`Successfully reassigned IDs for ${shifts.length} shifts.`);
            } else if (subcommand === "leaderboard") {
                if (interaction.options.getString('guild')) {
                    if (!allowedGuildIds.includes(interaction.guildId) || !interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id))) {
                        await interaction.editReply("You do not have permission to use this command in the main server.");
                        return;
                    }
                }
            
                await interaction.editReply("Obtaining server data...");
            
                // Determine the time interval for filtering shifts
                const timeInterval = interaction.options.getString('time_interval') || "all_time";
                const cutoffTime = calculateCutoff(timeInterval);
            
                // Construct the query based on the cutoffTime and optional shiftType
                const query = { guildId: { $in: guildIds } };
                if (cutoffTime > 0) {
                    query.started = { $gte: cutoffTime }; // Ensure this is applied correctly for filtering
                }
                if (shiftType) {
                    query.shiftType = shiftType;
                }
            
                // Fetch shifts based on the constructed query
                const shifts = await Shift.find(query);
                const showNoLogs = interaction.options.getBoolean('show_no_logs');
            
                // If no shifts are found and 'show_no_logs' is false, inform the user
                if (shifts.length === 0 && !showNoLogs) {
                    return interaction.editReply("There is no shift data for this server within the selected time interval.");
                }
            
                // Calculate total shift duration per user
                const userDurations = shifts.reduce((acc, shift) => {
                    const duration = Number(shift.shiftDuration);
                    if (!isNaN(duration)) {
                        acc[shift.userId] = (acc[shift.userId] || 0) + duration;
                    } else {
                        console.warn(`Invalid duration for shift: ${shift.shiftId}`);
                    }
                    return acc;
                }, {});
            
                // Sort users based on total shift duration in descending order
                const sortedUsers = Object.keys(userDurations).sort((a, b) => userDurations[b] - userDurations[a]);
            
                // Prepare the leaderboard embed
                const embed = new EmbedBuilder()
                    .setTitle('Shift Leaderboard')
                    .setColor('Blue');
            
                const descriptionLines = [];
            
                // Populate the leaderboard with sorted user data
                for (let i = 0; i < sortedUsers.length; i++) {
                    const userId = sortedUsers[i];
                    const totalDuration = userDurations[userId];
            
                    let user;
                    try {
                        user = await client.users.fetch(userId);
                    } catch (error) {
                        console.error(`Error fetching user ${userId}:`, error);
                        continue;
                    }
            
                    descriptionLines.push(`\`${i + 1}.\` ${user} • ${formatDuration(totalDuration)}`);
                }
            
                // Include members without logs if 'show_no_logs' is true
                if (showNoLogs) {
                    const guilds = await Promise.all(guildIds.map(id => client.guilds.fetch(id)));
                    const membersWithoutLogs = new Map();
            
                    for (const guild of guilds) {
                        try {
                            // Fetch all members, using cache if available
                            const allMembers = guild.members.cache.size > 0 ? guild.members.cache : await guild.members.fetch();
            
                            allMembers.forEach(member => {
                                // Skip members who lack the required role in the main server
                                if (guild.id === '1209648230753640550' && !member.roles.cache.has('1209674625689325569')) {
                                    return;
                                }
            
                                // Add members without shift logs to the map
                                if (!userDurations[member.user.id]) {
                                    membersWithoutLogs.set(member.user.id, member.user);
                                }
                            });
                        } catch (error) {
                            console.error('Error fetching guild members:', error);
                            descriptionLines.push('\n**Error:** An unexpected error occurred while fetching members.');
                        }
                    }
            
                    if (membersWithoutLogs.size > 0) {
                        descriptionLines.push('\n**Members without shift logs:**');
                        membersWithoutLogs.forEach(user => {
                            descriptionLines.push(`• ${user}`);
                        });
                    } else {
                        descriptionLines.push('\nAll members have shift logs.');
                    }
                }
            
                // Set the embed description and send the final response
                embed.setDescription(descriptionLines.join('\n') || "No data available.");
                await interaction.editReply({ embeds: [embed], content: "" });
            } else if (subcommand === "start") {
                let shiftType;
                if (!interaction.options.getString('type')) { 
                    shiftType = "Standard";
                } else { 
                    shiftType = interaction.options.getString('type');
                }
                const userId = interaction.user.id;
                const now = new Date();

                const activeShift = await Shift.findOne({ userId, guildId: interaction.guild.id, shiftDuration: null, ended: null }).sort({ started: -1 });
                if (activeShift) {
                    await interaction.editReply("You already have an active shift.");
                    return;
                }

                await interaction.editReply("Starting a new shift...");

                const newShiftId = await getNextShiftId();

                const newShift = new Shift({
                    shiftId: newShiftId,
                    userId,
                    shiftDuration: null,
                    shiftType,
                    started: Math.floor(now.getTime() / 1000),
                    ended: null,
                    guildId: interaction.guild.id,
                });

                await newShift.save();
                await interaction.editReply("Shift started successfully.");
            } else if (subcommand === "break") {
                const action = interaction.options.getString('action');
                const userId = interaction.user.id;

                const activeShift = await Shift.findOne({ userId, guildId: interaction.guild.id, shiftDuration: null, ended: null }).sort({ started: -1 });
                if (!activeShift) {
                    await interaction.editReply("You do not have an active shift.");
                    return;
                }

                if (action === 'start') {
                    const activeBreak = activeShift.breaks.find(b => !b.end);
                    if (activeBreak) {
                        await interaction.editReply("You already have an active break.");
                        return;
                    }

                    activeShift.breaks.push({ start: Math.floor(Date.now() / 1000), end: null });
                    await activeShift.save();
                    await interaction.editReply("Break started.");
                } else if (action === 'end') {
                    const activeBreak = activeShift.breaks.find(b => !b.end);
                    if (!activeBreak) {
                        await interaction.editReply("You do not have an active break to end.");
                        return;
                    }

                    activeBreak.end = Math.floor(Date.now() / 1000);
                    await activeShift.save();
                    await interaction.editReply("Break ended.");
                }
            } else if (subcommand === "end") {
                const userId = interaction.user.id;

                const activeShift = await Shift.findOne({ userId, guildId: interaction.guild.id, shiftDuration: null, ended: null }).sort({ started: -1 });
                if (!activeShift) {
                    await interaction.editReply("You do not have an active shift to end.");
                    return;
                }

                if (activeShift.duration != null || activeShift.ended != null) {
                    await interaction.editReply("Your shift has already been ended.");
                    return;
                }

                await interaction.editReply("Ending your shift...");

                const endTime = Math.floor(Date.now() / 1000);
                const totalDuration = endTime - activeShift.started;

                const totalBreakTime = activeShift.breaks.reduce((acc, b) => {
                    if (b.start && b.end) {
                        return acc + (Number(b.end) - Number(b.start));
                    }
                    return acc;
                }, 0);

                const shiftDuration = totalDuration - totalBreakTime;

                activeShift.shiftDuration = shiftDuration;
                activeShift.ended = endTime;
                await activeShift.save();

                await interaction.editReply(`Shift ended successfully. Duration: ${formatDuration(shiftDuration)}`);
            } else if (interaction.options.getSubcommandGroup() === "admin") {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    await interaction.editReply("You must be a high command member to run this command.");
                    return;
                }
                const adminSubcommand = interaction.options.getSubcommand();
                const user = interaction.options.getUser('user');

                if (adminSubcommand === "view") {
                    await interaction.editReply({ content: `Obtaining shifts for ${user} in this guild...`, ephemeral: true });
                    const docs = await Shift.find({ userId: user.id, guildId: interaction.guild.id });
                
                    if (!docs.length) {
                        return interaction.editReply("This user has not logged a shift here yet.");
                    }
                
                    // Sort shifts from newest to oldest by the 'started' timestamp
                    docs.sort((a, b) => b.started - a.started);
                
                    const embeds = [];
                    const shiftsPerPage = 5; // Adjust as needed for embed limits
                
                    for (let i = 0; i < docs.length; i += shiftsPerPage) {
                        const embed = new EmbedBuilder()
                            .setTitle(`Shifts for ${user.username}`)
                            .setDescription(`I found ${docs.length} shifts for ${user}. Page ${Math.floor(i / shiftsPerPage) + 1} of ${Math.ceil(docs.length / shiftsPerPage)}`)
                            .setColor('Blue')
                            .setTimestamp();
                
                        docs.slice(i, i + shiftsPerPage).forEach(shift => {
                            const embedFields = [];
                
                            let shiftInfo = `**Shift Type:** ${shift.shiftType}\n`;
                            shiftInfo += `**Started At:** <t:${shift.started}:F>\n`;
                
                            if (shift.ended === null) {
                                shiftInfo += `**Status:** Ongoing`;
                            } else {
                                shiftInfo += `**Ended At:** <t:${shift.ended}:F>\n`;
                                shiftInfo += `**Shift Duration:** ${formatDuration(shift.shiftDuration)}`;
                            }
                
                            embedFields.push({
                                name: `Shift ID: \`${shift.shiftId}\``,
                                value: shiftInfo
                            });
                
                            if (shift.breaks.length > 0) {
                                shift.breaks.forEach((breakObj, index) => {
                                    const breakDuration = breakObj.end - breakObj.start;
                                    let breakInfo = `**Break Duration:** ${formatDuration(breakDuration)}\n`;
                                    breakInfo += `Started at <t:${breakObj.start}:t>, Ended at <t:${breakObj.end}:t>`;
                
                                    if (index === 0) {
                                        embedFields.push({
                                            name: `Break ${index + 1}`,
                                            value: breakInfo
                                        });
                                    } else {
                                        embedFields.push({
                                            name: '\u200B',
                                            value: breakInfo
                                        });
                                    }
                                });
                            }
                
                            embed.addFields(embedFields);
                        });
                
                        embeds.push(embed);
                    }
                
                    let currentPage = 0;
                    const reply = await interaction.editReply({ embeds: [embeds[currentPage]], content: "", components: getPaginationButtons(currentPage, embeds.length) });
                
                    const filter = i => i.user.id === interaction.user.id;
                    const collector = reply.createMessageComponentCollector({ filter, time: 60000 });
                
                    collector.on('collect', async i => {
                        if (i.customId === 'previous') {
                            currentPage = Math.max(currentPage - 1, 0);
                        } else if (i.customId === 'next') {
                            currentPage = Math.min(currentPage + 1, embeds.length - 1);
                        }
                
                        await i.update({ embeds: [embeds[currentPage]], components: getPaginationButtons(currentPage, embeds.length) });
                    });
                
                    collector.on('end', async () => {
                        await reply.edit({ components: [] });
                    });
                } else if (adminSubcommand === "add") {
                    await interaction.editReply({ content: `Adding shift for ${user}...`, ephemeral: true });
                    
                    // Parse the duration using the parseTime function
                    let shiftDuration;
                    try {
                        shiftDuration = parseTime(interaction.options.getString('duration')) / 1000; // Convert milliseconds to seconds
                    } catch (error) {
                        return interaction.editReply({ content: `Error: ${error.message}`, ephemeral: true });
                    }
                    
                    const shiftType = interaction.options.getString('type') || "Standard";
                    const now = new Date();
                    const newShiftId = await getNextShiftId();
                
                    const newShift = new Shift({
                        shiftId: newShiftId,
                        userId: interaction.options.getUser('user').id,
                        shiftDuration,
                        shiftType,
                        started: Math.floor(now.getTime() / 1000) - shiftDuration,
                        ended: Math.floor(now.getTime() / 1000),
                        guildId: interaction.guild.id,
                    });
                
                    await newShift.save();
                
                    return interaction.editReply(`I have created a new shift.\n\n**Shift ID:** \`${newShift.shiftId}\`\n**User:** ${interaction.options.getUser('user')}\n**Shift Duration:** ${formatDuration(shiftDuration)}\n*Note: The start time for this shift will show as the current time, minus the duration inputted. The end time will show as the current time (<t:${newShift.ended}:t>).*`);
                } else if (adminSubcommand === "remove") {
                    const shiftId = interaction.options.getString('shift_id');
                    await interaction.editReply({ content: `Removing shift for ${user} with ID \`${shiftId}\`.`, ephemeral: true });
                    try {
                        const doc = await Shift.findOne({ shiftId });
                
                        if (!doc) {
                            return interaction.editReply("Shift not found. Please provide a valid shift ID.");
                        }
                
                        await Shift.deleteOne({ shiftId });
                
                        await interaction.editReply(`The shift has been deleted.\n\n**Shift data:**\n\`\`\`${doc}\`\`\``);
                    } catch (error) {
                        console.error(error);
                        await interaction.editReply("An error occurred while removing the shift. Please try again later.");
                    }
                } else if (adminSubcommand === "edit") {
                    try {
                        await interaction.editReply("Editing their shift...");
                    
                        const shiftId = interaction.options.getString('shift_id');
                        let newDuration;
                        try {
                            newDuration = interaction.options.getString('duration') ? parseTime(interaction.options.getString('duration')) / 1000 : null;
                        } catch (error) {
                            return interaction.editReply(`Error: ${error.message}`);
                        }
                        const newType = interaction.options.getString('type');
                    
                        const doc = await Shift.findOne({ shiftId });
                    
                        if (!doc) {
                            return interaction.editReply("No shift found with the provided ID. Please provide a valid shift ID.");
                        }
                    
                        const durationInSeconds = newDuration !== null ? newDuration : doc.shiftDuration;
                        const shiftType = newType !== null ? newType : doc.shiftType;
                        const durationDifference = durationInSeconds - doc.shiftDuration;
                    
                        doc.shiftDuration = durationInSeconds;
                        doc.shiftType = shiftType;
                    
                        if (durationDifference !== 0) {
                            doc.started -= durationDifference;
                        }
                    
                        await doc.save();
                    
                        const startedTime = `<t:${doc.started}:F>`;
                        const endedTime = doc.ended ? `<t:${doc.ended}:F>` : 'Ongoing';
                    
                        return interaction.editReply(`Their shift has been updated.\n\n**Shift ID:** \`${shiftId}\`\n**Shift Duration:** ${formatDuration(doc.shiftDuration)}\n**Shift Type:** ${doc.shiftType}\n**Started:** ${startedTime}\n**Ended:** ${endedTime}`);
                    } catch (error) {
                        console.error(error);
                        return interaction.editReply("An error occurred while updating the shift. Please try again later.");
                    }
                } else if (adminSubcommand === "active") {   
                    await interaction.editReply("Fetching active shifts...");
                    const docs = await Shift.find({ guildId: interaction.guild.id, shiftDuration: null, ended: null });
                    if (docs.length === 0) { 
                        return interaction.editReply("There are no active shifts.");
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Active Shifts`)
                        .setDescription(`I found ${docs.length} active shifts.`)
                        .setColor('Blue')
                        .setTimestamp();

                    docs.forEach(shift => {
                        const embedFields = [];

                        let shiftInfo = `**User:** <@${shift.userId}>\n`;
                        shiftInfo += `**Shift Type:** ${shift.shiftType}\n`;
                        shiftInfo += `**Started At:** <t:${shift.started}:F>\n`;

                        embedFields.push({
                            name: `Shift ID: \`${shift.shiftId}\``,
                            value: shiftInfo
                        });

                        if (shift.breaks.length > 0) {
                            shift.breaks.forEach((breakObj, index) => {
                                const breakDuration = breakObj.end - breakObj.start;
                                let breakInfo = `**Break Duration:** ${formatDuration(breakDuration)}\n`;
                                breakInfo += `Started at <t:${breakObj.start}:t>, Ended at <t:${breakObj.end}:t>`;

                                if (index === 0) {
                                    embedFields.push({
                                        name: `Break ${index + 1}`,
                                        value: breakInfo
                                    });
                                } else {
                                    embedFields.push({
                                        name: `Break ${index + 1}`,
                                        value: breakInfo
                                    });
                                }
                            });
                        }

                        embed.addFields(embedFields);
                    });

                    interaction.editReply({ embeds: [embed], content: "" });
                } else if (adminSubcommand === "end-shift") {
                    let userId = interaction.options.getUser('user')?.id;
                    let shiftId = interaction.options.getString('shift_id');
                    const query = {};
                  
                    if (shiftId === "all-active") {
                      // End all active shifts
                      query.guildId = interaction.guild.id;
                      query.shiftDuration = null;
                      query.ended = null;
                  
                      const activeShifts = await Shift.find(query).sort({ started: -1 });
                      if (activeShifts.length === 0) {
                        await interaction.editReply("There are no active shifts to end.");
                        return;
                      }
                  
                      await interaction.editReply("Ending all active shifts...");

                      const shiftsEnded = []
                  
                      const endTime = Math.floor(Date.now() / 1000);
                  
                      for (const activeShift of activeShifts) {
                        const totalDuration = endTime - activeShift.started;
                  
                        const totalBreakTime = activeShift.breaks.reduce((acc, b) => {
                          if (b.start && b.end) {
                            return acc + (Number(b.end) - Number(b.start));
                          }
                          return acc;
                        }, 0);
                  
                        const shiftDuration = totalDuration - totalBreakTime;
                  
                        activeShift.shiftDuration = shiftDuration;
                        activeShift.ended = endTime;
                        await activeShift.save();
                        shiftsEnded.push(`**Shift ID**: \`${activeShift.shiftId}\`\n**User:** <@${activeShift.userId}>\n**Started:** <t:${activeShift.started}:f>\n**Shift Duration:** ${formatDuration(activeShift.shiftDuration)}\n\n`)
                      }
                  
                      await interaction.editReply(`All active shifts ended successfully. Shifts ended:\n\n${shiftsEnded}`);
                    } else {
                      // End a specific active shift
                      if (userId) {
                        query.userId = userId;
                      } else if (shiftId) {
                        query.shiftId = shiftId;
                      }
                  
                      query.guildId = interaction.guild.id;
                      query.shiftDuration = null;
                      query.ended = null;
                  
                      const activeShift = await Shift.findOne(query).sort({ started: -1 });
                      if (!activeShift) {
                        await interaction.editReply("They do not have an active shift to end.");
                        return;
                      }
                  
                      if (activeShift.shiftDuration != null || activeShift.ended != null) {
                        await interaction.editReply("Their shift has already been ended.");
                        return;
                      }
                  
                      await interaction.editReply("Ending their shift...");
                  
                      const endTime = Math.floor(Date.now() / 1000);
                      const totalDuration = endTime - activeShift.started;
                  
                      const totalBreakTime = activeShift.breaks.reduce((acc, b) => {
                        if (b.start && b.end) {
                          return acc + (Number(b.end) - Number(b.start));
                        }
                        return acc;
                      }, 0);
                  
                      const shiftDuration = totalDuration - totalBreakTime;
                  
                      activeShift.shiftDuration = shiftDuration;
                      activeShift.ended = endTime;
                      await activeShift.save();
                  
                      await interaction.editReply(`Shift ended successfully. Duration: ${formatDuration(shiftDuration)}`);
                    }
                }
                } else if (subcommand === "wipe") {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    return interaction.editReply("Only high command can run this command!");
                }
                const docs = await Shift.find({ guildId: interaction.guild.id });

                if (docs.length === 0) {
                    return interaction.editReply("There aren't any shifts to wipe!");
                }

                const confirmButton = new ButtonBuilder()
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`confirm_delete`);
                const cancelButton = new ButtonBuilder()
                    .setLabel("Cancel Deletion")
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId(`cancel_delete`);

                const row = new ActionRowBuilder()
                    .addComponents(confirmButton, cancelButton);

                await interaction.editReply({ content: `Are you sure you want to delete ${docs.length} shifts? **This action is irreversible!**`, components: [row] });

                const filter = i => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({
                    filter,
                    time: 15000 // 15 seconds
                });

                collector.on('collect', async i => {
                    if (i.customId === 'confirm_delete') {
                        try {
                            await Shift.deleteMany({ guildId: interaction.guild.id });
                            await i.update({
                                content: `Successfully deleted ${docs.length} shifts.`,
                                components: []
                            });
                            console.log(`${docs.length} shifts have been deleted in ${interaction.guild.name} by ${interaction.user.username}.`);
                        } catch (error) {
                            console.error(error);
                            await i.update({
                                content: "An error occurred while deleting shifts.",
                                components: []
                            });
                        }
                    } else if (i.customId === 'cancel_delete') {
                        await i.update({
                            content: "Deletion canceled.",
                            components: []
                        });
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.editReply({
                            content: "Deletion confirmation timed out. Please try again.",
                            components: []
                        });
                    }
                });
            } else {
                await interaction.editReply("Please specify a valid subcommand.");
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply("An error occurred while processing your request. Please try again later.");
        }



function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h, ${minutes}m, ${remainingSeconds}s`;
}}}

// Calculate the cutoff timestamp based on the selected interval
const calculateCutoff = (interval) => {
    const now = Math.floor(Date.now() / 1000); // Get current time in seconds
    const oneDay = 24 * 60 * 60; // One day in seconds
    const oneMonth = 30 * oneDay; // Approximate one month as 30 days in seconds
    const intervals = {
        this_week: () => {
            const today = new Date();
            const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
            const lastSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek);
            return Math.floor(lastSunday.getTime() / 1000); // Convert to seconds
        },
        past_7_days: () => now - 7 * oneDay,
        past_14_days: () => now - 14 * oneDay,
        past_30_days: () => now - 30 * oneDay,
        past_2_months: () => now - 2 * oneMonth,
        past_6_months: () => now - 6 * oneMonth,
        past_year: () => now - 12 * oneMonth,
        all_time: () => 0
    };
    return intervals[interval] ? intervals[interval]() : 0;
};

// Filter shifts based on the interval
const filterShiftsByInterval = (shifts, interval) => {
    const cutoff = calculateCutoff(interval);
    return shifts.filter(shift => shift.started >= cutoff);
};

function getPaginationButtons(currentPage, totalPages) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1)
        )
    ];
}