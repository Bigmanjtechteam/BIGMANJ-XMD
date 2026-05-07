// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Auto-cleaner every 3 hours
setInterval(() => {
  fs.readdir(customTemp, (err, files) => {
    if (err) return;
    for (const file of files) {
      const filePath = path.join(customTemp, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
          fs.unlink(filePath, () => {});
        }
      });
    }
  });
  console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const isBanned = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { loadButtonHandlers, executeButtonHandler, getButtonId, isCommandId, extractCommand, isButtonResponse, autoDetectButtonCommand } = require('./lib/buttonLoader');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');
const { autoBioCommand } = require('./commands/autobio');

// Command imports
const tagAllCommand = require('./commands/tagall');
const banCommand = require('./commands/ban');
const addCommand = require('./commands/add');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand, groupMentionToggleCommand } = require('./commands/mention');
const { handleAntiStatusMention, groupAntiStatusToggleCommand } = require('./commands/antistatusmention');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const weatherCommand = require('./commands/weather');
const halotelCommand = require('./commands/halotel');
const kickCommand = require('./commands/kick');
const { complimentCommand } = require('./commands/compliment');
const { lyricsCommand } = require('./commands/lyrics');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const takeCommand = require('./commands/take');
const characterCommand = require('./commands/character');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { statusForwardCommand, handleStatusForward } = require('./commands/statusforward');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const aiCommand = require('./commands/ai');
const aiVoiceCommand = require('./commands/ai');
const { handleChatbotMessage, groupChatbotToggleCommand } = require('./commands/chatbot');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const checkUpdatesCommand = require('./commands/checkupdates');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pinCommand, verifyPinCommand, checkPinVerification } = require('./commands/pin');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const getLinkCommand = require('./commands/getlink');
const getPpCommand = require('./commands/getpp');
const { logGhostActivity, ghostCommand } = require('./commands/ghost');
const menuCommand = require('./commands/menu');
const repoCommand = require('./commands/repo');
const reportCommand = require('./commands/report');
const shazamCommand = require('./commands/shazam');
const stickerAltCommand = require('./commands/sticker-alt');
const wastedCommand = require('./commands/wasted');
const newgroupCommand = require('./commands/newgroup');
const gdriveCommand = require('./commands/gdrive');
const getcodeCommand = require('./commands/getcode');

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/0029Vb6B9xFCxoAseuG1g610";
global.ytch = "MICKEY";

// ────────────────────────────────────────────────
// Initialize Button Handlers
let buttonHandlersMap = {};
async function initializeButtonHandlers() {
    buttonHandlersMap = await loadButtonHandlers();
    console.log(`\n✅ Button handlers initialized successfully\n`);
}
initializeButtonHandlers().catch(err => console.error('Error initializing button handlers:', err));

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        const msgKeys = Object.keys(message.message).filter(k => message.message[k] !== undefined);
        
        // 🛡️ [FIX]: Automatic participant/sender detection
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid || (sock.user && sock.user.id);
        
        if (!senderId) return; // Prevent "participant undefined" crash

        await handleAutoread(sock, message);

        if (message.message) {
            storeMessage(sock, message);
        }

        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        let userMessage = '';

        if (isButtonResponse(message)) {
            const buttonCommand = autoDetectButtonCommand(message);
            if (buttonCommand) {
                userMessage = buttonCommand;
            } else {
                const buttonId = getButtonId(message);
                try {
                    const handled = await executeButtonHandler(buttonId, sock, chatId, message, buttonHandlersMap);
                    if (handled) return;
                } catch (e) {
                    console.error(`❌ [AutoButton] Error:`, e);
                }
                return;
            }
        }

        if (!userMessage) {
            userMessage = (
                message.message?.conversation?.trim() ||
                message.message?.extendedTextMessage?.text?.trim() ||
                message.message?.imageMessage?.caption?.trim() ||
                message.message?.videoMessage?.caption?.trim() ||
                ''
            ).toLowerCase().replace(/\.\s+/g, '.').trim();
        }

        const rawText = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        );

        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {}

        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;

        if (isBanned(senderId) && !userMessage.startsWith('.unban')) return;

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            await Antilink(message, sock);
        }

        if (!isGroup && !message.key.fromMe && !senderIsOwnerOrSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    await sock.sendMessage(chatId, { text: pmState.message || 'Private messages are blocked.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        // --- Chatbot Logic ---
        if (!userMessage.startsWith('.')) {
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);
                if (typeof handleAntiStatusMention === 'function') await handleAntiStatusMention(sock, chatId, message);
            }

            try {
                if (typeof handleChatbotMessage === 'function') {
                    const garbage = ['changed the profile picture', 'joined using', 'added you', 'this message was deleted'];
                    const isGarbage = garbage.some(g => rawText.toLowerCase().includes(g));

                    if (!isGarbage && rawText.length > 0) {
                        await handleChatbotMessage(sock, chatId, message, rawText);
                    }
                }
            } catch (e) { }
            return;
        }

        if (!isPublic && !isOwnerOrSudoCheck) return;

        const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.antitag', '.setgdesc', '.setgname', '.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        const ownerCommands = ['.mode', '.autostatus', '.statusforward', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.' }, { quoted: message });
                return;
            }

            if (['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote'].some(c => userMessage.startsWith(c))) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.' }, { quoted: message });
                    return;
                }
            }
        }

        if (isOwnerCommand && !isOwnerOrSudoCheck) {
            await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
            return;
        }

        let commandExecuted = false;
        const allowWithoutPin = userMessage.startsWith('.pin');
        if (!allowWithoutPin) {
            const pinVerified = await checkPinVerification(senderId);
            if (!pinVerified) {
                await sock.sendMessage(chatId, { text: `🔐 *PIN REQUIRED*\n📌 Command: .pin <pincode>` }, { quoted: message });
                return;
            }
        }

        switch (true) {
            case userMessage.startsWith('.add'):
                await addCommand(sock, chatId, senderId, userMessage.trim().split(/\s+/).slice(1).join(' ').trim(), message);
                break;
            case userMessage.startsWith('.kick'):
                await kickCommand(sock, chatId, senderId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                break;
            case userMessage.startsWith('.mute'):
                {
                    const muteDuration = parseInt(userMessage.split(/\s+/)[1], 10);
                    await muteCommand(sock, chatId, senderId, message, isNaN(muteDuration) ? undefined : muteDuration);
                }
                break;
            case userMessage === '.unmute':
                await unmuteCommand(sock, chatId, senderId);
                break;
            case userMessage.startsWith('.ban'):
                await banCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.unban'):
                await unbanCommand(sock, chatId, message);
                break;
            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                break;
            case userMessage === '.getlink' || userMessage === '.link':
                await getLinkCommand(sock, chatId, message);
                break;
            case userMessage === '.getpp' || userMessage === '.pp':
                await getPpCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.pin'):
                {
                    const pinArgs = userMessage.split(' ').slice(1);
                    if (pinArgs[0] && /^\d+$/.test(pinArgs[0])) await verifyPinCommand(sock, chatId, message, pinArgs[0]);
                    else await pinCommand(sock, chatId, message, pinArgs);
                }
                commandExecuted = true;
                break;
            case userMessage === '.menu':
                await menuCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.sticker' || userMessage === '.s':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.sticker-alt' || userMessage === '.stalt':
                await stickerAltCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.warn'):
                await warnCommand(sock, chatId, senderId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                break;
            case userMessage.startsWith('.warnings'):
                await warningsCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || []);
                break;
            case userMessage.startsWith('.tts'):
                await ttsCommand(sock, chatId, userMessage.slice(4).trim(), message);
                break;
            case userMessage.startsWith('.delete') || userMessage.startsWith('.del'):
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.settings':
                await settingsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mode'):
                {
                    const action = userMessage.split(' ')[1]?.toLowerCase();
                    let data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                    if (!action) {
                        await sock.sendMessage(chatId, { text: `Current mode: *${data.isPublic ? 'public' : 'private'}*` });
                    } else if (action === 'public' || action === 'private') {
                        data.isPublic = action === 'public';
                        fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
                        await sock.sendMessage(chatId, { text: `Bot is now *${action}*` });
                    }
                }
                break;
            case userMessage.startsWith('.anticall'):
                await anticallCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case userMessage.startsWith('.pmblocker'):
                await pmblockerCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                commandExecuted = true;
                break;
            case userMessage.startsWith('.chatbot'):
                await groupChatbotToggleCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case userMessage === '.owner':
                await ownerCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.repo'):
                await repoCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.tagall'):
                await tagAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.hidetag'):
                await hideTagCommand(sock, chatId, senderId, rawText.slice(8).trim(), message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null, message);
                break;
            case userMessage.startsWith('.tag'):
                await tagCommand(sock, chatId, senderId, rawText.slice(4).trim(), message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null, message);
                break;
            case userMessage.startsWith('.antilink'):
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case userMessage.startsWith('.antitag'):
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case userMessage.startsWith('.weather'):
                await weatherCommand(sock, chatId, message, userMessage.slice(9).trim());
                break;
            case userMessage.startsWith('.halotel'):
                await halotelCommand(sock, chatId, message, userMessage);
                break;
            case userMessage.startsWith('.lyrics'):
                await lyricsCommand(sock, chatId, userMessage.split(' ').slice(1).join(' '), message);
                break;
            case userMessage === '.clear':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case userMessage.startsWith('.promote'):
                await promoteCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                break;
            case userMessage.startsWith('.demote'):
                await demoteCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                break;
            case userMessage === '.alive':
                await aliveCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autobio'):
                await autoBioCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case userMessage.startsWith('.antibadword'):
                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith('.take') || userMessage.startsWith('.steal'):
                await takeCommand(sock, chatId, message, rawText.slice(userMessage.startsWith('.steal') ? 6 : 5).trim().split(' '));
                break;
            case userMessage === '.staff':
                await staffCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.url'):
                await urlCommand(sock, chatId, message);
                break;
            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case userMessage === '.clearsession':
                await clearSessionCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autostatus'):
                await autoStatusCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith('.statusforward'):
                await statusForwardCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith('.antidelete'):
                await handleAntideleteCommand(sock, chatId, message, userMessage.slice(11).trim());
                break;
            case userMessage === '.cleartmp': // 🛡️ [FIX]: Syntax error fixed (removed excess parenthesis)
                await clearTmpCommand(sock, chatId, message);
                break;
            case userMessage === '.setpp':
                await setProfilePicture(sock, chatId, message);
                break;
            case userMessage.startsWith('.setgdesc'):
                await setGroupDescription(sock, chatId, senderId, rawText.slice(9).trim(), message);
                break;
            case userMessage.startsWith('.instagram') || userMessage.startsWith('.ig'):
                await instagramCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.play') || userMessage.startsWith('.song'):
                await playCommand(sock, chatId, message, userMessage);
                break;
            case userMessage.startsWith('.video'):
                await videoCommand(sock, chatId, message, userMessage);
                break;
            case userMessage.startsWith('.gpt') || userMessage.startsWith('.gemini'):
                await aiCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.translate'):
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(10));
                break;
            case userMessage.startsWith('.autoreact'):
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith('.imagine'):
                await imagineCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autotyping'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.autoread'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.update'):
                await updateCommand(sock, chatId, message, rawText.trim().split(/\s+/)[1] || '');
                commandExecuted = true;
                break;
            default:
                commandExecuted = false;
                break;
        }

        if (commandExecuted) await showTypingAfterCommand(sock, chatId);
        if (userMessage.startsWith('.')) await addCommandReaction(sock, message);

    } catch (error) {
        // 🛡️ [AUTO-FIX]: Log error but don't stop the bot
        console.error('❌ MICKEY ERROR PROTECTOR:', error.message);
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;
        if (!id.endsWith('@g.us')) return;
        let mode = JSON.parse(fs.readFileSync('./data/messageCount.json'));
        if (!mode.isPublic) return;

        if (action === 'promote') await handlePromotionEvent(sock, id, participants, author);
        if (action === 'demote') await handleDemotionEvent(sock, id, participants, author);
    } catch (e) { console.error('❌ Group Update Error:', e.message); }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        try {
            const sender = status.key.participant || status.key.remoteJid || (sock.user && sock.user.id);
            await handleStatusUpdate(sock, status, sender); 
            await handleStatusForward(sock, status);
        } catch (e) { console.error('❌ Status Error:', e.message); }
    }
};
