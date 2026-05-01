const settings = require('../settings');

/**
 * Create new WhatsApp group - Owner Only
 */
async function newgroupCommand(sock, chatId, message, args) {
    try {
        // 1. Check if sender is owner (Angalia kama ni owner)
        const ownerNumbers = Array.isArray(settings.ownerNumber)
            ? settings.ownerNumber
            : [settings.ownerNumber];
        const senderId = (message.sender || message.key?.participant || '').split('@')[0];

        if (!ownerNumbers.includes(senderId)) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Amri hii ni kwa mmiliki pekee! (Owner Only)*'
            }, { quoted: message });
        }

        // 2. Define group name (Jina la group)
        const groupName = args.join(' ').trim() || `Mickey Group ${Date.now()}`;

        // 3. Define members (Wanachama)
        // Ikiwa ni kwenye group, itachukua members wote. Ikiwa ni DM, utakuwa wewe pekee.
        const senderJid = message.sender || message.key?.participant;
        let members = senderJid ? [senderJid] : [];

        if (message.isGroup || chatId?.endsWith('@g.us')) {
            const groupMetadata = await sock.groupMetadata(chatId);
            members = groupMetadata.participants
                .filter(p => p && p.id)
                .map(p => p.id);

            if (senderJid && !members.includes(senderJid)) {
                members.push(senderJid);
            }
        }

        if (!members.length) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Haijaweza kupata wanachama wa kuunda group.*'
            }, { quoted: message });
        }

        try {
            // 4. Create group (Tengeneza group)
            const newGroup = await sock.groupCreate(groupName, members);

            // Tuma jibu kwenye chat ulikotoa amri
            await sock.sendMessage(chatId, {
                text: `✅ *Group Jipya Limetengenezwa!* (New Group Created)

📛 *Jina:* ${groupName}
👥 *Wanachama:* ${members.length}
🆔 *ID:* ${newGroup.id}`
            }, { quoted: message });

            // Tuma ujumbe wa kwanza kwenye group jipya
            await sock.sendMessage(newGroup.id, {
                text: `👋 *Karibuni kwenye ${groupName}!*\n\n_Created via MICKEY GLITCH_`
            });

        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ *Imeshindwa kutengeneza group!* (Failed)\n\n_Error: ${error.message}_`
            }, { quoted: message });
        }

    } catch (e) {
        console.error('NewGroup Cmd Error:', e);
        await sock.sendMessage(chatId, {
            text: '❌ *Hitilafu imetokea! (Error occurred)*'
        }, { quoted: message });
    }
}

module.exports = newgroupCommand;
module.exports.name = 'newgroup';
module.exports.category = 'OWNER';
module.exports.description = 'Create a new group (Owner only)';
