const {
    Events,
    MessageFlags
} = require('discord.js');

const {
    isAdministrator,
    createCommandModal,
    createHelpPanel,
    executeCommand
} = require(
    '../components/minecraft/minecraftModeration'
);

/*
 * ==============================
 * VOICE SUPPORT
 * ==============================
 */

const {
    openSupport,
    closeSupport,
    takeSupportCase
} = require(
    '../components/support/supportManager'
);


/*
 * ==============================
 * TICKETS
 * ==============================
 */

const {
    createTicket,
    showPriorityPanel,
    setTicketPriority,
    claimTicket,
    closeTicket,
    reopenTicket,
    deleteTicket,
    submitFeedback
} = require(
    '../components/tickets/ticketManager'
);


/*
 * ==============================
 * FEEDBACK MODAL
 * ==============================
 */

const createFeedbackModal =
    require(
        '../components/tickets/feedbackModal'
    );


module.exports = {

    name:
        Events.InteractionCreate,


    async execute(
        interaction,
        client
    ) {


        /*
         * ==============================
         * SLASH COMMANDS
         * ==============================
         */

        if (
            interaction.isChatInputCommand()
        ) {

            const command =
                client.commands.get(
                    interaction.commandName
                );


            if (!command) {
                return;
            }


            try {

                await command.execute(
                    interaction,
                    client
                );

            } catch (error) {

                console.error(
                    `[COMMAND ERROR] /${interaction.commandName}`,
                    error
                );


                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {

                    try {

                        await interaction.reply({

                            content:
                                '❌ Beim Ausführen des Commands ist ein Fehler aufgetreten.',

                            flags:
                                MessageFlags.Ephemeral

                        });

                    } catch {}

                }

            }


            return;

        }


        
        /*
         * ==============================
         * BUTTONS
         * ==============================
         */

        if (
            interaction.isButton()
        ) {


            /*
             * ==============================
             * SUPPORT ÖFFNEN
             * ==============================
             */

            if (
                interaction.customId ===
                'support_open'
            ) {

                try {

                    await openSupport(
                        interaction
                    );

                } catch (error) {

                    console.error(
                        '[SUPPORT OPEN ERROR]',
                        error
                    );


                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {

                        await interaction.reply({

                            content:
                                '❌ Der Support konnte nicht geöffnet werden.',

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                }


                return;

            }


            /*
             * ==============================
             * SUPPORT SCHLIESSEN
             * ==============================
             */

            if (
                interaction.customId ===
                'support_close'
            ) {

                try {

                    await closeSupport(
                        interaction
                    );

                } catch (error) {

                    console.error(
                        '[SUPPORT CLOSE ERROR]',
                        error
                    );


                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {

                        await interaction.reply({

                            content:
                                '❌ Der Support konnte nicht geschlossen werden.',

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                }


                return;

            }


            /*
             * ==============================
             * SUPPORT-FALL ÜBERNEHMEN
             * ==============================
             */

            if (
                interaction.customId.startsWith(
                    'support_take_'
                )
            ) {

                const targetUserId =
                    interaction.customId.replace(
                        'support_take_',
                        ''
                    );


                try {

                    await takeSupportCase(
                        interaction,
                        targetUserId
                    );

                } catch (error) {

                    console.error(
                        '[SUPPORT TAKE ERROR]',
                        error
                    );


                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {

                        await interaction.reply({

                            content:
                                '❌ Der Support-Fall konnte nicht übernommen werden.',

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                }


                return;

            }


            /*
             * ==============================
             * TICKET ERSTELLEN
             * ==============================
             */

            const ticketCreationButtons = {

                ticket_support:
                    'support',

                ticket_technical:
                    'technical',

                ticket_report:
                    'report'

            };


            if (
                ticketCreationButtons[
                    interaction.customId
                ]
            ) {

                try {

                    await createTicket(

                        interaction,

                        ticketCreationButtons[
                            interaction.customId
                        ]

                    );

                } catch (error) {

                    console.error(
                        '[TICKET CREATE ERROR]',
                        error
                    );


                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {

                        await interaction.reply({

                            content:
                                '❌ Beim Erstellen des Tickets ist ein Fehler aufgetreten.',

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                }


                return;

            }


            /*
             * ==============================
             * TICKET PRIORITÄT PANEL
             * ==============================
             */

            if (
                interaction.customId ===
                'ticket_priority'
            ) {

                try {

                    await showPriorityPanel(
                        interaction
                    );

                } catch (error) {

                    console.error(
                        '[TICKET PRIORITY ERROR]',
                        error
                    );

                }


                return;

            }


            /*
             * ==============================
             * PRIORITÄT SETZEN
             * ==============================
             */

            const priorityButtons = {

                ticket_priority_high:
                    'high',

                ticket_priority_medium:
                    'medium',

                ticket_priority_low:
                    'low'

            };


            if (
                priorityButtons[
                    interaction.customId
                ]
            ) {

                try {

                    await setTicketPriority(

                        interaction,

                        priorityButtons[
                            interaction.customId
                        ]

                    );

                } catch (error) {

                    console.error(
                        '[TICKET PRIORITY ERROR]',
                        error
                    );

                }


                return;

            }


            /*
             * ==============================
             * TICKET CLAIM
             * ==============================
             */

            if (
                interaction.customId ===
                'ticket_claim'
            ) {

                try {

                    await claimTicket(
                        interaction
                    );

                } catch (error) {

                    console.error(
                        '[TICKET CLAIM ERROR]',
                        error
                    );

                }


                return;

            }


            /*
             * ==============================
             * TICKET SCHLIESSEN
             * ==============================
             */

            if (
                interaction.customId ===
                'ticket_close'
            ) {

                try {

                    await closeTicket(
                        interaction
                    );

                } catch (error) {

                    console.error(
                        '[TICKET CLOSE ERROR]',
                        error
                    );

                }


                return;

            }


            /*
             * ==============================
             * TICKET WIEDER ÖFFNEN
             * ==============================
             */

            if (
                interaction.customId ===
                'ticket_reopen'
            ) {

                try {

                    await reopenTicket(
                        interaction
                    );

                } catch (error) {

                    console.error(
                        '[TICKET REOPEN ERROR]',
                        error
                    );

                }


                return;

            }


            /*
             * ==============================
             * TICKET LÖSCHEN
             * ==============================
             */

            if (
                interaction.customId ===
                'ticket_delete'
            ) {

                try {

                    await deleteTicket(
                        interaction
                    );

                } catch (error) {

                    console.error(
                        '[TICKET DELETE ERROR]',
                        error
                    );

                }


                return;

            }


            /*
             * ==============================
             * FEEDBACK STERNE
             * ==============================
             *
             * Format:
             *
             * feedback_star_5_123456789
             *
             */

            if (
                interaction.customId.startsWith(
                    'feedback_star_'
                )
            ) {

                const parts =
                    interaction.customId.split(
                        '_'
                    );


                const stars =
                    Number(
                        parts[2]
                    );


                const ticketId =
                    parts
                        .slice(3)
                        .join('_');


                if (
                    stars < 1 ||
                    stars > 5 ||
                    !ticketId
                ) {

                    return interaction.reply({

                        content:
                            '❌ Ungültige Bewertung.',

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                try {

                    await interaction.showModal(

                        createFeedbackModal(

                            stars,

                            ticketId

                        )

                    );

                } catch (error) {

                    console.error(
                        '[FEEDBACK MODAL ERROR]',
                        error
                    );

                }


                return;

            }


            /*
             * ==============================
             * MINECRAFT MODERATION PANEL
             * ==============================
             */

            if (
                interaction.customId ===
                'minecraft_commandbox'
            ) {

                if (
                    !isAdministrator(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Nur Server-Administratoren können die Commandbox verwenden.',

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                return interaction.showModal(
                    createCommandModal()
                );

            }


            /*
             * ==============================
             * MINECRAFT HELP
             * ==============================
             */

            if (
                interaction.customId ===
                'minecraft_help'
            ) {

                if (
                    !isAdministrator(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Nur Server-Administratoren können die Hilfe öffnen.',

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                return interaction.reply({

                    components: [

                        createHelpPanel()

                    ],

                    flags:
                        MessageFlags.IsComponentsV2 |
                        MessageFlags.Ephemeral

                });

            }

        }


        /*
         * ==============================
         * MODAL SUBMITS
         * ==============================
         */

        if (
            interaction.isModalSubmit()
        ) {


            /*
             * ==============================
             * MINECRAFT COMMAND MODAL
             * ==============================
             */

            if (
                interaction.customId ===
                'minecraft_command_modal'
            ) {

                if (
                    !isAdministrator(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Nur Server-Administratoren können Minecraft-Commands ausführen.',

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                try {

                    await executeCommand(
                        interaction
                    );

                } catch (error) {

                    console.error(
                        '[MINECRAFT COMMAND ERROR]',
                        error
                    );


                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {

                        await interaction.reply({

                            content:
                                `❌ Minecraft-Command konnte nicht ausgeführt werden.\n\nFehler: ${error.message}`,

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                }


                return;

            }


            /*
             * ==============================
             * FEEDBACK MODAL
             * ==============================
             */

            if (
                !interaction.customId.startsWith(
                    'feedback_modal_'
                )
            ) {

                /*
                 * Clan-Modals wurden bereits oben
                 * von handleClanInteraction()
                 * verarbeitet.
                 *
                 * Falls ein unbekanntes Modal kommt,
                 * ignorieren wir es.
                 */

                return;

            }


            const parts =
                interaction.customId.split(
                    '_'
                );


            /*
             * feedback
             * modal
             * stars
             * ticketId
             */

            const stars =
                Number(
                    parts[2]
                );


            const ticketId =
                parts
                    .slice(3)
                    .join('_');


            if (
                stars < 1 ||
                stars > 5 ||
                !ticketId
            ) {

                return interaction.reply({

                    content:
                        '❌ Ungültiges Feedback.',

                    flags:
                        MessageFlags.Ephemeral

                });

            }


            const comment =
                interaction.fields.getTextInputValue(
                    'feedback_comment'
                );


            try {

                await submitFeedback(

                    interaction,

                    stars,

                    ticketId,

                    comment

                );

            } catch (error) {

                console.error(
                    '[FEEDBACK SUBMIT ERROR]',
                    error
                );


                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {

                    await interaction.reply({

                        content:
                            '❌ Dein Feedback konnte leider nicht gespeichert werden.',

                        flags:
                            MessageFlags.Ephemeral

                    });

                }

            }


            return;

        }

    }

};