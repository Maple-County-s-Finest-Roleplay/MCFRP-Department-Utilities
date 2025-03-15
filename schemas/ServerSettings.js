const mongoose = require('mongoose')

const serverSettingsSchema = new mongoose.Schema({
    guildId: String,
    allowedShiftTypes: [String],
});

module.exports = mongoose.model('ServerSettings', serverSettingsSchema);