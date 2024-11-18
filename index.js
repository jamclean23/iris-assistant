// Iris discord bot

// ====== IMPORTS/INIT ======

// Environment Variables
require('dotenv').config();

// Discord client
const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates
    ]
});

// Controllers
const eventsController = require('./eventsController.js');

// ====== FUNCTIONS ======

function main (client) {
    client.once(Discord.Events.ClientReady, () => {
        eventsController.readyHandler(client);
    });

    client.on(Discord.Events.MessageCreate, (msg) => {
        eventsController.messageHandler(client, msg);
    })

    client.on(Discord.Events.VoiceStateUpdate, (oldState, newState) => {
        eventsController.newVCHandler(client, oldState, newState);
    });

    client.login(process.env.CLIENT_TOKEN);


    // This function prevents Sushi from changing his nickname
    // client.on('guildMemberUpdate', async (oldMember, newMember) => {

    //     const TARGET_MEMBER_ID = '164509841828610048'; // The actual member's ID
    //     const SUSHI_NICKNAME = 'Gas Station Sushi'; // The desired nickname

    //     if (newMember.id === TARGET_MEMBER_ID) {
    //         if (oldMember.nickname !== newMember.nickname) {
    //             try {
    //                 await newMember.setNickname(SUSHI_NICKNAME);
    //                 console.log(`Reverted nickname change for ${newMember.user.tag}`);
    //             } catch (error) {
    //                 console.error(`Failed to revert nickname for ${newMember.user.tag}:`, error);
    //             }
    //         }
    //     }
    // });
}


// ===== MAIN ======

main(client);