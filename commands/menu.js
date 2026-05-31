const moment = require('moment-timezone');
const axios = require('axios');

// --------------------------------------------------------------
// 1. HELPER FUNCTIONS
// --------------------------------------------------------------
const getMessageText = (m) => {
    if (m.message?.conversation) return m.message.conversation;
    if (m.message?.extendedTextMessage?.text) return m.message.extendedTextMessage.text;
    return '';
};

const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
};

const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

const getMentionNumber = (jid) => jid.split('@')[0];

// --------------------------------------------------------------
// 2. PICHA ZA MENU (Badilisha URLs hapa ukipenda)
// --------------------------------------------------------------
const IMAGES = {
    main: 'https://i.ibb.co/cX8ysKLT/RD32363337313436343437363340732e77686174736170702e6e6574-554891.jpg', // Dog Crasher
    general: 'https://picsum.photos/id/20/800/400',      // Blue Theme
    group: 'https://picsum.photos/id/104/800/400',       // Green Theme
    security: 'https://picsum.photos/id/0/800/400',      // Red Theme
    ai: 'https://picsum.photos/id/119/800/400',          // Purple Theme
    download: 'https://picsum.photos/id/29/800/400',     // Orange Theme
    effects: 'https://picsum.photos/id/96/800/400',      // Pink Theme
    owner: 'https://picsum.photos/id/106/800/400',       // Gold Theme
    settings: 'https://picsum.photos/id/21/800/400',     // Cyan Theme
    tools: 'https://picsum.photos/id/26/800/400',        // Grey Theme
    fun: 'https://picsum.photos/id/169/800/400',         // Rainbow Theme
    automation: 'https://picsum.photos/id/91/800/400'    // Dark Theme
};

// --------------------------------------------------------------
// 3. SUBMENU DATA (zote zilizo kwenye main.js zimegawanywa)
// --------------------------------------------------------------
const SUBMENUS = {
    'menu-general': {
        title: '📂 GENERAL MENU',
        theme: 'Blue',
        description: '🤖 This section contains general bot commands.\n💡 Use these commands to interact with the bot.',
        commands: ['.help', '.ping', '.alive', '.owner', '.repo', '.stats', '.settings', '.checkupdates', '.jid']
    },
    'menu-group': {
        title: '👥 GROUP MENU',
        theme: 'Green',
        description: '👥 This menu helps manage WhatsApp groups.\n💡 Perfect for group management.',
        commands: ['.add', '.kick', '.promote', '.demote', '.tagall', '.tagnotadmin', '.hidetag', '.tag', '.mention', '.setmention', '.setgname', '.setgdesc', '.setgpp', '.staff', '.listonline', '.clear', '.resetlink']
    },
    'menu-security': {
        title: '🛡️ SECURITY MENU',
        theme: 'Red',
        description: '🛡️ Protect your group from spam and abuse.\n💡 Security comes first.',
        commands: ['.antilink', '.antitag', '.antibot', '.antimention', '.antimentionstatus', '.antidelete', '.antibadword', '.anticall', '.pmblocker', '.ban', '.unban', '.warn', '.warnings', '.checkadmin', '.checkadmins']
    },
    'menu-ai': {
        title: '🤖 AI MENU',
        theme: 'Purple',
        description: '🤖 Access powerful AI tools.\n💡 Smart answers anytime.',
        commands: ['.gpt', '.aivoice', '.imagine', '.translate', '.bigmanj', '.ghost', '.getcode', '.getlink']
    },
    'menu-download': {
        title: '📥 DOWNLOAD MENU',
        theme: 'Orange',
        description: '📥 Download media from different platforms.\n💡 Fast downloads.',
        commands: ['.play', '.video', '.music', '.facebook', '.instagram', '.igs', '.igsc', '.tiktok', '.gdrive', '.ytmp3', '.ytmp4', '.shazam', '.lyrics']
    },
    'menu-effects': {
        title: '🎨 EFFECTS MENU',
        theme: 'Pink',
        description: '🎨 Create amazing text and image effects.\n💡 Make your content stand out.',
        commands: ['.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink', '.glitch', '.fire', '.wasted', '.mickey', '.blur', '.take', '.steal', '.crop', '.toimg']
    },
    'menu-owner': {
        title: '👑 OWNER MENU',
        theme: 'Gold',
        description: '👑 Owner exclusive commands.\n💡 Full control of the bot.',
        commands: ['.sudo', '.update', '.checkupdates', '.newgroup', '.mode', '.clearsession', '.cleartmp', '.setpp', '.pp', '.autostatus', '.autotyping', '.autoread', '.areact', '.shutdown', '.restart']
    },
    'menu-settings': {
        title: '⚙️ SETTINGS MENU',
        theme: 'Cyan',
        description: '⚙️ Configure bot settings.\n💡 Customize your experience.',
        commands: ['.autoread', '.autotyping', '.autostatus', '.areact', '.setmention', '.groupmention', '.mention', '.antidelete', '.pmblocker', '.anticall', '.settings']
    },
    'menu-tools': {
        title: '🔧 TOOLS MENU',
        theme: 'Grey',
        description: '🔧 Useful tools for daily tasks.\n💡 Powerful utilities in one place.',
        commands: ['.toimg', '.autourl', '.audiourl', '.url', '.tourl', '.getcode', '.getlink', '.qr', '.emojimix', '.emix', '.stickertelegram', '.tg', '.tgsticker', '.telesticker', '.viewonce', '.vv', '.sticker', '.s', '.stickeralt', '.gpstatus', '.tts', '.delete', '.del', '.report', '.weather', '.halotel', '.topmembers', '.character', '.stats', '.repo']
    },
    'menu-fun': {
        title: '🎮 FUN MENU',
        theme: 'Rainbow',
        description: '🎮 Fun commands for entertainment.\n💡 Enjoy chatting with friends.',
        commands: ['.truth', '.dare', '.joke', '.compliment', '.lyrics', '.character', '.weather', '.report', '.wasted', '.mickey', '.ship', '.mylove', '.mylve']
    },
    'menu-automation': {
        title: '🤖 AUTOMATION MENU',
        theme: 'Dark',
        description: '🤖 Automate your WhatsApp experience.\n💡 Let the bot work for you.',
        commands: ['.autostatus', '.autoread', '.autotyping', '.areact', '.antibot', '.antimention', '.antimentionstatus', '.antilink', '.antitag', '.chatbot', '.bigmanj']
    }
};

// --------------------------------------------------------------
// 4. HESABU YA IDADI YA COMMANDS ZOTE
// --------------------------------------------------------------
const getTotalCommands = () => {
    let total = 0;
    for (const key in SUBMENUS) {
        total += SUBMENUS[key].commands.length;
    }
    return total;
};

// --------------------------------------------------------------
// 5. AUDIO KWA MAIN MENU (kutoka URL)
// --------------------------------------------------------------
const AUDIO_URL = 'https://files.catbox.moe/0mn7pe.mp3';
let cachedAudio = null;

async function getAudioBuffer() {
    if (cachedAudio) return cachedAudio;
    try {
        const res = await axios.get(AUDIO_URL, { responseType: 'arraybuffer', timeout: 30000 });
        cachedAudio = Buffer.from(res.data);
        console.log('✅ Audio loaded, size:', cachedAudio.length);
        return cachedAudio;
    } catch (err) {
        console.error('❌ Audio download failed:', err.message);
        return null;
    }
}

async function sendAudioMessage(sock, chatId, quotedMsg) {
    const buffer = await getAudioBuffer();
    if (!buffer) return;
    try {
        await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: quotedMsg });
        console.log('🎵 Audio sent');
    } catch (err) {
        console.error('Audio send error:', err.message);
    }
}

// --------------------------------------------------------------
// 6. MAIN MENU (Navigation System)
// --------------------------------------------------------------
const sendMainMenu = async (sock, chatId, m, senderId) => {
    moment.tz.setDefault('Africa/Dar_es_Salaam');
    const now = moment();
    const greeting = getGreeting();
    const mentionNumber = getMentionNumber(senderId);
    const ownerNumber = '255777580820';
    const ownerName = 'BIGMANj';
    const runtime = formatUptime(process.uptime());
    const date = now.format('DD/MM/YYYY');
    const time = now.format('HH:mm:ss');
    const totalCommands = getTotalCommands();

    let caption = '';
    caption += `╭━━━〔 BIGMANj BOT 〕━━━⬣\n`;
    caption += `┃ 📂 .menu-general\n`;
    caption += `┃ 👥 .menu-group\n`;
    caption += `┃ 🛡️ .menu-security\n`;
    caption += `┃ 🤖 .menu-ai\n`;
    caption += `┃ 📥 .menu-download\n`;
    caption += `┃ 🎨 .menu-effects\n`;
    caption += `┃ 👑 .menu-owner\n`;
    caption += `┃ ⚙️ .menu-settings\n`;
    caption += `┃ 🔧 .menu-tools\n`;
    caption += `┃ 🎮 .menu-fun\n`;
    caption += `┃ 🤖 .menu-automation\n`;
    caption += `╰━━━━━━━━━━━━━━⬣\n\n`;
    caption += `✨ ΥΟ!!, @${mentionNumber}\n\n`;
    caption += `👑 Owner : ${ownerName}\n`;
    caption += `⚡ Commands : ${totalCommands}\n`;
    caption += `📅 Date : ${date}\n`;
    caption += `⏰ Time : ${time}\n`;
    caption += `🚀 Runtime : ${runtime}\n\n`;
    caption += `> bigmanj tech™`;

    await sock.sendMessage(chatId, {
        image: { url: IMAGES.main },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });

    // Tuma audio baada ya sekunde 2
    setTimeout(() => sendAudioMessage(sock, chatId, m), 2000);
};

// --------------------------------------------------------------
// 7. SUBMENU (kila moja ina picha, description, na commands)
// --------------------------------------------------------------
const sendSubMenu = async (sock, chatId, m, senderId, menuKey) => {
    const menu = SUBMENUS[menuKey];
    if (!menu) return false;

    const greeting = getGreeting();
    const mentionNumber = getMentionNumber(senderId);

    let caption = '';
    caption += `✨ ΥΟ!!, @${mentionNumber}\n\n`;
    caption += `${menu.title}\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of menu.commands) {
        caption += `• ${cmd}\n`;
    }
    caption += `\n${menu.description}\n\n`;
    caption += `🚀 BIGMANj BOT — Fast • Powerful • Reliable\n\n`;
    caption += `> bigmanj tech™`;

    let imageUrl = IMAGES.main;
    switch (menuKey) {
        case 'menu-general': imageUrl = IMAGES.general; break;
        case 'menu-group': imageUrl = IMAGES.group; break;
        case 'menu-security': imageUrl = IMAGES.security; break;
        case 'menu-ai': imageUrl = IMAGES.ai; break;
        case 'menu-download': imageUrl = IMAGES.download; break;
        case 'menu-effects': imageUrl = IMAGES.effects; break;
        case 'menu-owner': imageUrl = IMAGES.owner; break;
        case 'menu-settings': imageUrl = IMAGES.settings; break;
        case 'menu-tools': imageUrl = IMAGES.tools; break;
        case 'menu-fun': imageUrl = IMAGES.fun; break;
        case 'menu-automation': imageUrl = IMAGES.automation; break;
        default: imageUrl = IMAGES.main;
    }

    await sock.sendMessage(chatId, {
        image: { url: imageUrl },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });

    return true;
};

// --------------------------------------------------------------
// 8. MAIN HANDLER
// --------------------------------------------------------------
const menuHandler = async (sock, chatId, m) => {
    try {
        const text = getMessageText(m).trim().toLowerCase();
        if (!text.startsWith('.menu')) return;

        const senderId = m.key.participant || m.key.remoteJid;

        // Main menu
        if (text === '.menu') {
            await sendMainMenu(sock, chatId, m, senderId);
            return;
        }

        // Submenus
        const submenuKey = text.substring(1);
        if (SUBMENUS[submenuKey]) {
            await sendSubMenu(sock, chatId, m, senderId, submenuKey);
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Submenu haipo. Tumia .menu kuona orodha.'
            }, { quoted: m });
        }
    } catch (error) {
        console.error('Menu handler error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Kuna hitilafu. Jaribu tena.'
        }, { quoted: m });
    }
};

module.exports = menuHandler;