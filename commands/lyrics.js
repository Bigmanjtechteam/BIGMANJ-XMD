const axios = require('axios');
const yts = require('yt-search');
const FOOTER = '\n\n> bigmanj tech™'; // ✅ Footer iliyobadilishwa

async function lyricCommand(sock, chatId, message, args) {
    try {
        const query = args.join(' ').trim();
        if (!query) {
            await sock.sendMessage(chatId, {
                text: `🎤 *Lyrics Finder*\n\nTumia: .lyric <jina la wimbo> au .lyric <msanii> - <wimbo>\nMfano: .lyric Mwamba Mbosso\nMfano: .lyric Eminem - Rap God${FOOTER}`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } }).catch(() => {});

        let artist = '';
        let title = query;
        let duration = 0;

        // Ikiwa mtumiaji ametumia muundo wa "Artist - Title"
        if (query.includes(' - ')) {
            const parts = query.split(' - ');
            artist = parts[0].trim();
            title = parts[1].trim();
        } else {
            // Jaribu kutafuta YouTube ili kupata muda na kugawanya kwa akili
            try {
                const searchResults = await yts(query);
                if (searchResults?.videos?.length > 0) {
                    const firstVideo = searchResults.videos[0];
                    title = firstVideo.title;
                    duration = firstVideo.duration.seconds || 0;
                    if (title.includes(' - ')) {
                        const titleParts = title.split(' - ');
                        artist = titleParts[0];
                        title = titleParts[1];
                    }
                }
            } catch (e) {
                console.log('YouTube search failed, continuing without duration');
            }
        }

        // Tafuta nyimbo kwa kutumia LRCLIB
        let apiUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}&duration=${duration}`;
        if (!artist) {
            apiUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&duration=${duration}`;
        }

        let response = await axios.get(apiUrl, { timeout: 10000 });
        let data = response.data;

        // Ikiwa hakuna matokeo, jaribu kutumia PopCat API
        if (!data || !data.plainLyrics) {
            const popcatUrl = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(query)}`;
            const popcatRes = await axios.get(popcatUrl, { timeout: 10000 });
            if (popcatRes.data && popcatRes.data.lyrics) {
                data = { plainLyrics: popcatRes.data.lyrics, title: popcatRes.data.title, artist: popcatRes.data.artist };
            }
        }

        if (!data || !data.plainLyrics) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
            await sock.sendMessage(chatId, {
                text: `❌ Nyimbo "${query}" haikupatikana.\n💡 Jaribu kuandika jina kamili la wimbo na msanii.\nMfano: .lyric Mwamba Mbosso\nMfano: .lyric Eminem - Rap God${FOOTER}`
            }, { quoted: message });
            return;
        }

        let finalLyrics = data.plainLyrics;
        const songTitle = data.title || title;
        const songArtist = data.artist || artist || 'Msanii asiyejulikana';

        if (finalLyrics.length > 4000) {
            finalLyrics = finalLyrics.slice(0, 3950) + '\n\n... (imekatwa kwa sababu ndefu)';
        }

        const result = `🎵 *${songTitle}* - ${songArtist}\n\n${finalLyrics}${FOOTER}`;
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (err) {
        console.error('Lyrics error:', err);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, {
            text: `❌ Imeshindwa kutafuta nyimbo. Hakikisha una muunganisho wa mtandao.\n${FOOTER}`
        }, { quoted: message });
    }
}

module.exports = lyricCommand;