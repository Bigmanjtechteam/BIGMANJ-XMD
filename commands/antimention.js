const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const DATA_PATH = path.join(__dirname, '../data/antimention.json');
const FOOTER = '\n\n> bigmanj tech';

function loadData() {
    try {
        if (!fs.existsSync(DATA_PATH)) return { groups: {}, broadcast: {} };
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch {
        return { groups: {}, broadcast: {} };
    }
}

function saveData(data) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Check for any mention pattern (including @everyone, @numbers, @names)
function hasAnyMention(text) {
    if (!text) return false;
    // Matches @username, @everyone, @+255..., @123456
    const mentionRegex = /@[\w\d\-\+]+/i;
    return mentionRegex.test(text);
}

// Get protected numbers from settings (owner + sudo)
function getProtectedJids() {
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
    // Check owner/sudo
    if (protectedJids.includes(jid)) return true;
    // Check group admins
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participant = groupMetadata.participants.find(p => p.id === jid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (err) {
        return false;
    }
}

async function antimentionCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const isBroadcast = chatId === 'status@broadcast';
    
    if (!isGroup && !isBroadcast) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group au broadcast pekee.' + FOOTER, quoted: message });
        return;
    }

    const isOwnerOrSudo = require('../lib/isOwner');
    const isAuthorized = await isOwnerOrSudo(senderId, sock, chatId);
    if (!isAuthorized && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antimention.' + FOOTER, quoted: message });
        return;
    }

    const data = loadData();
    const target = isBroadcast ? 'broadcast' : 'groups';
    if (!data[target][chatId]) data[target][chatId] = { enabled: false };
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
        data[target][chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑mention IMEWASHWA* – ujumbe wowote wenye mention (isipokuwa admin/owner/sudo) utafutwa kwenye ${isBroadcast ? 'broadcast' : 'group'}.` + FOOTER, quoted: message });
    } else if (sub === 'off') {
        data[target][chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🔓 *Anti‑mention IMEZIMWA* kwenye ${isBroadcast ? 'broadcast' : 'group'}.` + FOOTER, quoted: message });
    } else {
        const status = data[target][chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑mention*\nHali: ${status}\n\nMatumizi: .antimention on/off` + FOOTER, quoted: message });
    }
}

// Main check for normal messages (groups, broadcasts, private)
async function handleMentionCheck(sock, chatId, message) {
    // Skip if not group or broadcast
    const isGroup = chatId.endsWith('@g.us');
    const isBroadcast = chatId === 'status@broadcast';
    if (!isGroup && !isBroadcast) return;

    const data = loadData();
    const target = isBroadcast ? 'broadcast' : 'groups';
    if (!data[target][chatId] || !data[target][chatId].enabled) return;

    // Extract message text
    let messageText = '';
    if (message.message?.conversation) messageText = message.message.conversation;
    else if (message.message?.extendedTextMessage?.text) messageText = message.message.extendedTextMessage.text;
    else if (message.message?.imageMessage?.caption) messageText = message.message.imageMessage.caption;
    else if (message.message?.videoMessage?.caption) messageText = message.message.videoMessage.caption;

    // Check if message has any mention pattern in the text
    if (hasAnyMention(messageText)) {
        // Also check mentioned JIDs explicitly
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJids.length === 0 && !hasAnyMention(messageText)) return;

        // If there are explicit mentioned JIDs, check if all are protected (admin/owner/sudo)
        let allProtected = true;
        const protectedJids = getProtectedJids();
        
        for (const jid of mentionedJids) {
            const isProtected = await isProtectedUser(sock, chatId, jid, protectedJids);
            if (!isProtected) {
                allProtected = false;
                break;
            }
        }

        // If any mentioned user is NOT protected, delete the message
        if (!allProtected || (mentionedJids.length === 0 && hasAnyMention(messageText))) {
            try {
                await sock.sendMessage(chatId, { delete: message.key });
            } catch (err) {
                console.error('Failed to delete mention message:', err);
            }
            const warning = `⚠️ *Anti‑mention*\nUjumbe wako umeondolewa kwa sababu ulijumuisha mention ya mtu asiye admin/owner/sudo (au mention ya jina/kilicho sawa).` + FOOTER;
            await sock.sendMessage(chatId, { text: warning });
        }
    }
}

// Function for status updates (also checks mentions)
async function handleStatusMentionCheck(sock, messageUpdate) {
    try {
        if (!sock || !messageUpdate?.messages) return;
        
        const data = loadData();
        const broadcastEnabled = data.broadcast?.['status@broadcast']?.enabled || false;
        if (!broadcastEnabled) return;

        for (const m of messageUpdate.messages || []) {
            if (m.key?.remoteJid !== 'status@broadcast') continue;

            let statusText = '';
            if (m.message?.conversation) statusText = m.message.conversation;
            else if (m.message?.extendedTextMessage?.text) statusText = m.message.extendedTextMessage.text;
            else if (m.message?.imageMessage?.caption) statusText = m.message.imageMessage.caption;
            else if (m.message?.videoMessage?.caption) statusText = m.message.videoMessage.caption;

            if (hasAnyMention(statusText)) {
                try {
                    await sock.sendMessage('status@broadcast', { delete: m.key });
                    console.log(`Deleted status with mention: ${statusText}`);
                } catch (e) {
                    console.error('Failed to delete status:', e.message);
                }
            }
        }
    } catch (e) {
        console.error('Status mention handler error:', e);
    }
}

// For backward compatibility with main.js
function isTextViolating(text) {
    return hasAnyMention(text);
}

module.exports = { 
    antimentionCommand, 
    handleMentionCheck, 
    handleStatusMentionCheck,
    isTextViolating 
};