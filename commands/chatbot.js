const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Paths za kuhifadhi data
const STATE_PATH = path.join(__dirname, '..', 'data', 'chatbot.json');
const MEMORY_PATH = path.join(__dirname, '..', 'data', 'chatbot_memory.json');

// --- HELPERS ---
function loadState() {
    try {
        if (!fs.existsSync(STATE_PATH)) return { perGroup: {}, private: false };
        const data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
        return { perGroup: {}, private: false, ...data };
    } catch (e) { return { perGroup: {}, private: false }; }
}

function saveState(state) {
    try {
        const dir = path.dirname(STATE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    } catch (e) { console.error('❌ State Save Err:', e); }
}

function loadMemory() {
    try {
        if (!fs.existsSync(MEMORY_PATH)) return {};
        const data = JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
        const now = Date.now();
        let changed = false;
        for (const id in data) {
            if (data[id].lastUpdate && (now - data[id].lastUpdate > 600000)) {
                delete data[id];
                changed = true;
            }
        }
        if (changed) saveMemory(data);
        return data;
    } catch (e) { return {}; }
}

function saveMemory(memory) {
    try {
        const dir = path.dirname(MEMORY_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
    } catch (e) { console.error('❌ Memory Save Err:', e); }
}

function extractText(m) {
    try {
        if (!m || !m.message) return '';
        const msg = m.message;
        return (msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || '').trim();
    } catch (e) { return ''; }
}

// --- MAIN CHATBOT HANDLER ---
async function handleChatbotMessage(sock, chatId, m, userText = null) {
    try {
        if (!chatId || m.key?.fromMe) return;

        const text = userText || extractText(m);
        if (!text || text.startsWith('.') || text.startsWith('!') || text.startsWith('/')) return; 

        // 🛡️ [FIX]: Kupata Jina la Mtumaji (Push Name)
        const userName = m.pushName || 'Mshkaji'; 

        const state = loadState();
        const isGroup = chatId.endsWith('@g.us');
        const enabled = isGroup ? !!state.perGroup?.[chatId]?.enabled : !!state.private;
        if (!enabled) return;

        let memory = loadMemory();
        if (!memory[chatId]) memory[chatId] = { chats: [], lastUpdate: Date.now() };

        memory[chatId].chats.push({ role: "user", content: text, name: userName });
        memory[chatId].lastUpdate = Date.now();

        if (memory[chatId].chats.length > 6) memory[chatId].chats.shift();

        const history = memory[chatId].chats
            .map(msg => `${msg.role === 'user' ? msg.name : 'Mickey'}: ${msg.content}`)
            .join("\n");

        try { await sock.sendPresenceUpdate('composing', chatId); } catch (e) {}

        // --- BORESHO LA PROMPT (IDENTITY & PERSONALIZATION) ---
        const systemPrompt = `Wewe ni MICKEY GLITCH, msaidizi mwerevu uliyetengenezwa na MICKDADI HAMZA (Quantum Code Developer).
        
        STRICT RULES:
        1. Jina la mtu unayeongea naye sasa hivi ni "${userName}". Mtaje kwa jina lake anapokusalimia au unapoona inafaa ili kuleta vibe la kishkaji.
        2. Lugha: Ongea kishkaji sana (Slang ya Tanzania). Tumia maneno kama: 'Oya ${userName}', 'Niaje mwanangu', 'Safi sana', 'Mzuka'.
        3. Identity: Wewe ni bot, sio AI ya Microsoft au OpenAI. Ukimbiwa wewe ni GPT, kataa na useme wewe ni "Mickey Glitch V3".
        4. Kama kuna ishu ngumu, mwambie "Mcheki mwanangu Mickdadi (Owner) namba 255612130873".
        5. Jibu yawe mafupi, yenye akili (Genius), na yenye michapo.`;

        const fullPrompt = `${systemPrompt}\n\nRecent Conversation:\n${history}\n\n${userName}: ${text}\nMickey:`;

        const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(fullPrompt)}`;
        const fetchRes = await fetch(apiUrl);
        const res = await fetchRes.json();

        let reply = res?.response || res?.result || res?.message || res?.data || "";

        if (!reply) return;

        // Auto-cleaner kuzuia kujitaja kama AI mgeni
        reply = reply.replace(/Microsoft|Copilot|AI Assistant|OpenAI|GPT-3|GPT-4/gi, "Mickey Glitch");

        memory[chatId].chats.push({ role: "assistant", content: reply });
        saveMemory(memory);

        await sock.sendMessage(chatId, { text: reply }, { quoted: m });

    } catch (e) { 
        console.error('❌ Chatbot Error:', e); 
    }
}

async function groupChatbotToggleCommand(sock, chatId, m, body) {
    try {
        const state = loadState();
        const args = (body || '').trim().split(/\s+/);
        const sub = args[0]?.toLowerCase();

        if (sub === 'private') {
            state.private = (args[1]?.toLowerCase() === 'on');
            saveState(state);
            return await sock.sendMessage(chatId, { text: `✅ *Private Chatbot:* ${state.private ? 'ON 🟢' : 'OFF 🔴'}` }, { quoted: m });
        }

        if (sub === 'on' || sub === 'off') {
            const isEnable = (sub === 'on');
            if (chatId.endsWith('@g.us')) {
                if (!state.perGroup) state.perGroup = {};
                state.perGroup[chatId] = { enabled: isEnable };
            } else {
                state.private = isEnable;
            }
            saveState(state);
            return await sock.sendMessage(chatId, { text: `✅ *Chatbot:* ${isEnable ? 'ON 🟢' : 'OFF 🔴'}` }, { quoted: m });
        }

        const helpMsg = `🤖 *MICKEY CHATBOT*\n\n.chatbot on/off\n.chatbot private on/off`;
        return await sock.sendMessage(chatId, { text: helpMsg }, { quoted: m });
    } catch (e) { console.error('❌ Toggle Error:', e); }
}

module.exports = { handleChatbotMessage, groupChatbotToggleCommand };
