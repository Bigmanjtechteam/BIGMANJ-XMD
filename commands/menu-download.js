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

    const commands = ['.play', '.video', '.music', '.facebook', '.instagram', '.igs', '.igsc', '.tiktok', '.gdrive', '.ytmp3', '.ytmp4', '.shazam', '.lyrics'];

    let caption = `✨ ΥΟ!!, @${mention}\n\n`;
    caption += `📥 DOWNLOAD MENU\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of commands) caption += `• ${cmd}\n`;
    caption += `\n📥 Download media from different platforms.\n💡 Fast downloads.\n\n`;
    caption += `🚀 BIGMANj BOT — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    await sock.sendMessage(chatId, {
        image: { url: 'https://o.uguu.se/QTgLeujQ.jpg' }, // Picha yako mpya kwa DOWNLOAD MENU
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });
};

module.exports = handler;