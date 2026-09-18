const {
    Client,
    Collection,
    GatewayIntentBits
} = require('discord.js');

const dotenv = require('dotenv');

const loadCommands =
    require('./handlers/commandHandler');

const loadEvents =
    require('./handlers/eventHandler');

const {
    startMinecraftEventServer
} = require(
    './components/minecraft/minecraftEventServer'
);


/*
 * ==========================================
 * ENV LADEN
 * ==========================================
 */

dotenv.config();


/*
 * ==========================================
 * DISCORD CLIENT
 * ==========================================
 */

const client =
    new Client({

        intents: [

            GatewayIntentBits.Guilds,

            GatewayIntentBits.GuildMembers,

            GatewayIntentBits.GuildMessages,

            GatewayIntentBits.MessageContent,

            GatewayIntentBits.GuildVoiceStates

        ]

    });


/*
 * ==========================================
 * COMMAND COLLECTION
 * ==========================================
 */

client.commands =
    new Collection();


/*
 * ==========================================
 * COMMANDS LADEN
 * ==========================================
 */

loadCommands(
    client
);


/*
 * ==========================================
 * EVENTS LADEN
 * ==========================================
 */

loadEvents(
    client
);


/*
 * ==========================================
 * MINECRAFT EVENT SERVER
 * ==========================================
 */

try {

    startMinecraftEventServer(
        client
    );

} catch (error) {

    console.error(
        '[MINECRAFT] Event-Server konnte nicht gestartet werden:',
        error
    );

}


/*
 * ==========================================
 * DISCORD LOGIN
 * ==========================================
 */

client.login(
    process.env.DISCORD_TOKEN
);


/*
 * ==========================================
 * FEHLER
 * ==========================================
 */

process.on(
    'unhandledRejection',
    error => {

        console.error(
            '[UNHANDLED REJECTION]',
            error
        );

    }
);


process.on(
    'uncaughtException',
    error => {

        console.error(
            '[UNCAUGHT EXCEPTION]',
            error
        );

    }
);