async function checkAdminsCommand(sock, chatId, message) {
    try {
        // Only works in groups
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
            return;
        }

        // Fetch group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // Filter participants who are admins (admin or superadmin)
        const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        
        if (admins.length === 0) {
            await sock.sendMessage(chatId, { text: '👥 No admins found in this group.' }, { quoted: message });
            return;
        }

        // Format the list
        let adminList = '👑 *GROUP ADMINS* 👑\n\n';
        admins.forEach((admin, index) => {
            // Extract the number (remove @s.whatsapp.net)
            const name = admin.id.split('@')[0];
            const role = admin.admin === 'superadmin' ? '🌟 SUPER ADMIN' : '🔹 ADMIN';
            adminList += `${index + 1}. ${name} (${role})\n`;
        });
        adminList += `\n📌 Total: ${admins.length} admin(s)`;

        await sock.sendMessage(chatId, { text: adminList }, { quoted: message });
    } catch (err) {
        console.error('Error in checkadmins command:', err);
        await sock.sendMessage(chatId, { text: '❌ Failed to retrieve admin list. Make sure the bot is a member of the group.' }, { quoted: message });
    }
}

module.exports = checkAdminsCommand;