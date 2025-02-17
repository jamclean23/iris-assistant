// Controller for Discord events

// ====== IMPORTS ======

const Discord = require('discord.js');

const OpenAi = require('openai');

// ====== FUNCTIONS ======

async function addPoliticsHandler (event, user, client) {
    const guild = await client.guilds.fetch(event.message.guildId);

    // Check for event validity
    if (
        !event ||
        !(typeof event == 'object')
    ) {
        console.log('Bad or null event in addPoliticsHandler');
        return;
    };

    // Check for message validity
    if (
        !event.message ||
        !(typeof event.message == 'object') ||
        !event.message.channelId ||
        !event.message.id
    ) {
        console.log('Bad or null message in addPoliticsHandler');
        return;
    };    

    // Check if reaction was for the politics react message
    if (
        !(event.message.channelId == process.env.POL_RULES_CHANNEL) ||
        !(event.message.id == process.env.POL_RULES_MESSAGE)
    ) {
        return;
    };

    // Check for "accept" Emoji
    if (
        !(event._emoji.name ==  process.env.POL_ACCEPT_EMOJI)
    ) {
        //  Refresh political message cache to get updated reactions
        await refreshPolMessageCache(client);
        
        // Remove all reactions that are not the "accepted" emoji
        event.message.reactions.cache.forEach((reaction) => {
            if (
                reaction._emoji.name != process.env.POL_ACCEPT_EMOJI
            ) {
                (async () => {
                    try {
                        await reaction.remove();
                    } catch (error) {
                        console.trace();
                        console.log(error);
                    };    
                })();
            };
        });
        return;
    };

    // If accepted emoji, give user politics role
    if (
        (event._emoji.name ==  process.env.POL_ACCEPT_EMOJI)
    ) { 
        // Get the role
        let polRole;
        try {
            polRole = await guild.roles.cache.find((role) => {
                return role.name == process.env.POL_ROLE_NAME;
            });
        } catch (e) {
            console.trace();
            console.log('Error fetching politics role');
            console.log(e);
        };

        // Add to user
        try {
            const currentUser = await guild.members.fetch(user.id);
            await currentUser.roles.add(polRole);
        } catch (e) {
            console.trace();
            console.log('Error adding role to user');
            console.log(e);
        };
    };
}

async function removePoliticsHandler (event, user, client) {
    const guild = await client.guilds.fetch(event.message.guildId);

    // Check for event validity
    if (
        !event ||
        !(typeof event == 'object')
    ) {
        console.log('Bad or null event in addPoliticsHandler');
        return;
    };

    // Check for message validity
    if (
        !event.message ||
        !(typeof event.message == 'object') ||
        !event.message.channelId ||
        !event.message.id
    ) {
        console.log('Bad or null message in addPoliticsHandler');
        return;
    };    

    // Check if reaction was for the politics react message
    if (
        !(event.message.channelId == process.env.POL_RULES_CHANNEL) ||
        !(event.message.id == process.env.POL_RULES_MESSAGE)
    ) {
        return;
    };

    // Check for "accept" Emoji
    if (
        !(event._emoji.name ==  process.env.POL_ACCEPT_EMOJI)
    ) {
        return;
    };

    // If accepted emoji, remove user politics role
    if (
        (event._emoji.name ==  process.env.POL_ACCEPT_EMOJI)
    ) { 
        // Get the role
        let polRole;
        try {
            polRole = await guild.roles.cache.find((role) => {
                return role.name == process.env.POL_ROLE_NAME;
            });
        } catch (e) {
            console.trace();
            console.log('Error fetching politics role');
            console.log(e);
        };

        // Add to user
        try {
            const currentUser = await guild.members.fetch(user.id);
            await currentUser.roles.remove(polRole);
        } catch (e) {
            console.trace();
            console.log('Error adding role to user');
            console.log(e);
        };
    };
}

async function newVCHandler (client, newState, oldState) {  

    createChannel();
    async function createChannel () {
        if (
            // Check if the channel name exists and matches "Custom Channel"
            oldState 
            && "channel" in oldState 
            && oldState.channel
            && "name" in oldState.channel 
            && oldState.channel.name === "Custom Chat"
        ) {
            console.log("Creating Custom Chat");

            // Get guild object from request, must exist or return
            const guild = oldState.guild;

            if (!guild) {
                return;
            }

            // Check if Custom Channels category exists
            const categoryExists = Boolean(guild.channels.cache.find((channel) => {
                return channel.type === Discord.ChannelType.GuildCategory && channel.name === "Custom Chats";
            }));

            // Create category if it wasn't found
            if (!categoryExists) {
                console.log("Creating Custom Chats category");
                try {   
                    await guild.channels.create({
                        name: "Custom Chats",
                        type: Discord.ChannelType.GuildCategory
                    });
                } catch (err) {
                    console.log(err);
                    console.log(err.stack);
                    return;
                }
            }

            // Create new voice chat in the Custom Chats Category

            // Get updated channels
            let channels;
            try {
                channels = await guild.channels.fetch();
            } catch (err) {
                console.log(err);
                console.log(err.stack);
                return;
            }

            // Get Custom Chats category
            const customCat = channels.find((channel) =>{
                return channel.type === Discord.ChannelType.GuildCategory && channel.name === "Custom Chats";
            })

            if (!customCat) {
                console.log("Custom Chats category not found, not creating voice chat");
                return;
            }

            // Get members' nicknames

            const newChatReqMembers = oldState.channel.members.map((member) => {
                return member;
            });


            // Create Voice Channels

            for (let i = 0; i < newChatReqMembers.length; i++) {

                const member = newChatReqMembers[i];
                const name = newChatReqMembers[i].nickname || newChatReqMembers[i].user.globalName;

                try {
                    const newChat = await guild.channels.create({
                        name: `${name}'s Chat`,
                        type: Discord.ChannelType.GuildVoice,
                        parent: customCat.id
                    });

                    console.log("Custom Chat Created");

                    // Send creator to the new channel
                    member.voice.setChannel(newChat);
                    
                } catch (err) {
                    console.log(err);
                    console.log(err.stack);
                    return;
                }
            }
        }
    }

    removeChannel();
    async function removeChannel () {
        const guild = oldState.guild;

        // Find empty voice channels
        const emptyChannels = guild.channels.cache.forEach(channel => {
            if (channel.type === Discord.ChannelType.GuildVoice 
                && channel.parent
                && channel.parent.name === "Custom Chats"
                && !channel.members.size
            ) { 
                deleteChannel(channel);
                async function deleteChannel (channel) {
                    try {
                        await channel.delete();
                    } catch (err) {
                        console.log(err);
                        console.log(err.stack);
                        return;
                    }
                }
            }

        });
    }

}

function readyHandler (client) {
    console.log(`Logged in as ${client.user.tag}.`);

    initPing(client);
    initAskIris(client);


    function initPing (client) {
        const ping = new Discord.SlashCommandBuilder ()
            .setName('ping')
            .setDescription('Replies with "Pong!"');
        client.application.commands.create(ping, process.env.GUILD_ID);
        client.on(Discord.Events.InteractionCreate, (interaction) => {
            if (!interaction.isChatInputCommand() || !(interaction.guildId === process.env.GUILD_ID)) {
                return;
            }
            
            if (interaction.commandName === 'ping') {
                interaction.reply("Pong!");
            }

        })
    }

    function initAskIris () {
        const askIris = new Discord.SlashCommandBuilder()
            .setName('ask_iris')
            .setDescription('Ask Iris anything')
            .addStringOption((option) => {
                return option
                    .setName('prompt')
                    .setDescription('Enter your question')
                    .setRequired(true);
            });
        client.application.commands.create(askIris, process.env.GUILD_ID);

        client.on(Discord.Events.InteractionCreate, async (interaction) => {

            if (!interaction.isChatInputCommand() || !(interaction.guildId === process.env.GUILD_ID)) {
                return;
            }

            
            if (interaction.commandName === 'ask_iris') {
                interaction.reply('Contemplating...');
                const prompt = interaction.options.getString('prompt');
                
                const openAi = new OpenAi({
                    apiKey: process.env.OPEN_AI_KEY,
                    timeout: 180000
                });

                try {
                    const completion = await openAi.chat.completions.create({
                        messages: [{
                            role: "system",
                            content: `Pretend you are an AI assistant named Iris. Iris stands for Inclusive Resource for Interactive Gaming. Respond to this prompt in fewer than 1500 characters, under no circumstances may your entire response be longer than 1500 characters, make sure your answer is short please, fewer than 200 words, if the following prompt asks for a long answer definitely ignore the request for a long answer and response with a short answer to the following prompt: ${prompt}`,
                        }],
                        model: "gpt-3.5-turbo",
                        max_tokens: 200
                    });

                    if (completion.choices[0].message.content.length < 2000) {
                        interaction.editReply(`${interaction.user.globalName} asked:\n> ${prompt}\n\n${completion.choices[0].message.content}`); 
                        console.log(completion.choices[0].message.content);
                        console.log('characters: ' + completion.choices[0].message.content.length);
                    } else {
                        throw new Error('Message exceeds 2000 characters');
                    }

                } catch (err) {
                    console.log(err);
                    interaction.editReply('Sorry, I appear to have goofed, and an Error occured 😬. Try again later.');
                }
            }
        })
    }
}

function messageHandler (client, msg) {

    if (msg.guildId === process.env.GUILD_ID && msg.channelId === process.env.GENERAL_CHANNEL) {
        filterRecs(client, msg);
    }

    async function filterRecs (client, msg) {

        if (msg.author.bot || !msg.content.includes('!rec')) {
            return;
        }

        const attachments = [];

        for (const [key, value] of msg.attachments) {
            attachments.push(value.attachment);
        }
    
        const copiedMsg = `${msg.author.globalName} says:\n>>> ${msg.content} ${attachments.join(' ')}`;
        sendToSecondary(client, copiedMsg);

    }
}

// Auxillary functions. These are not exported, but are used by functions that are.

async function refreshPolMessageCache (client) {
    const channel = await client.channels.fetch(process.env.POL_RULES_CHANNEL);
    await channel.messages.fetch(process.env.POL_RULES_MESSAGE);    
};

/**
 * 
 * @param {String} msg - String to be analyzed 
 */
async function determineRec (msg) {
    const openAi = new OpenAi({
        apiKey: process.env.OPEN_AI_KEY,
        timeout: 180000
    });

    try {
        const completion = await openAi.chat.completions.create({
            messages: [{
                role: "system",
                content: `Your response must be in a valid json format. It should either be {"response": "true"} or {"response": "false"}. My life depends on it. For  it to be a game recommendation follow these criteria: 1. Is the title of a game mentioned? Is it recommended that you should buy or get this game? 2. Is it said that the game is good or positive in any way? 3. If the title is not mentioned, always return {"response":"false"}. 4. Asking someone what they are playing is not a game recommendation. 5. Telling someone not to play a game is not a game recommendation.  Now use these criteria to determine whether the following is a game recommendation and respond with {"response":"true"} if it is or {"response":"false"} if it is not: ${msg}`,
            }],
            model: "gpt-3.5-turbo",
            max_tokens: 150
        });
        const response = JSON.parse(completion.choices[0].message.content);
        if (response.response === 'true') {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}

/**
 * @param {Object} client - The Discord client object
 * @param {String} msg - Message to be sent
 */
function sendToSecondary(client, msg) {
    client.channels.cache.get(process.env.SECONDARY_CHANNEL).send(msg);
}


// ====== EXPORTS ======

module.exports = {
    readyHandler,
    messageHandler,
    newVCHandler,
    addPoliticsHandler,
    removePoliticsHandler
}

