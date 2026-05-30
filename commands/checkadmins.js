async function checkAdminsCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' }, { quoted: message });
            return;
        }

        // Fetch group metadata – inafanya kazi hata kama bot si admin, ilimradi ni member
        const groupMetadata = await sock.groupMetadata(chatId);
        const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

        if (admins.length === 0) {
            await sock.sendMessage(chatId, { text: '👥 Hakuna admin katika group hili.' }, { quoted: message });
            return;
        }

        let adminList = '👑 *MA ADMIN WA GROUP* 👑\n\n';
        const mentions = [];

        admins.forEach((admin, index) => {
            const jid = admin.id;
            const name = jid.split('@')[0];
            const role = admin.admin === 'superadmin' ? '🌟 SUPER ADMIN' : '🔹 ADMIN';
            adminList += `${index + 1}. @${name} (${role})\n`;
            mentions.push(jid);
        });

        adminList += `\n📌 Jumla: ${admins.length} admin(s)`;
        adminList += `\n\n> BIGMANj tech`;

        await sock.sendMessage(chatId, {
            text: adminList,
            mentions: mentions
        }, { quoted: message });

    } catch (err) {
        console.error('Error in checkadmins command:', err);
        await sock.sendMessage(chatId, { text: '❌ Imeshindwa kupata orodha ya wadamin. Hakikisha bot ipo kwenye group.' }, { quoted: message });
    }
}

module.exports = checkAdminsCommand;