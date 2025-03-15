const { Schema, model, models, mongoose } = require('mongoose');

const counterSchema = new Schema({
    name: String,
    currentShiftId: Number,
});

module.exports = mongoose.model('Counter', counterSchema);