const client = require("../../department-utilities");
const colors = require("colors");
const { ActivityType } = require('discord.js')

module.exports = {
  name: "ready.js"
};

client.once('ready', async () => {
  console.log("\n" + `[READY] ${client.user.tag} is up and ready to go.`.brightGreen);
  client.user.setPresence({
    activities: [{ name: "Starting up the computers...", type: 4 }],
    status: 'online'
  });

  let currentPresence = 0;
  
  const presences = [
    {
      activities: [{ name: "OSP", type: 3 }], // OSP Department
      status: 'online'
    },
    {
      activities: [{ name: "FPD", type: 3 }], // FPD Department
      status: 'online'
    },
    {
      activities: [{ name: "MCSO", type: 3 }], // MCSO Department
      status: 'online'
    },
    {
      activities: [{ name: "FFR", type: 3 }], // FFR Department
      status: 'online'
    },
    {
      activities: [{ name: "ODOT", type: 3 }], // ODOT Department
      status: 'online'
    },
    {
      activities: [{ name: "MCC", type: 3 }], // MCC Department
      status: 'online'
    },
    {
      activities: [{ name: "HTPD", type: 3 }], // HTPD Department
      status: 'online'
    },
    {
      activities: [{ name: "on the station computers", type: ActivityType.Playing }], // Casual activity
      status: 'online'
    }
  ];

  // Set an interval to cycle through the presences
  setInterval(() => {
    currentPresence = (currentPresence + 1) % presences.length;
    client.user.setPresence(presences[currentPresence]);
  }, 15000); // 15 seconds
});
