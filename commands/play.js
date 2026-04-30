const yts = require('yt-search');
const axios = require('axios');

async function playCommand(sock, chatId, message, args) {
    const query = Array.isArray(args) ? args.join(' ') : args;
    if (!query) return;

    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } }).catch(() => {});

    try {
        const search = await yts(query);
        const v = search?.videos?.[0];
        if (!v) return sock.sendMessage(chatId, { text: '❌ *Sikuipata!*' }, { quoted: message });

        // Tuma Thumbnail
        await sock.sendMessage(chatId, {
            image: { url: v.thumbnail },
            caption: `🎵 *Title:* ${v.title}\n👤 *Author:* ${v.author.name}\n⏲️ *Dur:* ${v.timestamp}`
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } }).catch(() => {});

        // 1. Pata data kutoka API ya pili (ytdown)
        const apiUrl = `https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(v.url)}`;
        const res = await axios.get(apiUrl);
        
        // Kufuata JSON uliyotoa: data -> data -> data -> audio
        const audioUrl = res.data?.data?.data?.audio || res.data?.data?.audio;

        if (!audioUrl) throw new Error("API haikutoa link ya audio.");

        // 2. Badili audio kuwa Buffer (Hii inazuia error za link)
        const response = await axios({
            method: 'get',
            url: audioUrl,
            responseType: 'arraybuffer'
        });
        const buffer = Buffer.from(response.data, 'binary');

        // 3. Tuma kama Audio/mp4
        await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mp4',
            fileName: `${v.title}.mp4`,
            ptt: false
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});

    } catch (err) {
        console.error("DEBUG ERROR:", err.message);
        await sock.sendMessage(chatId, {
            text: `❌ *Error!*\n\n_Sababu: ${err.message}_`
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
    }
}

module.exports = playCommand;
