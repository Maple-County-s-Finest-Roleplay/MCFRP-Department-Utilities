const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: "syncallroles",
    description: "Sync all roles from department servers to the main server",
    type: 1,
    options: [],
    permissions: {
        DEFAULT_PERMISSIONS: "",
        DEFAULT_MEMBER_PERMISSIONS: "Administrator"
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.user.id !== '802325785507397672') return;

        const mainServerId = '1072621508175876218';
        const departmentServerIds = [
            '1258472595527958638',
            '1151275644802580580',
            '1209648230753640550',
            '1276353171253493851',
            '1258645245072117890',
            '1074381965983227986',
            '1218160960771063838',
        ];

        const roleMappings = {
            // MAIN SERVER ROLE ID : DEPT SERVER ROLE ID
            // Command roles will be in one sync to the Department Staff role
            '1258857818975371346': '1281387559691358310', // Oakland State Police
            '1258857971006308503': '1260796400967487538', // OSP Sergeant First Class
            '1258858021334028410': '1260799817001467935', // OSP Sergeant
            '1258858050970718289': '1260799850493116450', // OSP Corporal
            '1258858823427559525': '1260800054881554485', // OSP Supervisor (Command in OSP Server)
            '1258858823427559525': '1260800091850018866', // OSP Supervisor
            '1258858076191068250': '1260799870025990144', // OSP Trooper First Class
            '1258858108869152878': '1260799908508598313', // OSP Senior Trooper
            '1258858143497060502': '1260799933078831134', // OSP Trooper
            '1258858172618117223': '1262160040513634384', // OSP Reserve Trooper
            '1258858276053848166': '1260799949474369546', // OSP Prob Trooper
            '1258858302805246092': '1260799974296256562', // OSP Cadet
            '1111787734336557098': '1281387559691358310', // Divider below OSP roles

            '1072621508377186347': '1072621508259745830', // Fairfield Police Department
            '1151275644899049568': '1072621508377186346', // FPD Chief
            '1151275644899049565': '1076326479316656169', // FPD Assistant Chief
            '1206536549592735785': '1072621508377186345', // FPD Commander
            '1206591765658869780': '1072621508343636015', // FPD Captain
            '1151275644861284447': '1072621508343636014', // FPD Lieutenant
            '1151275644861284444': '1072621508343636013', // FPD Sergeant
            '1151275644899049562': '1072621508377186344', // FPD Supervisor
            '1151275644831928471': '1072621508343636012', // FPD Corporal
            '1151276262384488448': '1072621508343636011', // FPD Officer
            '1151275644831928467': '1072621508343636010', // FPD Prob Officer
            '1151275644831928464': '1255677921570590784', // FPD Recruit
            '1206534190074699836': '1279945767393427476', // FPD IA
            '1278139704876728340': '1208470578965647400', // FPD SRT
            '1278139886771245188': '1072621508343636009', // FPD FTO
            '1278139946477027339': '1279945612183343104', // FPD CID
            '1278140003163181106': '1279945729070075904', // FPD PIO
            '1151275644831928465': '1072621508259745830', // Divider below FPD roles

            '1072621508377186347': '1209671781217214486', // Maple County Sheriff's Office
            '1072621508456882299': '1209650867394052166', // MCSO Sheriff
            '1072621508414951554': '1209655411553083402', // MCSO Undersheriff
            '1072621508414951553': '1209662977817452614', // MCSO Chief Deputy
            '1072621508414951551': '1209664609511018596', // MCSO Captain
            '1072621508414951550': '1209664617878392902', // MCSO Lieutenant
            '1072621508414951549': '1209664618784620614', // MCSO Sergeant
            '1072621508456882300': '1281388390058692731', // MCSO Supervisor
            '1072621508414951547': '1209665633101291623', // MCSO Corporal
            '1212514827025649674': '1209665749979897907', // MCSO Senior Deputy
            '1072621508414951545': '1209665750659366913', // MCSO Deputy
            '1072621508377186353': '1224208597727051879', // MCSO Prob Deputy
            '1072621508377186352': '1209665751305162833', // MCSO Cadet
            '1271448456061255711': '1269483744964644884', // MCSO Reserve Deputy
            '1208257362293694474': '1209677145023057982', // MCSO IA
            '1208257015613358090': '1209677142993145877', // MCSO SWAT
            '1072621508377186351': '1209675767936720966', // MCSO FTO
            '1208256701841678366': '1209676793649565756', // MCSO CID
            '1211180976039010315': '1209676792638476359', // MCSO Conservation
            '1072621508377186349': '1209671781217214486', // Divider below MCSO roles

            '1072621508494626895': '1276353171320602717', // Fairfield Fire Department
            '1072621508494626894': '1276353171358351426', // FFD Chief
            '1074325756051734539': '1276353171358351425', // FFD Deputy Chief
            '1072621508494626893': '1276353171358351424', // FFD Assistant Chief
            '1083588635359707206': '1276355010480836682', // FFD Batt Chief
            '1072621508494626890': '1276353171349966944', // FFD Captain
            '1072621508494626889': '1276353171349966943', // FFD Lieutenant
            '1200843420504162304': '1281391580699430992', // FFD Supervisor
            '1072621508494626888': '1276353171337515064', // FFD Engineer
            '1072621508494626887': '1276355162927136889', // FFD Senior Firefighter
            '1072621508456882307': '1276353171337515063', // FFD Firefighter/EMT
            '1072621508456882304': '1276353171337515062', // FFD Prob Firefighter
            '1072621508456882305': '1276353171287048388', // FFD FTO
            '1213219437524815972': '1276353171299766388', // FFD Investigator
            '1208213642521219112': '1276353171320602717', // Divider below FFD roles

            '1258859546563051573': '1260754184609726525', // Oakland Department of Transportation
            '1260963434653155369': '1260705998608404481', // ODOT Director
            '1260963460578152590': '1260728903115477042', // ODOT Deputy Director
            '1260963492178038836': '1260729087505334332', // ODOT Chief Engineer
            '1260963518753144912': '1260963730905370634', // ODOT Engineering Manager
            '1260963552836059199': '1260705867037413440', // ODOT Project Manager
            '1260963581223112734': '1260730195934183424', // ODOT Technician Supervisor
            '1260963611736670239': '1260731500781895690', // ODOT Senior Technician
            '1260963646465511516': '1260731509636206644', // ODOT Technician
            '1260963673795723321': '1260731512777867275', // ODOT Trainee
            '1280166408667533427': '1277794072110825534', // ODOT Maintenance
            '1280166487650340915': '1277794027697344592', // ODOT Roadside
            '1280166642118295695': '1262491326096871495', // ODOT Health & Safety
            '1260964149333331979': '1262491383797907627', // ODOT HR
            '1260964089086218250': '1262491493365452831', // ODOT FTO
            '1260964252680982599': '1262491454748758187', // ODOT PIO
            '1072621508456882303': '1260754184609726525', // Divider below ODOT roles

            '1072621508305899677': '1074381966335541289', // Maple County Communications
            '1260963434653155369': '1074381966335541297', // MCC Director
            '1260963460578152590': '1074381966335541295', // MCC Deputy Director
            '1260963492178038836': '1074381966335541294', // MCC Ops Supervisor
            '1260963518753144912': '1074381966335541292', // MCC Senior Dispatcher
            '1260963552836059199': '1074381966335541291', // MCC Dispatcher
            '1260963581223112734': '1074381966335541290', // MCC Prob Dispatcher
            '1260963611736670239': '1074381965983227991', // MCC Trainee
            '1260963611736670239': '1121644815369646100', // MCC FTO
            '1258859764109021225': '1074381966335541289', // Divider below MCC roles

            '1258859820891635763': '1271631096336879677', // Hanover Township Police Department
            '1280181782037266563': '1271631194697764948', // HTPD Chief
            '1281357222668144735': '1281358579324162138', // HTPD Deputy Chief
            '1281357248982941828': '1281358610282184789', // HTPD Captain
            '1281357266741755965': '1271631255246602363', // HTPD Lieutenant
            '1281357289718153237': '1271631283453165598', // HTPD Sergeant
            '1281357711866335386': '1271634094777827338', // HTPD Supervisor
            '1281357305832669347': '1271631334913085494', // HTPD Corporal
            '1281357331522654259': '1271631362029256714', // HTPD Officer
            '1281357348476026911': '1281358631685718097', // HTPD Prob Officer
            '1121797034601615421': '1271631096336879677', // Divider below HTPD roles
        };

        const mainGuild = client.guilds.cache.get(mainServerId);
        if (!mainGuild) {
            return interaction.editReply({ content: "Main server not found.", ephemeral: true });
        }

        let roleChanges = [];

        for (const deptServerId of departmentServerIds) {
            const departmentGuild = client.guilds.cache.get(deptServerId);
            if (!departmentGuild) continue;

            let members = departmentGuild.members.cache;
            if (members.size === 0) {
                try {
                    members = await departmentGuild.members.fetch(); // Ensure the members are fetched
                } catch (error) {
                    console.error(`Failed to fetch members for guild ${deptServerId}:`, error);
                    continue;
                }
            }

            for (const [memberId, departmentMember] of members) {
                const mainMember = await mainGuild.members.fetch(memberId).catch(() => null);
                if (!mainMember) continue;

                for (const [mainRoleId, deptRoleId] of Object.entries(roleMappings)) {
                    const hasDeptRole = departmentMember.roles.cache.has(deptRoleId);
                    const hasMainRole = mainMember.roles.cache.has(mainRoleId);

                    if (hasDeptRole && !hasMainRole) {
                        roleChanges.push(`Will add role <@&${mainRoleId}> to <@${memberId}> in the main server.`);
                    } else if (!hasDeptRole && hasMainRole) {
                        roleChanges.push(`Will remove role <@&${mainRoleId}> from <@${memberId}> in the main server.`);
                    }
                }
            }
        }

        if (roleChanges.length === 0) {
            return interaction.editReply({ content: "No role changes are needed.", ephemeral: true });
        }

        const chunkSize = 1000;
        let embeds = [];
        for (let i = 0; i < roleChanges.length; i += chunkSize) {
            const chunk = roleChanges.slice(i, i + chunkSize);
            const embed = new EmbedBuilder()
                .setTitle("Role Sync Confirmation")
                .setDescription(chunk.join('\n'))
                .setColor('Blue');
            embeds.push(embed);
        }

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirmSync')
            .setLabel('Confirm Role Sync')
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancelSync')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        let message = await interaction.editReply({
            embeds: [embeds[0]],
            components: [row],
            ephemeral: true
        });

        if (embeds.length > 1) {
            for (let i = 1; i < embeds.length; i++) {
                await message.channel.send({ embeds: [embeds[i]], ephemeral: true });
            }
        }

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'confirmSync') {
                for (const deptServerId of departmentServerIds) {
                    const departmentGuild = client.guilds.cache.get(deptServerId);
                    if (!departmentGuild) continue;

                    let members = departmentGuild.members.cache;
                    if (members.size === 0) {
                        try {
                            members = await departmentGuild.members.fetch();
                        } catch (error) {
                            console.error(`Failed to fetch members for guild ${deptServerId}:`, error);
                            continue;
                        }
                    }

                    for (const [memberId, departmentMember] of members) {
                        const mainMember = await mainGuild.members.fetch(memberId).catch(() => null);
                        if (!mainMember) continue;

                        let rolesToAdd = [];
                        let rolesToRemove = [];

                        for (const [mainRoleId, deptRoleId] of Object.entries(roleMappings)) {
                            const hasDeptRole = departmentMember.roles.cache.has(deptRoleId);
                            const hasMainRole = mainMember.roles.cache.has(mainRoleId);

                            if (hasDeptRole && !hasMainRole) {
                                rolesToAdd.push(mainRoleId);
                            } else if (!hasDeptRole && hasMainRole) {
                                rolesToRemove.push(mainRoleId);
                            }
                        }

                        if (rolesToAdd.length > 0) {
                            await mainMember.roles.add(rolesToAdd).catch(error => console.error(`Failed to add roles to <@${memberId}>:`, error));
                        }
                        if (rolesToRemove.length > 0) {
                            await mainMember.roles.remove(rolesToRemove).catch(error => console.error(`Failed to remove roles from <@${memberId}>:`, error));
                        }
                    }
                }

                await i.update({ content: "Roles have been synced successfully.", components: [], ephemeral: true });
            } else if (i.customId === 'cancelSync') {
                await i.update({ content: "Role sync has been canceled.", components: [], ephemeral: true });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({ content: "Role sync confirmation timed out.", components: [], ephemeral: true });
            }
        });
    }
};