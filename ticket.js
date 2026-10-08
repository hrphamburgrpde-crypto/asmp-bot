const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const createTicketPanel =
    require('../components/tickets/ticketPanel');

const {
    ChannelType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription(
            'Verwaltet das Ticketsystem.'
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription(
                    'Erstellt das Ticket-Panel.'
                )
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(
        interaction,
        client
    ) {

        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return interaction.reply({
                content:
                    '❌ Du benötigst Administrator-Rechte.',
                ephemeral: true
            });
        }

        const subcommand =
            interaction.options.getSubcommand();

        if (subcommand !== 'setup') {
            return;
        }

        /*
         * Prüfen, ob die Ticket-Kategorie existiert.
         */

        const category =
            interaction.guild.channels.cache.get(
                process.env.TICKET_CATEGORY_ID
            );

        if (
            !category ||
            category.type !== ChannelType.GuildCategory
        ) {
            return interaction.reply({
                content:
                    '❌ Die `TICKET_CATEGORY_ID` ist ungültig oder die Kategorie wurde nicht gefunden.',
                ephemeral: true
            });
        }

        /*
         * Ticket-Panel senden.
         */

        await interaction.reply({
            components: [
                createTicketPanel()
            ],
            flags:
                MessageFlags.IsComponentsV2
        });
    }
};