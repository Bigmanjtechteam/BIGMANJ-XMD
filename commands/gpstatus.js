/**
 * 📸 Real WhatsApp Status Command (.gpstatus)
 * Share replied-to media directly to your WhatsApp Stories
 */

const { downloadMediaMessage, getDevice } = require('@whiskeysockets/baileys');

async function gpstatusCommand(sock, chatId, message) {
    try {
        const contextInfo = message.message?.extendedTextMessage?.contextInfo;

        if (!contextInfo || !contextInfo.quotedMessage) {
            await sock.sendMessage(chatId, {
                text: '📸 *Usage:* Reply to a media with `.gpstatus` to post it on your Status/Stories.'
            }, { quoted: message });
            return;
        }

        const quotedMessage = contextInfo.quotedMessage;
        const mediaMessage = quotedMessage.imageMessage || 
                            quotedMessage.videoMessage || 
                            quotedMessage.documentMessage;

        if (!mediaMessage) {
            await sock.sendMessage(chatId, { text: '❌ Reply to an image/video.' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '⏳ Uploading to Status...' }, { quoted: message });

        // Download media
        const mediaBuffer = await downloadMediaMessage(
            { key: { remoteJid: chatId, id: contextInfo.stanzaId, participant: contextInfo.participant }, message: quotedMessage },
            'buffer',
            {},
            { reuploadRequest: sock.updateMediaMessage }
        );

        const caption = mediaMessage.caption || '';
        let statusPayload = {};

        // Kuandaa Payload kulingana na aina ya media
        if (quotedMessage.imageMessage) {
            statusPayload = { image: mediaBuffer, caption: caption };
        } else if (quotedMessage.videoMessage) {
            statusPayload = { video: mediaBuffer, caption: caption };
        }

        // --- SEHEMU MUHIMU: Tuma kwenye Status ---
        // 'status@broadcast' ndio ID ya WhatsApp Stories
        await sock.sendMessage('status@broadcast', statusPayload, {
            backgroundColor: '#000000',
            font: 1,
            // Hii inahakikisha status inaonekana kwa watu wako
            statusJidList: [message.key.participant || message.key.remoteJid] 
        });

        // Thibitisha kwenye Group
        await sock.sendMessage(chatId, {
            text: `✅ Media posted successfully to your Status/Stories! 🚀`
        }, { quoted: message });

    } catch (err) {
        console.error('❌ Status Error:', err);
        await sock.sendMessage(chatId, { text: `❌ Error: ${err.message}` }, { quoted: message });
    }
}

module.exports = gpstatusCommand;
