const axios = require('axios');
const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

/**
 * Fetch lyrics using Popcat.xyz API
 * @param {string} songTitle - Song name or artist + title
 * @returns {Promise<object>}
 */
async function fetchLyrics(songTitle) {
    const url = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(songTitle)}`;
    const response = await axios.get(url, { timeout: 15000 });
    if (!response.data || response.data.error) {
        throw new Error('Lyrics not found');
    }
    return response.data;
}

/**
 * Format duration from seconds to MM:SS
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const lyricsCommand = async (sock, chatId, message, args) => {
    try {
        // Extract song title from arguments
        let songTitle = args || '';
        if (!songTitle) {
            // If no args, try to get from quoted message or caption?
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted && (quoted.conversation || quoted.extendedTextMessage?.text)) {
                songTitle = (quoted.conversation || quoted.extendedTextMessage?.text || '').trim();
            }
            if (!songTitle) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Usage:* .lyrics <song title>\nExample: .lyrics Hello Adele'
                }, { quoted: message });
                return;
            }
        }

        // React with ⏳
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // Fetch lyrics
        const data = await fetchLyrics(songTitle);

        const senderId = message.key.participant || message.key.remoteJid;
        const mention = getMentionNumber(senderId);
        const greeting = getGreeting();

        // Format the caption
        let caption = `✨ ${greeting} @${mention}\n\n`;
        caption += `🎵 *LYRICS*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `*Title:* ${data.title}\n`;
        caption += `*Artist:* ${data.artist}\n`;
        if (data.album) caption += `*Album:* ${data.album}\n`;
        caption += `*Duration:* ${formatDuration(data.duration)}\n\n`;
        caption += `*Lyrics:*\n${data.lyrics}\n\n`;
        caption += `🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

        // If lyrics are too long, split into multiple messages (optional)
        if (caption.length > 60000) {
            await sock.sendMessage(chatId, { text: '❌ Lyrics too long to send.' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        // Send the result
        await sock.sendMessage(chatId, {
            text: caption,
            mentions: [senderId]
        }, { quoted: message });

        // React with ✅
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Lyrics command error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        let errorMsg = '❌ *Lyrics not found.*\nTry a different song title or check spelling.';
        if (error.message.includes('timeout')) errorMsg = '⏰ Request timeout. Try again.';
        if (error.message.includes('network')) errorMsg = '🌐 Network error. Try later.';
        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
    }
};

module.exports = {
    name: 'lyrics',
    aliases: ['lyric', 'lirik'],
    category: 'fun',
    execute: lyricsCommand
};