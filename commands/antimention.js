const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const DATA_PATH = path.join(__dirname, '../data/antimention.json');
const FOOTER = '\n\n> bigmanj tech';

function loadData() {
    try {
        if (!fs.existsSync(DATA_PATH)) return { groups: {} };
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch {
        return { groups: {} };
    }
}

function saveData(data) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Check for "group mention" phrase (the box)
function isGroupMention(text) {
    if (!text) return false;
    const groupPhrases = /(this group was mentioned|group mentioned|@everyone|@all)/i;
    return groupPhrases.test(text);
}

// Get protected numbers from settings (owner + sudo)
function getProtectedNumbers() {
    const numbers = [];
    if (settings.ownerNumber) numbers.push(settings.ownerNumber);
    if (settings.sudoNumbers && Array.isArray(settings.sudoNumbers)) {
        numbers.push(...settings.sudoNumbers);
    }
    return numbers.map(num => {
        let clean = num.toString().replace(/\s/g, '');
        if (!clean.includes('@')) clean = `${clean}@s.whatsapp.net`;
        return clean;
    });
}

// Check if a given JID is admin, owner, or sudo
async function isProtectedUser(sock, chatId, jid, protectedJids) {
    // First check owner/sudo
    if (protectedJids.includes(jid)) return true;
    // Then check group admins
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participant = groupMetadata.participants.find(p => p.id === jid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (err) {
        console.error('Failed to check admin status:', err);
        return false;
    }
}

async function antimentionCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' + FOOTER, quoted: message });
        return;
    }

    const isOwnerOrSudo = require('../lib/isOwner');
    const isAuthorized = await isOwnerOrSudo(senderId, sock, chatId);
    if (!isAuthorized && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antimention.' + FOOTER, quoted: message });
        return;
    }

    const data = loadData();
    if (!data.groups[chatId]) data.groups[chatId] = { enabled: false };
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
        data.groups[chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: '🛡️ *Anti‑mention IMEWASHWA* – ujumbe unaomtag mtu asiye admin/owner/sudo au "group mention" utafutwa.' + FOOTER, quoted: message });
    } else if (sub === 'off') {
        data.groups[chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: '🔓 *Anti‑mention IMEZIMWA*' + FOOTER, quoted: message });
    } else {
        const status = data.groups[chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑mention*\nHali: ${status}\n\nMatumizi: .antimention on/off` + FOOTER, quoted: message });
    }
}

// Main check for normal messages
async function handleMentionCheck(sock, chatId, message) {
    const data = loadData();
    if (!data.groups[chatId] || !data.groups[chatId].enabled) return;

    // Extract message text
    let messageText = '';
    if (message.message?.conversation) messageText = message.message.conversation;
    else if (message.message?.extendedTextMessage?.text) messageText = message.message.extendedTextMessage.text;
    else if (message.message?.imageMessage?.caption) messageText = message.message.imageMessage.caption;
    else if (message.message?.videoMessage?.caption) messageText = message.message.videoMessage.caption;

    // 1. Delete if it's a "group mention" box
    if (isGroupMention(messageText)) {
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch (err) {
            console.error('Failed to delete group mention:', err);
        }
        await sock.sendMessage(chatId, { text: `⚠️ *Anti‑mention*\nUjumbe wa "group mention" (kiboksi) umeondolewa.` + FOOTER });
        return;
    }

    // 2. Check mentions (tags)
    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentionedJids.length === 0) return;

    const protectedJids = getProtectedNumbers();
    let shouldDelete = false;

    for (const jid of mentionedJids) {
        const isProtected = await isProtectedUser(sock, chatId, jid, protectedJids);
        if (!isProtected) {
            // This mention is of a normal member (not admin/owner/sudo)
            shouldDelete = true;
            break;
        }
    }

    if (shouldDelete) {
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch (err) {
            console.error('Failed to delete message with non‑admin tag:', err);
        }
        await sock.sendMessage(chatId, { text: `⚠️ *Anti‑mention*\nUjumbe wako umeondolewa kwa sababu ulimtag mtu asiye admin/owner/sudo.` + FOOTER });
    }
}

// Reusable function for status updates (only checks group mention phrase)
function isTextViolating(text) {
    return isGroupMention(text);
}

module.exports = { antimentionCommand, handleMentionCheck, isTextViolating };