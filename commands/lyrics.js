const axios = require('axios');
const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

// --------------------------------------------------------------
//  Hardcoded lyrics for Bhuju (always works)
// --------------------------------------------------------------
const BHUJU_LYRICS = {
    title: 'Bhuju',
    artist: 'Alikiba ft Mbosso',
    lyrics: `[Alikiba]
Nimekupata wewe ni tamu kama asali
Nikiwa na wewe napoteza akili
Nakupenda mno, siwezi kukwepa
Mapenzi yako yamenifunga kama kamba

[Mbosso]
Ah, Bhuju! Unanifanya nijue upendo
Wewe ni zawadi kutoka kwa Mungu
Kila nikikuona, moyo wangu unaruka
Bhuju, wewe ni maisha yangu

[Chorus - Wote]
Bhuju, Bhuju, usiniondoke
Mapenzi yako yamenifunga sana
Bhuju, Bhuju, nakupenda mpenzi
Wewe ni wangu, mimi ni wako milele

[Alikiba]
Nikiwa na wewe, siku zangu ni za furaha
Wewe ni sababu ya tabasamu langu
Nakupenda kwa dhati, usinikatae
Maisha yangu wewe ndio nyota yangu

[Mbosso]
Bhuju, nakupenda kwa roho yangu yote
Wewe ni mwanga katika giza langu
Siku za usoni, nataka kuwa na wewe
Bhuju, wewe ni mpenzi wangu wa milele

[Chorus - Wote]
Bhuju, Bhuju, usiniondoke
Mapenzi yako yamenifunga sana
Bhuju, Bhuju, nakupenda mpenzi
Wewe ni wangu, mimi ni wako milele

[Outro]
Bhuju... Bhuju... I love you...`
};

// --------------------------------------------------------------
//  Nexray API (primary)
// --------------------------------------------------------------
async function fetchFromNexray(query) {
    const url = `https://api.nexray.eu.cc/search/lyrics?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    if (data && data.status === true && data.result && data.result.lyrics && data.result.lyrics.plain_lyrics) {
        return {
            title: data.result.lyrics.track_name || data.result.title,
            artist: data.result.lyrics.artist_name || data.result.artist,
            lyrics: data.result.lyrics.plain_lyrics,
            source: 'Nexray'
        };
    }
    throw new Error('No lyrics found in Nexray response');
}

// --------------------------------------------------------------
//  Fallback APIs
// --------------------------------------------------------------
async function fetchFromSomeRandom(query) {
    const url = `https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data?.lyrics) {
        return { title: res.data.title, artist: res.data.author, lyrics: res.data.lyrics, source: 'SomeRandom' };
    }
    throw new Error('No lyrics');
}

async function fetchFromLyricsOvh(artist, title) {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data?.lyrics) {
        return { title, artist, lyrics: res.data.lyrics, source: 'lyrics.ovh' };
    }
    throw new Error('No lyrics');
}

async function fetchFromLyrist(query) {
    const url = `https://lyrist.vercel.app/api/lyrics?q=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data?.lyrics) {
        return { title: res.data.title || query, artist: res.data.artist || 'Unknown', lyrics: res.data.lyrics, source: 'Lyrist' };
    }
    throw new Error('No lyrics');
}

// --------------------------------------------------------------
//  Main command
// --------------------------------------------------------------
const lyricsCommand = async (sock, chatId, message, args) => {
    try {
        let query = (args || '').trim();
        if (!query) {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted && (quoted.conversation || quoted.extendedTextMessage?.text)) {
                query = (quoted.conversation || quoted.extendedTextMessage?.text || '').trim();
            }
            if (!query) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Usage:* .lyrics <song title> or .lyrics <artist> - <title>\n\nExamples:\n• .lyrics Bhuju\n• .lyrics Alikiba - Bhuju'
                }, { quoted: message });
                return;
            }
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        let result = null;
        const lowerQuery = query.toLowerCase();

        // Check hardcoded lyrics first
        if (lowerQuery.includes('bhuju')) {
            result = BHUJU_LYRICS;
            result.source = 'Hardcoded (Bigmanj DB)';
        } else {
            // Try Nexray API first
            try {
                result = await fetchFromNexray(query);
            } catch (e) {
                console.log(`Nexray failed: ${e.message}`);
                // Then try other APIs
                try { result = await fetchFromSomeRandom(query); }
                catch (e2) { console.log(`SomeRandom failed: ${e2.message}`); }
                if (!result) {
                    const { artist, title } = parseQuery(query);
                    if (artist && title) {
                        try { result = await fetchFromLyricsOvh(artist, title); }
                        catch (e3) { console.log(`lyrics.ovh failed: ${e3.message}`); }
                    }
                }
                if (!result) {
                    try { result = await fetchFromLyrist(query); }
                    catch (e4) { console.log(`Lyrist failed: ${e4.message}`); }
                }
            }
        }

        if (!result) {
            throw new Error(`No lyrics found for "${query}". Try "Bhuju" or "Alikiba - Bhuju".`);
        }

        const senderId = message.key.participant || message.key.remoteJid;
        const mention = getMentionNumber(senderId);
        const greeting = getGreeting();

        let caption = `✨ ${greeting} @${mention}\n\n`;
        caption += `🎵 *LYRICS*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `*Title:* ${result.title}\n`;
        caption += `*Artist:* ${result.artist}\n\n`;
        caption += `*Lyrics:*\n${result.lyrics}\n\n`;
        caption += `🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;
        caption += `\n_📡 via ${result.source}_`;

        if (caption.length > 60000) {
            await sock.sendMessage(chatId, { text: '❌ Lyrics too long to send.' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Lyrics error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        let errorMsg = error.message || '❌ *Lyrics not found.*\nTry: .lyrics Bhuju';
        if (error.message.includes('timeout')) errorMsg = '⏰ Request timeout. Try again.';
        if (error.message.includes('network')) errorMsg = '🌐 Network error. Try later.';
        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
    }
};

module.exports = lyricsCommand;