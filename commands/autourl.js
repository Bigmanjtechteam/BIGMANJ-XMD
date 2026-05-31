const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

// ---------------------- DOWNLOAD AUDIO FROM WHATSAPP ----------------------
async function downloadAudioFromWhatsApp(sock, audioMsg) {
    // Method 1: try direct download
    try {
        const buffer = await sock.downloadMediaMessage({ message: { audioMessage: audioMsg } });
        if (buffer && buffer.length > 0) return buffer;
    } catch (err) {
        console.log('Direct download failed, trying fallback...');
    }
    
    // Method 2: if message has direct url
    if (audioMsg.url) {
        const response = await axios.get(audioMsg.url, { responseType: 'arraybuffer', timeout: 120000 });
        return Buffer.from(response.data);
    }
    
    // Method 3: use Baileys internal download via media key
    try {
        const stream = await sock.downloadMediaMessage({ message: { audioMessage: audioMsg } }, 'stream');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
    } catch (err) {
        console.error('All download methods failed:', err);
        throw new Error('Cannot download audio – unsupported format or corrupt file');
    }
}

// ---------------------- UPLOAD TO CATBOX (main) ----------------------
async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, filename);

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: { ...form.getHeaders(), 'User-Agent': 'WhatsAppBot/2.0' },
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });
    if (response.data && response.data.startsWith('https://')) return response.data;
    throw new Error('Catbox upload failed: ' + response.data);
}

// ---------------------- UPLOAD TO GOFILE (fallback 1) ----------------------
async function uploadToGoFile(buffer, filename) {
    const form = new FormData();
    form.append('file', buffer, filename);

    const response = await axios.post('https://store1.gofile.io/uploadFile', form, {
        headers: { ...form.getHeaders() },
        timeout: 180000
    });
    if (response.data?.status === 'ok' && response.data?.data?.downloadPage)
        return response.data.data.downloadPage;
    throw new Error('GoFile upload failed');
}

// ---------------------- UPLOAD TO TMPFILES (fallback 2) ----------------------
async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData();
    form.append('file', buffer, filename);

    const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: { ...form.getHeaders() },
        timeout: 90000
    });
    if (response.data?.data?.url) return response.data.data.url;
    throw new Error('TmpFiles upload failed');
}

// ---------------------- MAIN UPLOAD WITH FALLBACKS ----------------------
async function uploadWithFallback(buffer, filename) {
    const services = [
        { name: 'Catbox', func: uploadToCatbox },
        { name: 'GoFile', func: uploadToGoFile },
        { name: 'TmpFiles', func: uploadToTmpFiles }
    ];
    let lastError;
    for (const svc of services) {
        try {
            console.log(`📤 Trying ${svc.name}...`);
            const url = await svc.func(buffer, filename);
            console.log(`✅ Upload success via ${svc.name}`);
            return { url, service: svc.name };
        } catch (err) {
            console.error(`${svc.name} failed:`, err.message);
            lastError = err;
        }
    }
    throw new Error(`All upload services failed: ${lastError?.message || 'unknown'}`);
}

// ---------------------- FORMAT FILE SIZE ----------------------
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ---------------------- GET FILE EXTENSION ----------------------
function getExtFromMime(mimetype) {
    if (!mimetype) return '.mp3';
    if (mimetype.includes('mpeg')) return '.mp3';
    if (mimetype.includes('mp4') || mimetype.includes('m4a')) return '.m4a';
    if (mimetype.includes('ogg')) return '.ogg';
    if (mimetype.includes('opus')) return '.opus';
    if (mimetype.includes('wav')) return '.wav';
    if (mimetype.includes('aac')) return '.aac';
    return '.bin';
}

// ---------------------- MAIN COMMAND ----------------------
const autourlCommand = {
    name: 'autourl',
    aliases: ['audiourl'],
    category: 'tools',
    execute: async (sock, chatId, message) => {
        try {
            // Check reply
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Reply to an audio message first!*\n\nExample: Reply to any voice note or audio and send `.autourl`'
                }, { quoted: message });
                return;
            }

            // Check if audio
            const audioMsg = quoted.audioMessage;
            if (!audioMsg) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Not an audio message!*\nPlease reply to a voice note, MP3, M4A, OGG, or OPUS file.'
                }, { quoted: message });
                return;
            }

            // React ⏳
            await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

            // Status message
            const statusMsg = await sock.sendMessage(chatId, {
                text: '📥 *Downloading audio...*\nThis may take a moment depending on file size.'
            }, { quoted: message });

            // Download audio (any size)
            let audioBuffer;
            try {
                audioBuffer = await downloadAudioFromWhatsApp(sock, audioMsg);
                if (!audioBuffer || audioBuffer.length === 0) throw new Error('Empty buffer');
            } catch (err) {
                await sock.sendMessage(chatId, { text: '❌ *Failed to download audio.*\nReason: ' + err.message }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return;
            }

            // Edit status
            await sock.sendMessage(chatId, { text: '☁️ *Uploading to cloud...*\nUsing multiple services for reliability.', edit: statusMsg.key });

            // File info
            const mimetype = audioMsg.mimetype || 'audio/mpeg';
            const ext = getExtFromMime(mimetype);
            const fileName = `audio_${Date.now()}${ext}`;
            const fileSize = formatBytes(audioBuffer.length);

            // Upload with fallback
            let uploadResult;
            try {
                uploadResult = await uploadWithFallback(audioBuffer, fileName);
            } catch (err) {
                await sock.sendMessage(chatId, { text: `❌ *Upload failed after all attempts.*\nError: ${err.message}` }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return;
            }

            // React ✅
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

            // Success response
            const caption = `✅ *Audio uploaded successfully*\n\n🔗 *Direct URL:*\n${uploadResult.url}\n\n📁 *File name:* ${fileName}\n📦 *Size:* ${fileSize}\n☁️ *Service:* ${uploadResult.service}\n\n> bigmanj tech™`;
            await sock.sendMessage(chatId, { text: caption }, { quoted: message });

        } catch (error) {
            console.error('autourl fatal error:', error);
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(chatId, {
                text: `❌ *Unexpected error*\n${error.message.slice(0, 200)}`
            }, { quoted: message });
        }
    }
};

module.exports = autourlCommand;