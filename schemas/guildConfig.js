const { Schema, model, models, mongoose } = require('mongoose');

const guildConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    leaveRequestPanelChannelId: { type: String, required: true},
    leaveApprovalChannelId: { type: String, required: true },
    leavePanelChannelId: { type: String, required: true },
});

module.exports = mongoose.model('GuildConfig', guildConfigSchema);