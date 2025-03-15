const { Schema, model } = require('mongoose');

const loaSchema = new Schema({
    leaveId: { type: String, required: true },
    userId: { type: String, required: true },
    leaveType: { type: String, required: true },
    startDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    reason: { type: String, required: true },
    guildId: { type: String, required: true },
    active: { type: Boolean, default: false },
});

module.exports = model('Leave', loaSchema);
