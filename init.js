require('dotenv').config();

async function init (client) {
    // client.channels.fetch(process.env.POL_RULES_CHANNEL).fetch(process.env.POL_RULES_MESSAGE);

    const channel = await client.channels.fetch(process.env.POL_RULES_CHANNEL);
    await channel.messages.fetch(process.env.POL_RULES_MESSAGE);
};

module.exports = init;