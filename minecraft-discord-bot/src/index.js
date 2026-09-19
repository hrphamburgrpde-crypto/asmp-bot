const {
    Client,
    Collection,
    GatewayIntentBits
} = require('discord.js');

const dotenv = require('dotenv');

const loadCommands = require('./handlers/commandHandler');
const loadEvents = require('./handlers/eventHandler');

const {
    startServerStatusUpdater
} = require('./commands/server-status');

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

loadCommands(client);
loadEvents(client);

startServerStatusUpdater(client);

client.once('ready', () => {
    console.log('──────────────────────────────');
    console.log(`Bot: ${client.user.tag}`);
    console.log(`ID:  ${client.user.id}`);
    console.log(`Guilds: ${client.guilds.cache.size}`);
    console.log('Status: Online');
    console.log('──────────────────────────────');
});

client.login(process.env.DISCORD_TOKEN);
