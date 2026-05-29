const lyricsFinder = require('lyrics-finder');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: '🔍 *Tafadhali andika jina la wimbo*\nMfano: .lyric Mwamba Mbosso'
        }, { quoted: message });
        return;
    }

    // Onyesha kuwa inatafuta
    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } }).catch(() => {});
    await sock.sendPresenceUpdate('composing', chatId).catch(() => {});

    try {
        // Tafuta nyimbo - inaweza kuchukua jina la wimbo pekee
        let lyrics = await lyricsFinder(songTitle);
        
        // Ikiwa haipatikani, jaribu kugawa kwa msanii na wimbo (hiari)
        if (!lyrics) {
            // Jaribu kugawa kwa sehemu mbili (msanii na wimbo)
            const parts = songTitle.split(' ');
            if (parts.length >= 2) {
                const artist = parts.slice(0, -1).join(' ');
                const title = parts[parts.length - 1];
                lyrics = await lyricsFinder(artist, title);
            }
        }

        if (!lyrics) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
            await sock.sendMessage(chatId, {
                text: `❌ *Nyimbo "${songTitle}" haikupatikana.*\n💡 Jaribu kuandika jina kamili la wimbo na msanii, mfano:\n.lyric Mwamba Mbosso\n.lyric Eminem Rap God\n.lyric Dior Pop Smoke`
            }, { quoted: message });
            return;
        }

        // Kata ikiwa nyimbo ni ndefu (WhatsApp inaruhusu ~4096 herufi)
        const MAX_LENGTH = 4000;
        if (lyrics.length > MAX_LENGTH) {
            lyrics = lyrics.slice(0, MAX_LENGTH - 50) + '\n\n... (nyimbo imekatwa kwa sababu ni ndefu sana)';
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, { text: lyrics }, { quoted: message });

    } catch (error) {
        console.error('❌ Hitilafu ya kutafuta nyimbo:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, {
            text: '❌ *Imeshindwa kutafuta nyimbo.* Jaribu tena baadaye. (API inaweza kuwa na shida)'
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };