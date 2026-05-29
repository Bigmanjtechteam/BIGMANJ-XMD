const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: '🔍 *Tafadhali andika jina la wimbo*\nMfano: .lyric Mwamba Mbosso'
        }, { quoted: message });
        return;
    }

    // Reaction 🔍
    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } }).catch(() => {});
    await sock.sendPresenceUpdate('composing', chatId).catch(() => {});

    try {
        // PopCat API (free, no API key)
        const apiUrl = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(songTitle)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data || data.error || !data.lyrics) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
            await sock.sendMessage(chatId, {
                text: `❌ *Nyimbo "${songTitle}" haikupatikana.*\n💡 Jaribu kuandika jina kamili la wimbo na msanii, mfano:\n.lyric Mwamba Mbosso\n.lyric Eminem Rap God`
            }, { quoted: message });
            return;
        }

        const title = data.title || songTitle;
        const artist = data.artist || 'Msanii asiyejulikana';
        let lyrics = data.lyrics;

        const MAX_LENGTH = 4000;
        if (lyrics.length > MAX_LENGTH) {
            lyrics = lyrics.slice(0, MAX_LENGTH - 50) + '\n\n... (nyimbo imekatwa)';
        }

        const result = `🎵 *${title}* - ${artist}\n\n${lyrics}`;
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (error) {
        console.error('❌ Hitilafu:', error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, {
            text: '❌ *Imeshindwa kutafuta nyimbo.* Jaribu tena baadaye.'
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };