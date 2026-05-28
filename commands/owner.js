const { sendInteractiveMessage } = require('gifted-btns');
const settings = require('../settings');

/**
 * ownerCommand - 𝙱𝙸𝙶𝙼𝙰𝙽𝚓 Glitch Bot Owner Info
 * Version: Fixed 'key' undefined error
 */
async function ownerCommand(sock, chatId, m, body = '') {
    try {
        // 1. Safety Check kwa ajili ya 'message' object
        if (!sock || !chatId || !m) {
            return console.error('❌ Missing core parameters in ownerCommand');
        }

        // 2. Data za Owner
        const ownerNumberRaw = settings.ownerNumber || '255777580820';
        const ownerName = settings.botOwner || 'Bigmanj Developer';
        const botName = settings.botName || '*BIGMANj DT*';
        
        const cleanNumber = ownerNumberRaw.replace(/[^\d]/g, '');
        const waLink = `https://wa.me/${cleanNumber}`;
        const channelLink = 'https://whatsapp.com/channel/0029Vb6B9xFCxoAseuG1g610';

        // 3. [BUTTON HANDLER]
        const input = (body || '').toLowerCase().trim();
        if (input === 'get_vcard' || input === '.get_vcard') {
            const vcard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${ownerName}\n` +
                `ORG:${botName} Tech;\n` +
                `TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\n` +
                'END:VCARD';

            return await sock.sendMessage(chatId, {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }]
                }
            }, { quoted: m });
        }

        // 4. [MAIN UI]
        const ownerText = `👑 *BOT OWNER INFORMATION*

*🤖 Bot:* ${botName}
*👤 Owner:* ${ownerName}
*📞 Contact:* +${cleanNumber}

_Wasiliana na mkuu kwa msaada zaidi au projects._ 👇`;

        const imageUrl = 'https://water-billing-292n.onrender.com/1761205727440.png';

        // Piga reaction kwa usalama (Check if m.key exists)
        if (m.key) {
            await sock.sendMessage(chatId, { react: { text: '👑', key: m.key } }).catch(() => null);
        }

        const msgOptions = {
            text: ownerText,
            footer: "Mickey Glitch Tech • 2026",
            image: { url: imageUrl },
            interactiveButtons: [
                { 
                    name: 'cta_url', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '💬 WhatsApp Chat', 
                        url: waLink 
                    }) 
                },
                { 
                    name: 'quick_reply', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '📇 Get Business Card', 
                        id: 'get_vcard' 
                    }) 
                },
                { 
                    name: 'cta_url', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '📢 Join Channel', 
                        url: channelLink 
                    }) 
                }
            ]
        };

        await sendInteractiveMessage(sock, chatId, msgOptions, { quoted: m });

    } catch (e) {
        console.error('Owner Cmd Error:', e);
        // Tuma error message bila kutegemea reaction
        await sock.sendMessage(chatId, { 
            text: '❌ *Hitilafu imetokea kwenye mfumo.*' 
        }).catch(err => console.log('Final fallback failed'));
    }
}

module.exports = ownerCommand;
