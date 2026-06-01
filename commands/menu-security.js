const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

const handler = async (sock, chatId, m) => {
    const senderId = m.key.participant || m.key.remoteJid;
    const greeting = getGreeting();
    const mention = getMentionNumber(senderId);
    const commands = ['.antilink', '.antitag', '.antibot', '.antimention', '.antimentionstatus', '.antidelete', '.antibadword', '.anticall', '.pmblocker', '.ban', '.unban', '.warn', '.warnings', '.checkadmin', '.checkadmins'];

    let caption = `✨ ${greeting} @${mention}\n\n🛡️ *SECURITY MENU*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of commands) caption += `• ${cmd}\n`;
    caption += `\n🛡️ Protect your group from spam and abuse.\n🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    await sock.sendMessage(chatId, { react: { text: '🛡️', key: m.key } });
};

module.exports = handler;