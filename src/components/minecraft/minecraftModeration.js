const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const {
    executeMinecraftCommand,
    isMinecraftEnabled
} = require('./minecraftBridge');


/*
 * ==========================================
 * ERLAUBTE MINECRAFT COMMANDS
 * ==========================================
 */

const ALLOWED_COMMANDS = {

    ban: {

        usage:
            'ban USER GRUND DAUER',

        description:
            'Bannt einen Minecraft-Spieler.',

        build: (
            user,
            reason,
            duration
        ) => {

            return `ban ${user} ${reason} ${duration}`;

        }

    },


    kick: {

        usage:
            'kick USER GRUND',

        description:
            'Kickt einen Minecraft-Spieler.',

        build: (
            user,
            reason
        ) => {

            return `kick ${user} ${reason}`;

        }

    }

};


/*
 * ==========================================
 * ADMIN CHECK
 * ==========================================
 */

function isAdministrator(
    member
) {

    return Boolean(

        member &&
        member.permissions.has(
            'Administrator'
        )

    );

}


/*
 * ==========================================
 * COMMAND PARSER
 * ==========================================
 */

function parseCommand(
    input
) {

    const trimmed =
        String(
            input || ''
        ).trim();


    if (!trimmed) {

        return {

            success: false,

            error:
                'Du musst einen Command eingeben.'

        };

    }


    const parts =
        trimmed.split(
            /\s+/
        );


    const commandName =
        parts
            .shift()
            .toLowerCase();


    if (
        !ALLOWED_COMMANDS[
            commandName
        ]
    ) {

        return {

            success: false,

            error:
                `Der Minecraft-Command \`${commandName}\` ist nicht erlaubt.`

        };

    }


    const command =
        ALLOWED_COMMANDS[
            commandName
        ];


    /*
     * BAN
     *
     * ban USER GRUND DAUER
     */

    if (
        commandName === 'ban'
    ) {

        if (
            parts.length < 3
        ) {

            return {

                success: false,

                error:
                    `Syntax: \`${command.usage}\``

            };

        }


        const user =
            parts.shift();


        const duration =
            parts.pop();


        const reason =
            parts.join(
                ' '
            );


        if (!user) {

            return {

                success: false,

                error:
                    'Kein Spieler angegeben.'

            };

        }


        if (!reason) {

            return {

                success: false,

                error:
                    'Kein Grund angegeben.'

            };

        }


        if (!duration) {

            return {

                success: false,

                error:
                    'Keine Dauer angegeben.'

            };

        }


        return {

            success: true,

            command:
                command.build(

                    user,

                    reason,

                    duration

                ),

            name:
                commandName,

            user,

            reason,

            duration

        };

    }


    /*
     * KICK
     *
     * kick USER GRUND
     */

    if (
        commandName === 'kick'
    ) {

        if (
            parts.length < 2
        ) {

            return {

                success: false,

                error:
                    `Syntax: \`${command.usage}\``

            };

        }


        const user =
            parts.shift();


        const reason =
            parts.join(
                ' '
            );


        if (!user) {

            return {

                success: false,

                error:
                    'Kein Spieler angegeben.'

            };

        }


        if (!reason) {

            return {

                success: false,

                error:
                    'Kein Grund angegeben.'

            };

        }


        return {

            success: true,

            command:
                command.build(

                    user,

                    reason

                ),

            name:
                commandName,

            user,

            reason

        };

    }


    return {

        success: false,

        error:
            'Unbekannter Command.'

    };

}


/*
 * ==========================================
 * MODERATION PANEL
 * ==========================================
 */

function createModerationPanel() {

    return new ContainerBuilder()

        .setAccentColor(
            0xE67E22
        )

        .addTextDisplayComponents(

            new TextDisplayBuilder()

                .setContent(

                    [

                        '# 🛡️ ApfelSMP Minecraft-Team',

                        '',

                        'Hier kannst du erlaubte Minecraft-Moderationsbefehle ausführen.',

                        '',

                        '⚠️ Die Commandbox akzeptiert ausschließlich freigegebene Minecraft-Commands.',

                        '',

                        `🟢 Minecraft Bridge: ${
                            isMinecraftEnabled()
                                ? 'Aktiv'
                                : 'Vorbereitet / Deaktiviert'
                        }`

                    ].join('\n')

                )

        )

        .addSeparatorComponents(

            new SeparatorBuilder()

                .setSpacing(
                    SeparatorSpacingSize.Small
                )

                .setDivider(
                    true
                )

        )

        .addActionRowComponents(

            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'minecraft_commandbox'
                        )

                        .setLabel(
                            'Commandbox'
                        )

                        .setEmoji(
                            '💻'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'minecraft_help'
                        )

                        .setLabel(
                            'Help'
                        )

                        .setEmoji(
                            '❓'
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        )

                )

        );

}


/*
 * ==========================================
 * COMMAND MODAL
 * ==========================================
 */

function createCommandModal() {

    const input =
        new TextInputBuilder()

            .setCustomId(
                'minecraft_command'
            )

            .setLabel(
                'Minecraft Command'
            )

            .setPlaceholder(
                'ban Spieler123 Cheating 7d'
            )

            .setStyle(
                TextInputStyle.Short
            )

            .setRequired(
                true
            )

            .setMaxLength(
                300
            );


    return new ModalBuilder()

        .setCustomId(
            'minecraft_command_modal'
        )

        .setTitle(
            'Minecraft Commandbox'
        )

        .addComponents(

            new ActionRowBuilder()
                .addComponents(
                    input
                )

        );

}


/*
 * ==========================================
 * HELP
 * ==========================================
 */

function createHelpPanel() {

    const lines = [

        '# ❓ Minecraft Command Help',

        '',

        'Die Commandbox unterstützt aktuell:',

        '',

        '### 🔨 Ban',

        '`ban USER GRUND DAUER`',

        'Beispiel:',

        '`ban Lukas Cheating 7d`',

        '',

        '### 👢 Kick',

        '`kick USER GRUND`',

        'Beispiel:',

        '`kick Lukas Spam`',

        '',

        'Weitere Moderationsbefehle wie `/warn`, `/timeout`, `/ban` usw. werden separat als Discord-Slash-Commands umgesetzt.'

    ];


    return new ContainerBuilder()

        .setAccentColor(
            0x3498DB
        )

        .addTextDisplayComponents(

            new TextDisplayBuilder()

                .setContent(
                    lines.join('\n')
                )

        );

}


/*
 * ==========================================
 * COMMAND AUSFÜHREN
 * ==========================================
 */

async function executeCommand(
    interaction
) {

    const input =
        interaction.fields.getTextInputValue(
            'minecraft_command'
        );


    const parsed =
        parseCommand(
            input
        );


    if (
        !parsed.success
    ) {

        return interaction.reply({

            content:
                `❌ ${parsed.error}`,

            flags:
                MessageFlags.Ephemeral

        });

    }


    /*
     * Noch nicht mit Minecraft verbunden.
     */

    if (
        !isMinecraftEnabled()
    ) {

        return interaction.reply({

            content:
                '⚠️ Die Minecraft-Bridge ist momentan deaktiviert. Der Command wurde aus Sicherheitsgründen nicht ausgeführt.',

            flags:
                MessageFlags.Ephemeral

        });

    }


    await interaction.deferReply({

        flags:
            MessageFlags.Ephemeral

    });


    try {

        const result =
            await executeMinecraftCommand(
                parsed.command
            );


        await interaction.editReply({

            content:
                `✅ Minecraft-Command erfolgreich gesendet.\n\n\`${parsed.command}\``

        });


        return {

            success: true,

            parsed,

            result

        };

    } catch (error) {

        await interaction.editReply({

            content:
                `❌ Minecraft-Command konnte nicht ausgeführt werden.\n\n\`${error.message}\``

        });


        return {

            success: false,

            parsed,

            error:
                error.message

        };

    }

}


/*
 * ==========================================
 * EXPORT
 * ==========================================
 */

module.exports = {

    isAdministrator,

    createModerationPanel,

    createCommandModal,

    createHelpPanel,

    executeCommand,

    parseCommand

};