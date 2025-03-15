const { Schema, model, models, mongoose } = require('mongoose');

const schema = new Schema({
    shiftId: String,
    userId: String,
    shiftDuration: Number,
    shiftType: String,
    started: String,
    ended: String,
    breaks: [
        {
          start: String,
          end: String
        }
      ],
    guildId: String,
});

const shiftSchema = mongoose.model('shiftSchema', schema);

module.exports = shiftSchema