const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

// Makundi na commands zao
const CATEGORIES = {
    '📂 GENERAL': [
        '.help', '.ping', '.alive', '.owner', '.repo', '.stats', '.settings', '.checkupdates', '.jid'
    ],
    '👥 GROUP': [
        '.add', '.kick', '.promote', '.demote', '.tagall', '.tagnotadmin', '.hidetag', '.tag',
        '.mention', '.setmention', '.setgname', '.setgdesc', '.setgpp', '.staff', '.listonline', '.clear', '.resetlink'
    ],
    '🛡️ SECURITY': [
        '.antilink', '.antitag', '.antibot', '.antimention', '.antimentionstatus', '.antidelete',
        '.antibadword', '.anticall', '.pmblocker', '.ban', '.unban', '.warn', '.warnings',
        '.checkadmin', '.checkadmins'
    ],
    '🤖 AI': [
        '.gpt', '.aivoice', '.imagine', '.translate', '.bigmanj', '.ghost', '.getcode', '.getlink'
    ],
    '📥 DOWNLOAD': [
        '.play', '.video', '.music', '.facebook', '.instagram', '.igs', '.igsc', '.tiktok',
        '.gdrive', '.ytmp3', '.ytmp4', '.shazam', '.lyrics'
    ],
    '🎨 EFFECTS': [
        '.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil',
        '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink',
        '.glitch', '.fire', '.wasted', '.mickey', '.blur', '.take', '.steal', '.crop', '.toimg'
    ],
    '👑 OWNER': [
        '.sudo', '.update', '.checkupdates', '.newgroup', '.mode', '.clearsession', '.cleartmp',
        '.setpp', '.pp', '.autostatus', '.autotyping', '.autoread', '.areact'
    ],
    '⚙️ SETTINGS': [
        '.autoread', '.autotyping', '.autostatus', '.areact', '.setmention', '.groupmention',
        '.mention', '.antidelete', '.pmblocker', '.anticall', '.settings'
    ],
    '🔧 TOOLS': [
        '.toimg', '.autourl', '.audiourl', '.url', '.tourl', '.getcode', '.getlink', '.qr',
        '.emojimix', '.emix', '.stickertelegram', '.tg', '.tgsticker', '.telesticker', '.viewonce',
        '.vv', '.sticker', '.s', '.stickeralt', '.gpstatus', '.tts', '.delete', '.del', '.report',
        '.weather', '.halotel', '.topmembers', '.character', '.stats', '.repo'
    ],
    '🎮 FUN': [
        '.truth', '.dare', '.joke', '.compliment', '.lyrics', '.character', '.weather', '.report',
        '.wasted', '.mickey', '.ship', '.mylove', '.mylve'
    ],
    '⚡ AUTOMATION': [
        '.autostatus', '.autoread', '.autotyping', '.areact', '.antibot', '.antimention',
        '.antimentionstatus', '.antilink', '.antitag', '.chatbot', '.bigmanj'
    ]
};

const handler = async (sock, chatId, m) => {
    const senderId = m.key.participant || m.key.remoteJid;
    const greeting = getGreeting();
    const mention = getMentionNumber(senderId);

    let caption = `✨ ΥΟ!!, @${mention}\n\n`;
    caption += `📋 *ALL COMMANDS BY CATEGORY*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const [category, cmds] of Object.entries(CATEGORIES)) {
        caption += `*${category}*\n`;
        caption += `▸ ${cmds.join('  ▸  ')}\n\n`;
    }

    caption += `🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    // React 📋 kabla ya kutuma
    await sock.sendMessage(chatId, { react: { text: '📋', key: m.key } });

    // Tuma picha na ujumbe
    await sock.sendMessage(chatId, {
        image: { url: 'https://files.catbox.moe/g273hp.jpg' },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });
};

module.exports = handler;