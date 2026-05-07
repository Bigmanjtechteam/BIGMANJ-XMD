const fs = require('fs/promises');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const CONFIG_FILE = path.join(__dirname, '../data/autoStatus.json');

// DEFAULT IPO ON (Anti-Delete pekee)
const DEFAULT_CONFIG = Object.freeze({
    enabled: true,
    antiDeleteEnabled: true, 
});

let configCache = null;
const processedStatusIds = new Set();

// Memory ya muda kuhifadhi status ili kama ikifutwa tuipate
const statusMemory = new Map();

async function loadConfig() {
    if (configCache) return configCache;
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        configCache = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch (err) {
        configCache = { ...DEFAULT_CONFIG };
        await saveConfig(configCache);
    }
    return configCache;
}

async function saveConfig(updates) {
    configCache = { ...configCache, ...updates };
    try {
        await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
        await fs.writeFile(CONFIG_FILE, JSON.stringify(configCache, null, 2), 'utf8');
    } catch (err) {
        console.error('[AntiDelete] Save failed:', err.message);
    }
}

// ────────────────────────────────────────────────
// MAIN LOGIC: ANTI-DELETE (Nasa zilizofutwa tu)
async function handleAntiDelete(sock, m) {
    const cfg = await loadConfig();
    if (!cfg.enabled || !cfg.antiDeleteEnabled) return;

    // Check kama ni message ya kufuta (Delete for everyone)
    if (m.message?.protocolMessage?.type === 0) {
        const deletedId = m.message.protocolMessage.key.id;
        const oldMsg = statusMemory.get(deletedId);

        // Hakikisha ilikuwa ni status
        if (oldMsg && oldMsg.key.remoteJid === 'status@broadcast') {
            const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const sender = oldMsg.key.participant || oldMsg.participant;
            const senderNum = sender.split('@')[0];

            console.log(`\x1b[31m🚫 [ANTI-DELETE]: Status kutoka kwa ${senderNum} imefutwa! Inatuma inbox...\x1b[0m`);

            await sock.sendMessage(ownerJid, { 
                text: `🚫 *ANTI-DELETE STATUS DETECTED!*\n\n👤 *Mtumaji:* @${senderNum}\n⚠️ *Mshkaji amefuta hii status sasa hivi.*`,
                mentions: [sender]
            });

            // Forward ile status iliyofutwa kwenda inbox ya owner (Mickdadi)
            await sock.copyNForward(ownerJid, oldMsg, true).catch(e => {
                console.error('❌ Kushindwa kufoward status iliyofutwa:', e.message);
            });
            
            statusMemory.delete(deletedId);
        }
    }
}

// ────────────────────────────────────────────────
async function handleStatusUpdate(sock, ev) {
    const cfg = await loadConfig();
    if (!cfg.enabled) return;

    const msg = ev.messages?.[0];
    if (!msg) return;

    // Kila message inayokuja inapita hapa ku-check kama ni amri ya kufuta
    await handleAntiDelete(sock, msg);

    // Kama message ni status mpya, ihifadhi kwenye memory kwa muda
    if (msg.key.remoteJid === 'status@broadcast') {
        const statusKey = msg.key;
        if (!statusKey.id || processedStatusIds.has(statusKey.id)) return;
        
        processedStatusIds.add(statusKey.id);

        // Hifadhi kwenye memory kwa saa 24 (Status life span)
        statusMemory.set(statusKey.id, msg);
        
        // Safisha memory baada ya muda
        setTimeout(() => {
            statusMemory.delete(statusKey.id);
            processedStatusIds.delete(statusKey.id);
        }, 24 * 60 * 60 * 1000);
    }
}

async function autoStatusCommand(sock, chatId, msg, args = []) {
    try {
        const sender = msg.key.participant || msg.key.remoteJid;
        const isAllowed = msg.key.fromMe || (await isOwnerOrSudo(sender, sock, chatId));
        if (!isAllowed) return;

        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            await saveConfig({ enabled: true, antiDeleteEnabled: true });
            return sock.sendMessage(chatId, { text: '✅ *Anti-Delete Status:* Imewashwa tayari!' });
        }

        if (sub === 'off') {
            await saveConfig({ enabled: false, antiDeleteEnabled: false });
            return sock.sendMessage(chatId, { text: '❌ *Anti-Delete Status:* Imezimwa sasa hivi.' });
        }

        const cfg = await loadConfig();

        return sock.sendMessage(chatId, {
            text: `📊 *Mickey Status Guard:*
• Anti-Delete: ${cfg.enabled ? '✅ ON' : '❌ OFF'}

*Amri:*
.autostatus on (Washa)
.autostatus off (Zima)

_Bot itanasa status zote zinazofutwa na kukutumia inbox mzee baba._`,
        });
    } catch (err) { }
}

module.exports = autoStatusCommand;
module.exports.handleStatusUpdate = handleStatusUpdate;
