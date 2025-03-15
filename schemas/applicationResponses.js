const { Schema, model, models, mongoose } = require('mongoose');

const applicationResponseSchema = new Schema({
    guildId: String,
    applicationName: String,
    userId: String,
    submittedTimestamp: String,
    messageLink: String,
    status: String,
    lastUpdated: String,
    updatedBy: String,
});

const applicationResponseSchemas = mongoose.model('applicationResponse', applicationResponseSchema);
module.exports = applicationResponseSchemas