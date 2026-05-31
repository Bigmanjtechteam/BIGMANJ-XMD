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

    const commands = ['.gpt', '.aivoice', '.imagine', '.translate', '.bigmanj', '.ghost', '.getcode', '.getlink'];

    let caption = `✨ ΥΟ!!, @${mention}\n\n`;
    caption += `🤖 AI MENU\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of commands) caption += `• ${cmd}\n`;
    caption += `\n🤖 Access powerful AI tools.\n💡 Smart answers anytime.\n\n`;
    caption += `🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    await sock.sendMessage(chatId, { react: { text: '🤖', key: m.key } });
    await sock.sendMessage(chatId, {
        image: { url: 'https://n.uguu.se/lWjrWdPN.jpg' },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });
};

module.exports = handler;