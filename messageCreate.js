const { Events } = require('discord.js');

const URL_REGEX =
    /(?:https?:\/\/|www\.)[^\s]+/gi;

module.exports = {

    name: Events.MessageCreate,

    async execute(message) {

        // Bots ignorieren
        if (message.author.bot) {
            return;
        }


        // Keine DMs prüfen
        if (!message.guild) {
            return;
        }


        // Links erkennen
        const hasLink =
            URL_REGEX.test(message.content);


        if (!hasLink) {
            return;
        }


        // Administratoren dürfen Links senden
        if (
             message.member?.permissions.has(
             'Administrator'
            )
        ) {
            return;
        }


        try {

            await message.delete();

        } catch (error) {

            console.error(
                '[ANTILINK] Nachricht konnte nicht gelöscht werden:',
                error
            );

            return;

        }


        try {

            const warning =
                await message.channel.send({

                    content:
                        `🚫 ${message.author}, Links sind hier nicht erlaubt!`

                });


            setTimeout(
                async () => {

                    try {

                        await warning.delete();

                    } catch {}

                },
                5000
            );


        } catch (error) {

            console.error(
                '[ANTILINK] Warnung konnte nicht gesendet werden:',
                error
            );

        }

    }

};