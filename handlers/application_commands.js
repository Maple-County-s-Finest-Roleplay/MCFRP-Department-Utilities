const client = require("../department-utilities");
const { PermissionsBitField, Routes, REST, User } = require('discord.js');
const fs = require("fs");
const colors = require("colors");

module.exports = (client, config) => {
  console.log("0------------------| Application commands Handler:".blue);

  let commands = [];

  // Slash commands handler:
  const slashCommandsDir = './commands/slash/';
  const slashCommandDirs = fs.readdirSync(slashCommandsDir);
  console.log('[!] Started loading slash commands...'.yellow);

  slashCommandDirs.forEach((dir) => {
    const slashCommandFiles = fs.readdirSync(`${slashCommandsDir}${dir}`).filter((file) => file.endsWith('.js'));
    
    const totalFiles = slashCommandFiles.length;
    let loadedFiles = 0;

    console.log(`[HANDLER - SLASH] Found ${totalFiles} files in ${dir} directory.`);

    for (let file of slashCommandFiles) {
      let pull = require(`../commands/slash/${dir}/${file}`);

      if (pull.name && pull.description && pull.type === 1) {
        client.slash_commands.set(pull.name, pull);
        loadedFiles++;

        // Calculate the percentage of completion
        const percentageComplete = (loadedFiles / totalFiles) * 100;

        console.log(`[HANDLER - SLASH] Loaded a file: ${pull.name} (#${loadedFiles} of ${totalFiles} files, ${percentageComplete.toFixed(2)}% complete)` .brightGreen);

        commands.push({
          name: pull.name,
          description: pull.description,
          type: pull.type || 1,
          options: pull.options ? pull.options : null,
          default_permission: pull.permissions.DEFAULT_PERMISSIONS ? pull.permissions.DEFAULT_PERMISSIONS : null,
          default_member_permissions: pull.permissions.DEFAULT_MEMBER_PERMISSIONS ? PermissionsBitField.resolve(pull.permissions.DEFAULT_MEMBER_PERMISSIONS).toString() : null
        });
      } else {
        console.log(`[HANDLER - SLASH] Couldn't load the file ${file}, missing module name value, description, or type isn't 1.`.red)
        continue;
      }
    }
  });
  // User commands handler:
  const userCommandsDir = './commands/user/';
  fs.readdirSync(userCommandsDir).forEach((dir) => {
    console.log('[!] Started loading user commands...'.yellow);
    const userCommandFiles = fs.readdirSync(`${userCommandsDir}${dir}`).filter((file) => file.endsWith('.js'));

    console.log(`[HANDLER - USER] Found ${userCommandFiles.length} files in ${dir} directory.`);

    for (let file of userCommandFiles) {
      let pull = require(`../commands/user/${dir}/${file}`);

      if (pull.name, pull.type == 2) {
        client.user_commands.set(pull.name, pull);
        console.log(`[HANDLER - USER] Loaded a file: ${pull.name} (#${client.user_commands.size})`.brightGreen);

        commands.push({
          name: pull.name,
          type: pull.type || 2,
        });

      } else {
        console.log(`[HANDLER - USER] Couldn't load the file ${file}, missing module name value or type isn't 2.`.red)
        continue;
      };
    };
  });

  // Message commands handler:
  const messageCommandsDir = './commands/message/';
  fs.readdirSync(messageCommandsDir).forEach((dir) => {
    console.log('[!] Started loading message commands...'.yellow);
    const messageCommandFiles = fs.readdirSync(`${messageCommandsDir}${dir}`).filter((file) => file.endsWith('.js'));

    console.log(`[HANDLER - MESSAGE] Found ${messageCommandFiles.length} files in ${dir} directory.`);

    for (let file of messageCommandFiles) {
      let pull = require(`../commands/message/${dir}/${file}`);

      if (pull.name, pull.type == 3) {
        client.message_commands.set(pull.name, pull);
        console.log(`[HANDLER - MESSAGE] Loaded a file: ${pull.name} (#${client.user_commands.size})`.brightGreen);

        commands.push({
          name: pull.name,
          type: pull.type || 3,
        });

      } else {
        console.log(`[HANDLER - MESSAGE] Couldn't load the file ${file}, missing module name value or type isn't 3.`.red)
        continue;
      };
    };
  });

  // Registering all the application commands:
  if (!config.Client.ID) {
    console.log("[CRASH] You need to provide your bot ID in config.js!".red + "\n");
    return process.exit();
  }

  const rest = new REST({ version: '10' }).setToken(config.Client.TOKEN || process.env.TOKEN);

  (async () => {
    console.log('[HANDLER] Started registering all the application commands.'.yellow);

    const startTime = performance.now();

    try {
      await rest.put(
        Routes.applicationCommands(config.Client.ID),
        { body: commands }
      );

      const endTime = performance.now();
      const elapsedSeconds = (endTime - startTime) / 1000;
      const numCommands = commands.length;

      console.log(`[HANDLER] Successfully registered ${numCommands} application commands in ${elapsedSeconds.toFixed(2)} seconds.`.brightGreen);
    } catch (err) {
      console.log(err);
    }
  })();
};