const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// ---------------------- UPLOAD TO CATBOX ----------------------
async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, filename);

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': 'WhatsAppBot/1.0'
        },
        timeout: 30000
    });

    if (response.data && response.data.startsWith('https://')) {
        return response.data;
    } else {
        throw new Error('Catbox upload failed: ' + response.data);
    }
}

// ---------------------- FORMAT FILE SIZE ----------------------
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ---------------------- MAIN COMMAND ----------------------
const autourlCommand = {
    name: 'autourl',
    aliases: ['audiourl'],
    category: 'tools',
    execute: async (sock, chatId, message) => {
        try {
            // Check if replying to a message
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Reply to an audio message first!*\n\nExample: Reply to any audio and send `.autourl`'
                }, { quoted: message });
                return;
            }

            // Check if quoted message contains audio
            const audioMsg = quoted.audioMessage;
            if (!audioMsg) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Not an audio message!*\nPlease reply to an audio (MP3, M4A, OGG, OPUS).'
                }, { quoted: message });
                return;
            }

            // React with ⏳ (processing)
            await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

            // Send initial status
            await sock.sendMessage(chatId, {
                text: '🔄 *Uploading audio...*\nPlease wait, this may take a few seconds.'
            }, { quoted: message });

            // Download the audio buffer
            let audioBuffer;
            try {
                audioBuffer = await sock.downloadMediaMessage({ message: { audioMessage: audioMsg } });
                if (!audioBuffer) throw new Error('Failed to download audio');
            } catch (downloadErr) {
                console.error('Download error:', downloadErr);
                throw new Error('Could not download audio. Try again later.');
            }

            // Determine file extension from mimetype
            const mimetype = audioMsg.mimetype || 'audio/mpeg';
            let ext = '.mp3';
            if (mimetype.includes('mpeg')) ext = '.mp3';
            else if (mimetype.includes('mp4') || mimetype.includes('m4a')) ext = '.m4a';
            else if (mimetype.includes('ogg')) ext = '.ogg';
            else if (mimetype.includes('opus')) ext = '.opus';
            else ext = '.bin';

            const fileName = `audio_${Date.now()}${ext}`;
            const fileSizeBytes = audioBuffer.length;
            const fileSize = formatBytes(fileSizeBytes);

            // Upload to Catbox
            let url;
            try {
                url = await uploadToCatbox(audioBuffer, fileName);
            } catch (uploadErr) {
                console.error('Upload error:', uploadErr);
                throw new Error('Upload service failed. Please try later.');
            }

            // React with ✅
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

            // Send success response
            const caption = `✅ *Audio uploaded successfully*\n\n🔗 *URL:*\n${url}\n\n📁 *File Name:* ${fileName}\n📦 *Size:* ${fileSize}\n\n> bigmanj tech™`;
            await sock.sendMessage(chatId, { text: caption }, { quoted: message });

        } catch (error) {
            console.error('autourl error:', error);
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(chatId, {
                text: `❌ *Failed to upload audio.*\n\nReason: ${error.message || 'Unknown error'}\n\nPossible issues:\n- Audio too large (Catbox limit ~200MB)\n- Unsupported format\n- Network problem`
            }, { quoted: message });
        }
    }
};

module.exports = autourlCommand;