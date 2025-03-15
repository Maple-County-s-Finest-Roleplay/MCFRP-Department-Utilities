const { performance } = require('perf_hooks');
const database = require('../../../schemas/shift');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: "convert-ids",
    description: "Convert shift IDs to start with 'S-' if they do not already",
    type: 1,
    permissions: {
        DEFAULT_MEMBER_PERMISSIONS: "ManageGuild" // Only high command can run this command
    },
    run: async (client, interaction, config, db) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply("Only high command can run this command!");
        }

        await interaction.reply("Starting the ID conversion process...");

        try {
            const shifts = await database.find({});
            let updatedCount = 0;

            for (const shift of shifts) {
                if (!shift.shiftId.startsWith("S-")) {
                    const newShiftId = generateShiftId();
                    await database.updateOne({ _id: shift._id }, { shiftId: newShiftId });
                    updatedCount++;
                }
            }

            await interaction.editReply(`ID conversion process completed. Updated ${updatedCount} shifts.`);
        } catch (error) {
            console.error(error);
            await interaction.editReply("An error occurred during the ID conversion process. Please try again later.");
        }
    }
};

function generateShiftId() {
    return `S-${Math.random().toString(36).substring(2, 14)}`;
}
