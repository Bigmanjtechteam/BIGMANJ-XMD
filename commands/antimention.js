const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const DATA_PATH = path.join(__dirname, '../data/antimention.json');

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

// Get protected numbers from settings.js (owner + sudo)
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

// Check if a string contains a phone number (Tanzanian or international format)
function containsPhoneNumber(text) {
    // Regex for phone numbers: +255... or 0... (with spaces optional)
    const phoneRegex = /(?:\+?255|0)[\s\-]?[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4,}/;
    return phoneRegex.test(text);
}

async function antimentionCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' }, { quoted: message });
        return;
    }

    const isOwnerOrSudo = require('../lib/isOwner');
    const isAuthorized = await isOwnerOrSudo(senderId, sock, chatId);
    if (!isAuthorized && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antimention.' }, { quoted: message });
        return;
    }

    const data = loadData();
    if (!data.groups[chatId]) data.groups[chatId] = { enabled: false };

    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
        data.groups[chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: '🛡️ *Anti‑mention IMEWASHWA* – ujumbe unaomention owner/sudo au namba za simu utafutwa.' }, { quoted: message });
    } else if (sub === 'off') {
        data.groups[chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: '🔓 *Anti‑mention IMEZIMWA*' }, { quoted: message });
    } else {
        const status = data.groups[chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑mention*\nHali: ${status}\n\nMatumizi: .antimention on/off` }, { quoted: message });
    }
}

// Function to check and delete mentions (called from main handler)
async function handleMentionCheck(sock, chatId, message) {
    const data = loadData();
    if (!data.groups[chatId] || !data.groups[chatId].enabled) return;

    // 1. Check for mentioned owner/sudo numbers
    const protectedJids = getProtectedNumbers();
    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const mentionsViolation = protectedJids.some(jid => mentionedJids.includes(jid));

    // 2. Check message text for any phone number pattern
    let messageText = '';
    if (message.message?.conversation) messageText = message.message.conversation;
    else if (message.message?.extendedTextMessage?.text) messageText = message.message.extendedTextMessage.text;
    else if (message.message?.imageMessage?.caption) messageText = message.message.imageMessage.caption;
    else if (message.message?.videoMessage?.caption) messageText = message.message.videoMessage.caption;
    
    const phoneViolation = containsPhoneNumber(messageText);

    if (mentionsViolation || phoneViolation) {
        // Delete the offending message
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch (err) {
            console.error('Failed to delete message:', err);
        }
        // Optional warning
        await sock.sendMessage(chatId, { text: `⚠️ *Anti‑mention*\nUjumbe wako umeondolewa kwa sababu ulijumuisha namba ya simu au kumtag mtu aliyelindwa.` });
    }
}

module.exports = { antimentionCommand, handleMentionCheck };