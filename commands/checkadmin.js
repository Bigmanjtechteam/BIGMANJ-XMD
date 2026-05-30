async function checkAdminCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        
        let botJid = sock.user.id;
        if (!botJid.includes('@s.whatsapp.net')) {
            const botNumber = botJid.split(':')[0];
            botJid = `${botNumber}@s.whatsapp.net`;
        }

        const botParticipant = groupMetadata.participants.find(p => p.id === botJid);
        const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        const reply = isBotAdmin
            ? '✅ *Bot is an admin* in this group.'
            : '❌ *Bot is NOT an admin* in this group. Please make the bot an admin to use admin commands.';
        
        // Add footer
        const finalMessage = `${reply}\n\n> BIGMANj tech`;

        await sock.sendMessage(chatId, { text: finalMessage }, { quoted: message });
    } catch (err) {
        console.error('Error in checkadmin command:', err);
        await sock.sendMessage(chatId, { text: '❌ Failed to check admin status.' }, { quoted: message });
    }
}

module.exports = checkAdminCommand;