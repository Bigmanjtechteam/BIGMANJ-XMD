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
    const commands = ['.sudo', '.update', '.checkupdates', '.newgroup', '.mode', '.clearsession', '.cleartmp', '.setpp', '.pp', '.autostatus', '.autotyping', '.autoread', '.areact'];

    let caption = `✨ ${greeting} @${mention}\n\n👑 *OWNER MENU*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of commands) caption += `• ${cmd}\n`;
    caption += `\n👑 Owner exclusive commands.\n🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    await sock.sendMessage(chatId, { react: { text: '👑', key: m.key } });
};

module.exports = handler;