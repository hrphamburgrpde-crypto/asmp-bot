const {
    Events
} = require('discord.js');

const {
    startStatusUpdater
} = require(
    '../components/botStatus/statusManager'
);

module.exports = {
    name: Events.ClientReady,
    once: true,

    execute(client) {

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
         * Gespeicherte Status-Nachricht laden
         * und automatischen Updater starten.
         */

        startStatusUpdater(client);
    }
};