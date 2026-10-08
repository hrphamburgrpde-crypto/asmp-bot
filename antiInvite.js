const {
    Events,
    PermissionFlagsBits
} = require('discord.js');

const INVITE_REGEX =
    /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+/i;

const TIMEOUT_DURATION = 30 * 1000;

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {

        // Bots ignorieren
        if (message.author.bot) {
            return;
        }

        // DMs ignorieren
        if (!message.guild) {
            return;
        }

        // Prüfen, ob eine Discord-Einladung enthalten ist
        if (!INVITE_REGEX.test(message.content)) {
            return;
        }

        /*
         * Server-/Administrator-Team nicht bestrafen.
         *
         * Dadurch können Admins/Moderatoren weiterhin
         * Discord-Invites posten.
         */

        if (
            message.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return;
        }

        /*
         * Nachricht löschen
         */

        try {
            await message.delete();
        } catch (error) {
            console.error(
                '[ANTI-INVITE] Nachricht konnte nicht gelöscht werden:',
                error
            );

            return;
        }

        /*
         * User für 30 Sekunden timeouten
         */

        try {
            await message.member.timeout(
                TIMEOUT_DURATION,
                'Eigenwerbung / Discord-Einladung'
            );
        } catch (error) {
            console.error(
                '[ANTI-INVITE] Timeout konnte nicht gesetzt werden:',
                error
            );
        }

        /*
         * Warnung senden
         */

        try {

            const warning =
                await message.channel.send({
                    content:
                        `Hallo ${message.author} Eigenwerbung ist bei ApfelSMP Verboten !`
                });

            /*
             * Warnung nach 5 Sekunden löschen,
             * damit der Chat sauber bleibt.
             */

            setTimeout(
                async () => {

                    try {
                        await warning.delete();
                    } catch {
                        // Nachricht existiert möglicherweise nicht mehr.
                    }

                },
                5000
            );

        } catch (error) {

            console.error(
                '[ANTI-INVITE] Warnung konnte nicht gesendet werden:',
                error
            );
        }

        console.log(
            `[ANTI-INVITE] ${message.author.tag} wurde wegen Eigenwerbung für 30 Sekunden getimeoutet.`
        );
    }
};