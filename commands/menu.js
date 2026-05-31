const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const { sendInteractiveMessage } = require('gifted-btns');

/**
 * @project: 𝗕𝗜𝗚𝗠𝗔𝗡𝗝 V3.0.5
 * @author: Quantum Base Developer (TZ)
 * @description: Enhanced Menu with greeting, mention, dog image and footer > bigmanj tech™
 */

const menuCommand = async (sock, chatId, m) => {
    try {
        // Set timezone to Tanzania
        moment.tz.setDefault('Africa/Dar_es_Salaam');
        const now = moment();
        const hour = now.hour();
        let greeting;
        if (hour >= 5 && hour < 12) greeting = 'Habari za Asubuhi ☀️';
        else if (hour >= 12 && hour < 18) greeting = 'Habari za Mchana 🌤️';
        else greeting = 'Habari za Jioni 🌙';

        const botName = '𝗕𝗜𝗚𝗠𝗔𝗡𝗝•𝗗𝗧';
        const userName = m.pushName || 'User';
        const senderId = m.key.participant || m.key.remoteJid;

        // Helper: format uptime
        function formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            if (days > 0) return `${days}d ${hours}h ${minutes}m`;
            if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
            if (minutes > 0) return `${minutes}m ${secs}s`;
            return `${secs}s`;
        }

        // Banner and greeting with mention
        const topText = 
            `🩸━━━━━━━━━━━━━━━━━━🩸
      DOG CRASHER
         🐺
      BIGMANJ BOT
🩸━━━━━━━━━━━━━━━━━━🩸

👋 ${greeting} @${userName}

👑 Owner      : BIGMANJ
⚡ Commands   : Auto Count
🚀 Runtime    : ${formatUptime(process.uptime())}
📅 Date       : ${now.format('DD/MM/YYYY')}
⏰ Time       : ${now.format('HH:mm:ss')}

🩸 FEAR THE CRASHER 🩸
> bigmanj tech™

👇 *Chagua kundi la amri hapo chini:*`;

        // Command categories (unchanged)
        const MENU_CATEGORIES = [
            {
                title: 'GENERAL',
                items: [
                    { command: '.help', description: 'Show the full command menu' },
                    { command: '.ping', description: 'Check bot speed and uptime' },
                    { command: '.alive', description: 'Check if the bot is online' },
                    { command: '.owner', description: 'Show bot owner contact' },
                    { command: '.repo', description: 'Show bot repository info' },
                    { command: '.stats', description: 'Show bot statistics' },
                    { command: '.settings', description: 'Open bot settings' },
                    { command: '.checkupdates', description: 'Check for bot updates' }
                ]
            },
            {
                title: 'GROUP',
                items: [
                    { command: '.add', description: 'Add a user to this group' },
                    { command: '.kick', description: 'Remove a user from the group' },
                    { command: '.promote', description: 'Promote a member to admin' },
                    { command: '.demote', description: 'Demote a group admin' },
                    { command: '.tagall', description: 'Mention all group members' },
                    { command: '.tagnotadmin', description: 'Mention members who are not admins' },
                    { command: '.hidetag', description: 'Send an invisible mention message' },
                    { command: '.tag', description: 'Tag a specific user' },
                    { command: '.mention', description: 'Mention users in this chat' },
                    { command: '.setmention', description: 'Set mention mode for group' },
                    { command: '.setgname', description: 'Change group name' },
                    { command: '.setgdesc', description: 'Change group description' },
                    { command: '.setgpp', description: 'Set group profile picture' }
                ]
            },
            {
                title: 'MODERATION',
                items: [
                    { command: '.ban', description: 'Ban a user from using the bot' },
                    { command: '.unban', description: 'Unban a user' },
                    { command: '.antibadword', description: 'Block bad language automatically' },
                    { command: '.antilink', description: 'Block links in group automatically' },
                    { command: '.antitag', description: 'Block unwanted tags automatically' },
                    { command: '.pmblocker', description: 'Block private messages automatically' },
                    { command: '.anticall', description: 'Block unwanted calls automatically' },
                    { command: '.resetlink', description: 'Revoke and reset group invite link' },
                    { command: '.staff', description: 'Show group admins / staff list' }
                ]
            },
            {
                title: 'MEDIA',
                items: [
                    { command: '.sticker', description: '.sticker' },
                    { command: '.stickeralt', description: 'Create alternate sticker format' },
                    { command: '.stickertelegram', description: 'Create Telegram-style sticker' },
                    { command: '.setpp', description: 'Set your profile picture' },
                    { command: '.pp', description: 'Get your own profile picture' },
                    { command: '.img-blur', description: 'Blur an image' },
                    { command: '.facebook', description: 'Download Facebook media' },
                    { command: '.instagram', description: 'Download Instagram post' },
                    { command: '.igs', description: 'Download Instagram story' },
                    { command: '.igsc', description: 'Download Instagram story' },
                    { command: '.tiktok', description: 'Download TikTok video' },
                    { command: '.shazam', description: 'Identify music by sound' }
                ]
            },
            {
                title: 'AUDIO / VIDEO',
                items: [
                    { command: '.play', description: 'Download audio from YouTube' },
                    { command: '.video', description: 'Download video from YouTube' },
                    { command: '.music', description: 'Search and download music' },
                    { command: '.url', description: 'Convert link to media download' }
                ]
            },
            {
                title: 'FUN',
                items: [
                    { command: '.compliment', description: 'Send a compliment message' },
                    { command: '.lyrics', description: 'Search song lyrics' },
                    { command: '.character', description: 'Generate a character message' },
                    { command: '.wasted', description: 'Create wasted-style effect' },
                    { command: '.mickey', description: 'Show Mickey Glitch animation' },
                    { command: '.weather', description: 'Show weather information' },
                    { command: '.report', description: 'Send a report message' },
                    { command: '.halotel', description: 'Show Halotel service info' },
                    { command: '.waste', description: 'Create a waste-style effect' }
                ]
            },
            {
                title: 'AUTOMATION',
                items: [
                    { command: '.autostatus', description: 'Auto view + like status (default ON)' },
                    { command: '.autotyping', description: 'Auto typing status' },
                    { command: '.autoread', description: 'Auto read messages' },
                    { command: '.areact', description: 'Auto react to messages' }
                ]
            },
            {
                title: 'AI / BOT',
                items: [
                    { command: '.gpt', description: 'Chat with GPT' },
                    { command: '.aivoice', description: 'Create AI voice response' },
                    { command: '.imagine', description: 'Generate image from prompt' },
                    { command: '.sudo', description: 'Owner-only sudo command' },
                    { command: '.update', description: 'Update the bot code' },
                    { command: '.newgroup', description: 'Create a new group' },
                    { command: '.ghost', description: 'Use ghost command features' },
                    { command: '.gdrive', description: 'Download from Google Drive' },
                    { command: '.getcode', description: 'Get a code from a link' },
                    { command: '.getlink', description: 'Get direct download link' }
                ]
            },
            {
                title: 'EFFECTS',
                items: [
                    { command: '.metallic', description: 'Metallic image effect' },
                    { command: '.ice', description: 'Ice image effect' },
                    { command: '.snow', description: 'Snow image effect' },
                    { command: '.impressive', description: 'Impressive effect' },
                    { command: '.matrix', description: 'Matrix style effect' },
                    { command: '.light', description: 'Light glow effect' },
                    { command: '.neon', description: 'Neon effect' },
                    { command: '.devil', description: 'Devil effect' },
                    { command: '.purple', description: 'Purple effect' },
                    { command: '.thunder', description: 'Thunder effect' },
                    { command: '.leaves', description: 'Leaves effect' },
                    { command: '.1917', description: '1917 movie style effect' },
                    { command: '.arena', description: 'Arena effect' },
                    { command: '.hacker', description: 'Hacker text effect' },
                    { command: '.sand', description: 'Sand effect' },
                    { command: '.blackpink', description: 'Blackpink style effect' },
                    { command: '.glitch', description: 'Glitch text effect' },
                    { command: '.fire', description: 'Fire effect' }
                ]
            }
        ];

        const sections = MENU_CATEGORIES.map(category => ({
            title: `⭐ ${category.title}`,
            rows: category.items.map(item => ({
                header: '',
                title: item.command.toLowerCase(),
                description: item.description,
                id: item.command.toLowerCase()
            }))
        }));

        // Send interactive message with your dog image
        await sendInteractiveMessage(sock, chatId, {
            text: topText,
            mentions: [senderId],
            contextInfo: {
                externalAdReply: {
                    title: "𝘿𝙊𝙂 𝘾𝙍𝘼𝙎𝙃𝙀𝙍 | 𝘽𝙄𝙂𝙈𝘼𝙉𝙅",
                    body: "𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗕𝗜𝗚𝗠𝗔𝗡𝗝 𝗧𝗘𝗖𝗛",
                    thumbnailUrl: 'https://i.ibb.co/cX8ysKLT/RD32363337313436343437363340732e77686174736170702e6e6574-554891.jpg',
                    sourceUrl: 'https://whatsapp.com/channel/0029Vb6B9xFCxoAseuG1g610',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            },
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📋 FUNGUA MENU',
                        sections: sections
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'PING BOT ⚡',
                        id: '.ping'
                    })
                }
            ]
        });

    } catch (e) {
        console.error('Menu Cmd Error:', e);
        await sock.sendMessage(chatId, { 
            text: '❌ *Hitilafu imetokea wakati wa kuandaa Menu.*' 
        }, { quoted: m });
    }
};

module.exports = menuCommand;