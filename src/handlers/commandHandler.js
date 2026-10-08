const fs = require('fs');
const path = require('path');

module.exports = function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');

    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (!command.data || !command.execute) {
            console.warn(
                `[COMMAND] ${file} besitzt kein "data" oder "execute".`
            );
            continue;
        }

        client.commands.set(command.data.name, command);

        console.log(
            `[COMMAND] /${command.data.name} geladen.`
        );
    }
};