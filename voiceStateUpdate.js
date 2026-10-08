const {
    Events
} = require('discord.js');

const {
    handleVoiceJoin,
    handleVoiceLeave
} = require(
    '../components/support/supportManager'
);

module.exports = {
    name:
        Events.VoiceStateUpdate,

    async execute(
        oldState,
        newState
    ) {

        try {

            await handleVoiceJoin(
                oldState,
                newState
            );

            await handleVoiceLeave(
                oldState,
                newState
            );

        } catch (error) {

            console.error(
                '[SUPPORT VOICE EVENT ERROR]',
                error
            );
        }
    }
};