require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
    REST,
    Routes
} = require('discord.js');

const commands = [];

const commandsPath = path.join(
    __dirname,
    'src',
    'commands'
);

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(
        path.join(commandsPath, file)
    );

    if (command.data) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({
    version: '10'
}).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(
            `Registriere ${commands.length} Guild-Command(s)...`
        );

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log(
            'Guild-Commands erfolgreich registriert.'
        );
    } catch (error) {
        console.error(error);
    }
})();