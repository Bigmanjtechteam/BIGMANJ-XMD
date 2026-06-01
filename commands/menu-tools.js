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
    const commands = ['.toimg', '.autourl', '.audiourl', '.url', '.tourl', '.getcode', '.getlink', '.qr', '.emojimix', '.emix', '.stickertelegram', '.tg', '.tgsticker', '.telesticker', '.viewonce', '.vv', '.sticker', '.s', '.stickeralt', '.gpstatus', '.tts', '.delete', '.del', '.report', '.weather', '.halotel', '.topmembers', '.character', '.stats', '.repo'];

    let caption = `✨ ΥΟ!!, @${mention}\n\n🔧 TOOLS MENU\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of commands) caption += `• ${cmd}\n`;
    caption += `\n🔧 Useful tools for daily tasks.\n🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    await sock.sendMessage(chatId, { react: { text: '🔧', key: m.key } });
    await sock.sendMessage(chatId, { image: { url: 'https://files.catbox.moe/g273hp.jpg' }, caption, mentions: [senderId] }, { quoted: m });
};

module.exports = handler;