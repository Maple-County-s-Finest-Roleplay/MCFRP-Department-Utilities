const config = require("../config/config.js");
const mongoose = require('mongoose')

module.exports = (client) => {
	console.log('[DATABASE] Connecting to MongoDB...'.yellow)
	const mongo = process.env.MONGO || config.Handlers.MONGO;
	
	if (!mongo) {
		console.warn("[WARN] A Mongo URI/URL isn't provided! (Not required)");
	} else {
		mongoose.connect(mongo)
		console.log('[DATABASE] Connected to MongoDB!'.green)	
	};
};
