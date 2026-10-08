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
    startServerStatusUpdater
} = require('./commands/server-status');

const {
    startWarningExpiryChecker
} = require('./utils/warningExpiry');

const levelVoice =
    require('./events/levelVoice');

const {
    startLevelEventChecker
} = require('./utils/levelEventChecker');

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands =
    new Collection();

/*
 * ==============================
 * COMMANDS LADEN
 * ==============================
 */

loadCommands(client);

/*
 * ==============================
 * EVENTS LADEN
 * ==============================
 */

loadEvents(client);

/*
 * ==============================
 * BOT READY
 * ==============================
 */

client.once('ready', () => {
    console.log(
        '──────────────────────────────'
    );

    console.log(
        `Bot: ${client.user.tag}`
    );

    console.log(
        `ID:  ${client.user.id}`
    );

    console.log(
        `Guilds: ${client.guilds.cache.size}`
    );

    console.log(
        'Status: Online'
    );

    console.log(
        '──────────────────────────────'
    );

    /*
     * ==============================
     * MINECRAFT SERVER STATUS
     * ==============================
     */

    startServerStatusUpdater(
        client
    );

    /*
     * ==============================
     * WARNUNGS-ABLAUFPRÜFUNG
     * ==============================
     */

    startWarningExpiryChecker(
        client
    );

    /*
     * ==============================
     * LEVEL VOICE XP
     * ==============================
     */

    levelVoice.startVoiceXpTracker(
        client
    );

    /*
     * ==============================
     * LEVEL XP EVENT CHECKER
     * ==============================
     *
     * Prüft automatisch, ob ein
     * Doppel-/Mehrfach-XP-Event
     * abgelaufen ist.
     *
     * Bei Ablauf wird automatisch
     * eine Nachricht in den
     * Level-Up-Kanal geschickt.
     */

    startLevelEventChecker(
        client
    );
});

/*
 * ==============================
 * DISCORD LOGIN
 * ==============================
 */

client.login(
    process.env.DISCORD_TOKEN
);