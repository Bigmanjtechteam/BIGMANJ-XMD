const { setAntiBot, getAntiBot, removeAntiBot } = require('../lib/index');
const fs = require('fs');
const path = require('path');

async function handleAntiBotCommand(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*ANTIBOT SETUP*\n\n*.antibot on*\nTurn on antibot (auto-detects and deletes bot messages)\n\n*.antibot off*\nDisables antibot in this group`
        }, { quoted: message });
    }

    if (match === 'on') {
        const existingConfig = await getAntiBot(chatId, 'on');
        if (existingConfig?.enabled) {
            return sock.sendMessage(chatId, { text: '*AntiBot is already enabled for this group*' });
        }
        await setAntiBot(chatId, 'on', 'delete');
        return sock.sendMessage(chatId, { text: '*AntiBot has been enabled. Bot messages will be automatically detected and deleted.*' }, { quoted: message });
    }

    if (match === 'off') {
        const config = await getAntiBot(chatId, 'on');
        if (!config?.enabled) {
            return sock.sendMessage(chatId, { text: '*AntiBot is already disabled for this group*' }, { quoted: message } );
        }
        await removeAntiBot(chatId);
        return sock.sendMessage(chatId, { text: '*AntiBot has been disabled for this group*' }, { quoted: message } );
    }

    return sock.sendMessage(chatId, { text: '*Invalid command. Use .antibot to see usage*' }, { quoted: message } );
}

async function handleBotDetection(sock, chatId, message, userMessage, senderId) {
    // Skip if not group
    if (!chatId.endsWith('@g.us')) return;

    // Skip if message is from bot
    if (message.key.fromMe) return;

    // Get antibot config first
    const antiBotConfig = await getAntiBot(chatId, 'on');
    if (!antiBotConfig?.enabled) {
        return;
    }

    // Bot prefixes to detect other bots (commands starting with these)
    const botPrefixes = ['/', '!', '#', '$', '%', '^', '&', '*', '+', '=', '[', ']', '{', '}', '|', ':', ';', '<', '>', '?', '~', '`'];

    // Check if message starts with any bot prefix
    const startsWithPrefix = botPrefixes.some(prefix => userMessage.startsWith(prefix));

    if (startsWithPrefix) {
        try {
            // Delete the message immediately without delay
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: message.key.id,
                    participant: senderId
                }
            });
            console.log(`Auto-deleted bot command from ${senderId} in ${chatId}`);
        } catch (error) {
            console.error('Error deleting bot message:', error);
        }
    }
}

module.exports = {
    handleAntiBotCommand,
    handleBotDetection
};