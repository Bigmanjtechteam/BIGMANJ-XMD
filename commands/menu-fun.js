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

    const commands = ['.truth', '.dare', '.joke', '.compliment', '.lyrics', '.character', '.weather', '.report', '.wasted', '.mickey', '.ship', '.mylove', '.mylve'];

    let caption = `✨ ΥΟ!!, @${mention}\n\n`;
    caption += `🎮 FUN MENU\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of commands) caption += `• ${cmd}\n`;
    caption += `\n🎮 Fun commands for entertainment.\n💡 Enjoy chatting with friends.\n\n`;
    caption += `🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    await sock.sendMessage(chatId, { react: { text: '🎮', key: m.key } });
    await sock.sendMessage(chatId, {
        image: { url: 'https://d.uguu.se/uCjHKvHJ.jpg' },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });
};

module.exports = handler;