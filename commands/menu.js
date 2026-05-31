const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
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
    const hour = moment().hour();
    if (hour >= 5 && hour < 12) return 'Habari za Asubuhi ☀️';
    if (hour >= 12 && hour < 18) return 'Habari za Mchana 🌤️';
    return 'Habari za Jioni 🌙';
};
const getMentionNumber = (jid) => jid.split('@')[0];
// --------------------------------------------------------------
// 2. IMAGES ZA KILA SUBMENU (replace na URLs zako)
// --------------------------------------------------------------
const IMAGES = {
    main: 'https://i.ibb.co/cX8ysKLT/RD32363337313436343437363340732e77686174736170702e6e6574-554891.jpg', // Dog Crasher
    general: 'https://picsum.photos/id/20/800/400', // Premium Blue
    group: 'https://picsum.photos/id/104/800/400', // Group Manager
    security: 'https://picsum.photos/id/0/800/400', // Cyber Security
    download: 'https://picsum.photos/id/29/800/400', // Neon Download
    fun: 'https://picsum.photos/id/169/800/400', // Anime Fun
    effects: 'https://picsum.photos/id/96/800/400', // Purple Effects
    ai: 'https://picsum.photos/id/119/800/400', // Future AI
    owner: 'https://picsum.photos/id/104/800/400' // Gold King
};
// --------------------------------------------------------------
// 3. SUBMENU COMMANDS (kama ulivyotolea mfano)
// --------------------------------------------------------------
const SUBMENUS = {
    'menu-general': {
        title: '📂 GENERAL MENU',
        commands: ['.help', '.ping', '.alive', '.owner', '.repo', '.stats', '.settings', '.checkupdates']
    },
    'menu-group': {
        title: '👥 GROUP MENU',
        commands: ['.add', '.kick', '.promote', '.demote', '.tagall', '.tagnotadmin', '.hidetag', '.tag', '.mention', '.setmention', '.setgname', '.setgdesc', '.setgpp']
    },
    'menu-security': {
        title: '🛡️ SECURITY MENU',
        commands: ['.antibot', '.antilink', '.antimention', '.antimentionstatus', '.antibadword', '.anticall', '.pmblocker', '.antitag', '.ban', '.unban', '.resetlink']
    },
    'menu-download': {
        title: '📥 DOWNLOAD MENU',
        commands: ['.play', '.video', '.music', '.facebook', '.instagram', '.igs', '.igsc', '.tiktok', '.gdrive', '.url']
    },
    'menu-fun': {
        title: '🎮 FUN MENU',
        commands: ['.truth', '.dare', '.joke', '.compliment', '.lyrics', '.character', '.weather', '.report', '.wasted', '.mickey']
    },
    'menu-effects': {
        title: '✨ EFFECTS MENU',
        commands: ['.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink', '.glitch', '.fire']
    },
    'menu-ai': {
        title: '🤖 AI MENU',
        commands: ['.gpt', '.aivoice', '.imagine', '.ghost', '.getcode', '.getlink']
    },
    'menu-owner': {
        title: '👑 OWNER MENU',
        commands: ['.sudo', '.update', '.newgroup', '.autostatus', '.autotyping', '.autoread', '.areact']
    }
};
// --------------------------------------------------------------
// 4. SEND MAIN MENU (muundo mpya uliotaka)
// --------------------------------------------------------------
const sendMainMenu = async (sock, chatId, m, senderId) => {
    moment.tz.setDefault('Africa/Dar_es_Salaam');
    const now = moment();
    const greeting = getGreeting();
    const mentionNumber = getMentionNumber(senderId);
    const userName = m.pushName || 'User';
    const runtime = formatUptime(process.uptime());
    const date = now.format('DD/MM/YYYY');
    const time = now.format('HH:mm:ss');
    // Caption kwa mujibu wa maelezo yako
    let caption = '';
    caption += `✨ ΥΟ!!, @${mentionNumber}\n\n`;
    caption += `🤖 Τhis is ΒΙGMANj ΒΟΤ, a WhatsApp Automation Tool developed in collaboration with Ωuantum Βase Developer.\n\n`;
    caption += `🌵 Group Management\n`;
    caption += `🛡️ Security System\n`;
    caption += `🤖 AI Features\n`;
    caption += `📥 Download System\n`;
    caption += `✨ Effects & Logo Maker\n`;
    caption += `👑 Owner Controls\n\n`;
    caption += `🚀 ΒΙGMANj ΒΟΤ — Fast, Powerful & Reliable\n\n`;
    caption += `📅 ${date} | ⏰ ${time} | ⏱️ Uptime: ${runtime}\n\n`;
    caption += `> bigmanj tech™`;
    await sock.sendMessage(chatId, { image: { url: IMAGES.main }, caption: caption, mentions: [senderId] }, { quoted: m });

    // ----------------------------------------------------------
    // Tuma AUDIO – MAIN MENU pekee - Imebadilishwa kutumia URL
    // ----------------------------------------------------------
    setTimeout(async () => {
        try {
            await sock.sendMessage(chatId, {
                audio: { url: 'https://files.catbox.moe/0mn7pe.mp3' },
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });
        } catch (err) {
            console.error('Audio error:', err.message);
        }
    }, 2000);
};
// --------------------------------------------------------------
// 5. SEND SUBMENU (kila moja ina picha yake)
// --------------------------------------------------------------
const sendSubMenu = async (sock, chatId, m, senderId, menuKey) => {
    const menu = SUBMENUS[menuKey];
    if (!menu) return false;
    const greeting = getGreeting();
    const mentionNumber = getMentionNumber(senderId);
    let caption = '';
    caption += `👋 ${greeting} @${mentionNumber}\n\n`;
    caption += `${menu.title}\n`;
    caption += '━━━━━━━━━━━━━━━━━━━━━━\n';
    for (const cmd of menu.commands) {
        caption += `• ${cmd}\n`;
    }
    caption += '\n> bigmanj tech™';
    // Chagua picha kulingana na submenu
    let imageUrl = IMAGES.main;
    switch (menuKey) {
        case 'menu-general': imageUrl = IMAGES.general; break;
        case 'menu-group': imageUrl = IMAGES.group; break;
        case 'menu-security': imageUrl = IMAGES.security; break;
        case 'menu-download': imageUrl = IMAGES.download; break;
        case 'menu-fun': imageUrl = IMAGES.fun; break;
        case 'menu-effects': imageUrl = IMAGES.effects; break;
        case 'menu-ai': imageUrl = IMAGES.ai; break;
        case 'menu-owner': imageUrl = IMAGES.owner; break;
    }
    await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: caption, mentions: [senderId] }, { quoted: m });
    return true;
};
// --------------------------------------------------------------
// 6. MAIN HANDLER – INAJIBU.menu NA.menu-*
// --------------------------------------------------------------
const menuHandler = async (sock, chatId, m) => {
    try {
        const text = getMessageText(m).trim().toLowerCase();
        if (!text.startsWith('.menu')) return;
        const senderId = m.key.participant || m.key.remoteJid;
        // MAIN MENU
        if (text === '.menu') {
            await sendMainMenu(sock, chatId, m, senderId);
            return;
        }
        // SUBMENUS
        const submenuKey = text.substring(1); // remove dot
        if (SUBMENUS[submenuKey]) {
            await sendSubMenu(sock, chatId, m, senderId, submenuKey);
        } else {
            // Ikiwa command si.menu wala submenu inayojulikana
            await sock.sendMessage(chatId, { text: '❌ Submenu haipo. Tumia.menu kuona orodha.' }, { quoted: m });
        }
    } catch (error) {
        console.error('Menu handler error:', error);
        await sock.sendMessage(chatId, { text: '❌ Kuna hitilafu. Jaribu tena.' }, { quoted: m });
    }
};
module.exports = menuHandler;