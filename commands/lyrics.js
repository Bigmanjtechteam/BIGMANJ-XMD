const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: '🔍 *Tafadhali andika jina la wimbo*\nMfano: .lyric Mwamba Mbosso'
        }, { quoted: message });
        return;
    }

    // Show "typing" indicator
    await sock.sendPresenceUpdate('composing', chatId).catch(() => {});

    try {
        let lyrics = null;
        let errorMsg = '';

        // ----- API 1: Azrael Lyrics (Genius-based) -----
        try {
            const url = `https://azrael-lyrics.vercel.app/?q=${encodeURIComponent(songTitle)}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data && data.lyrics && data.lyrics !== 'Lyrics not found') {
                    lyrics = data.lyrics;
                }
            }
        } catch (e) { errorMsg += `\nAPI1 fail: ${e.message}`; }

        // ----- API 2: Lyrics.ovh (requires artist - title split) -----
        if (!lyrics) {
            try {
                const words = songTitle.split(' ');
                let artist = words[0];
                let title = words.slice(1).join(' ');
                if (!title) title = artist;
                const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.lyrics) lyrics = data.lyrics;
                }
            } catch (e) { errorMsg += `\nAPI2 fail: ${e.message}`; }
        }

        // ----- API 3: Your original EliteProtech API -----
        if (!lyrics) {
            try {
                const url = `https://eliteprotech-apis.zone.id/lyrics?query=${encodeURIComponent(songTitle)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result && data.result.lyrics) {
                        lyrics = data.result.lyrics;
                    }
                }
            } catch (e) { errorMsg += `\nAPI3 fail: ${e.message}`; }
        }

        // If still no lyrics, send failure message
        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `❌ *Lyrics not found* for "${songTitle}".\n\n💡 Jaribu kuandika jina kamili, mfano:\n.lyric Mwamba Mbosso\n\n📌 Ikiwa tatizo linaendelea, API inaweza kuwa imeisha muda.`
            }, { quoted: message });
            return;
        }

        // Clean up the lyrics text
        lyrics = lyrics.replace(/\r/g, '').trim();

        // WhatsApp limit is ~4096 characters – split if too long
        const maxLen = 4000;
        if (lyrics.length > maxLen) {
            const chunks = [];
            for (let i = 0; i < lyrics.length; i += maxLen) {
                chunks.push(lyrics.slice(i, i + maxLen));
            }
            for (const chunk of chunks) {
                await sock.sendMessage(chatId, { text: chunk }, { quoted: message });
                await new Promise(r => setTimeout(r, 500));
            }
        } else {
            await sock.sendMessage(chatId, { text: lyrics }, { quoted: message });
        }

    } catch (error) {
        console.error('Lyrics command error:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Hitilafu*: Imeshindwa kutafuta nyimbo. Jaribu tena baadaye.\nError: ${error.message.slice(0, 100)}`
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };