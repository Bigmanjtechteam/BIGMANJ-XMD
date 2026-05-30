const FOOTER = '\n\n> bigmanj tech';

async function listonlineCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' }, { quoted: message });
            return;
        }

        // Ensure the sender is marked as online right now
        const senderId = message.key.participant || message.key.remoteJid;
        if (senderId) {
            let groupUsers = global.onlineUsers?.get(chatId);
            if (!groupUsers) {
                groupUsers = new Set();
                global.onlineUsers.set(chatId, groupUsers);
            }
            groupUsers.add(senderId);
        }

        const groupUsers = global.onlineUsers?.get(chatId);
        if (!groupUsers || groupUsers.size === 0) {
            await sock.sendMessage(chatId, { text: '❌ Hakuna members walioonekana online kwa sasa.' }, { quoted: message });
            return;
        }

        // Get group metadata to fetch participant names
        const groupMetadata = await sock.groupMetadata(chatId);
        const participantMap = new Map();
        for (const p of groupMetadata.participants) {
            participantMap.set(p.id, p);
        }

        let listMessage = '📡 *ONLINE MEMBERS*\n\n';
        const mentions = [];

        for (const jid of groupUsers) {
            // Skip if not a current participant (left group)
            if (!participantMap.has(jid)) continue;
            const name = participantMap.get(jid).pushName || jid.split('@')[0];
            listMessage += `• @${name}\n`;
            mentions.push(jid);
        }

        if (mentions.length === 0) {
            await sock.sendMessage(chatId, { text: '❌ Hakuna members walioonekana online kwa sasa.' }, { quoted: message });
            return;
        }

        listMessage += `\n👥 Total Online: ${mentions.length}`;
        listMessage += FOOTER;

        await sock.sendMessage(chatId, {
            text: listMessage,
            mentions: mentions
        }, { quoted: message });

    } catch (error) {
        console.error('Error in .listonline:', error);
        await sock.sendMessage(chatId, { text: '❌ Imeshindwa kuorodhesha members online. Jaribu tena.' }, { quoted: message });
    }
}

module.exports = listonlineCommand;