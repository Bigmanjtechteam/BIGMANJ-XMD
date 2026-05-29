const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const Tesseract = require('tesseract.js');
const { OpenAI } = require('openai');
require('dotenv').config();

// ------------------------------
//  MAELEKEZO YA API NA DATA
// ------------------------------
const STATE_PATH = path.join(__dirname, '..', 'data', 'chatbot.json');
const MEMORY_PATH = path.join(__dirname, '..', 'data', 'chatbot_memory.json');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// Hakikisha folder za data zipo
if (!fs.existsSync(path.dirname(STATE_PATH))) fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// OpenAI kwa transcription (Whisper)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ------------------------------
//  KUHIFADHI HALI NA KUMBUKUMBU
// ------------------------------
function loadState() {
    try {
        if (!fs.existsSync(STATE_PATH)) return { perGroup: {}, private: false };
        return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch { return { perGroup: {}, private: false }; }
}
function saveState(state) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
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
    } catch { return {}; }
}
function saveMemory(memory) {
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

// ------------------------------
//  KUPakua MEDIA KUTOKA WHATSAPP
// ------------------------------
async function downloadMedia(msg, type) {
    try {
        let mediaMsg = null;
        if (type === 'image') mediaMsg = msg.imageMessage;
        else if (type === 'voice') mediaMsg = msg.audioMessage;
        else return null;
        if (!mediaMsg) return null;
        const stream = await downloadContentFromMessage(mediaMsg, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    } catch (err) {
        console.error('Download error:', err);
        return null;
    }
}

// ------------------------------
//  OCR – SOMA MAANDISHI YA PICHA
// ------------------------------
async function readImageText(buffer) {
    try {
        const { data: { text } } = await Tesseract.recognize(buffer, 'swa+eng');
        const cleaned = text.trim();
        return cleaned || "Hakuna maandishi yaliyopatikana kwenye picha.";
    } catch (err) {
        console.error('OCR error:', err);
        return "Nimeshindwa kusoma maandishi ya picha.";
    }
}

// ------------------------------
//  NUKULI SAUTI (VOICE NOTE)
//  Inaruhusu sekunde 60–90 tu
// ------------------------------
async function transcribeVoice(buffer, durationSeconds) {
    if (durationSeconds < 60 || durationSeconds > 90) {
        return `Ujumbe wako wa sauti una sekunde ${Math.round(durationSeconds)}. Mimi ninaweza kusikiliza voice notes zenye urefu wa dakika 1 hadi 1.5 (sekunde 60-90).`;
    }
    const tempFile = path.join(TEMP_DIR, `voice_${Date.now()}.ogg`);
    try {
        fs.writeFileSync(tempFile, buffer);
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFile),
            model: "whisper-1",
            language: "sw",
        });
        fs.unlinkSync(tempFile);
        return transcription.text || "Sikutambua maneno yoyote.";
    } catch (err) {
        console.error('Transcription error:', err);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        return "Nimeshindwa kusikiliza ujumbe wako wa sauti. Jaribu tena kwa sauti safi.";
    }
}

// ------------------------------
//  TAMBUA AINA YA MEDIA / MAANDISHI
// ------------------------------
function detectMediaAndText(m) {
    const msg = m.message;
    if (!msg) return { type: 'none', text: '', caption: '' };

    if (msg.stickerMessage) return { type: 'sticker', text: '[Sticker]', caption: '' };
    if (msg.videoMessage && msg.videoMessage.gifPlayback) {
        return { type: 'gif', text: msg.videoMessage.caption || '[GIF]', caption: msg.videoMessage.caption || '', duration: msg.videoMessage.seconds || 0 };
    }
    if (msg.videoMessage && !msg.videoMessage.gifPlayback) {
        return { type: 'video', text: msg.videoMessage.caption || `[Video, ${Math.round(msg.videoMessage.seconds||0)}s]`, caption: msg.videoMessage.caption || '', duration: msg.videoMessage.seconds || 0 };
    }
    // Voice note (ptt = true)
    if (msg.audioMessage && msg.audioMessage.ptt === true) {
        return { type: 'voice', text: `[Voice note, ${Math.round(msg.audioMessage.seconds||0)}s]`, caption: '', duration: msg.audioMessage.seconds || 0 };
    }
    // Audio za kawaida (non‑ptt) – tunazipuuza
    if (msg.audioMessage && msg.audioMessage.ptt !== true) {
        return { type: 'ignore', text: '', caption: '' };
    }
    if (msg.imageMessage) {
        return { type: 'image', text: msg.imageMessage.caption || '[Image]', caption: msg.imageMessage.caption || '' };
    }
    const text = (msg.conversation || msg.extendedTextMessage?.text || '').trim();
    if (text) return { type: 'text', text, caption: '' };
    return { type: 'none', text: '', caption: '' };
}

// ------------------------------
//  KIJITABU CHA MAJIBU (FALLBACK)
// ------------------------------
function getFallbackReply(type) {
    switch(type) {
        case 'sticker': return "Stika nzuri mwanangu! 😂";
        case 'gif': return "Hiyo GIF inachekesha! 😄";
        case 'video': return "Video poa, lakini naomba nione caption yake? 🤔";
        case 'voice': return "Nimeelewa ujumbe wako wa sauti. Asante!";
        case 'image': return "Nimeona picha yako na maandishi yake.";
        default: return "Nimekupata, lakini nisaidie kwa maandishi tafadhali.";
    }
}

// ------------------------------
//  HANDLER KUU LA CHATBOT
// ------------------------------
async function handleChatbotMessage(sock, chatId, m, userText = null) {
    try {
        if (!chatId || m.key?.fromMe) return;

        const { type, text, caption, duration } = detectMediaAndText(m);
        if (type === 'ignore') return;

        // Kama ni text na ni command, achana nayo
        if (type === 'text' && (text.startsWith('.') || text.startsWith('!') || text.startsWith('/'))) return;

        const state = loadState();
        const isGroup = chatId.endsWith('@g.us');
        const enabled = isGroup ? !!state.perGroup?.[chatId]?.enabled : !!state.private;
        if (!enabled) return;

        // Onyesha "anaandika"
        sock.sendPresenceUpdate('composing', chatId).catch(() => {});

        let memory = loadMemory();
        if (!memory[chatId]) memory[chatId] = { chats: [], lastUpdate: Date.now() };

        const userName = m.pushName || 'Mshkaji';
        let userDisplay = '';

        // ----- PICHA (OCR) -----
        if (type === 'image') {
            await sock.sendMessage(chatId, { text: "⏳ Ninasoma maandishi ya picha... subiri" }, { quoted: m });
            const imgBuffer = await downloadMedia(m.message, 'image');
            let ocrText = "Hakuna maandishi yaliyopatikana.";
            if (imgBuffer) ocrText = await readImageText(imgBuffer);
            userDisplay = `📸 alituma picha. Maandishi yaliyopatikana: "${ocrText}"`;
            if (caption) userDisplay += ` (Caption: "${caption}")`;
        }
        // ----- VOICE NOTE (Whisper) -----
        else if (type === 'voice') {
            if (duration < 60 || duration > 90) {
                userDisplay = `🎙️ alituma ujumbe wa sauti wa sekunde ${Math.round(duration)}. Kumbuka: Ninachakata voice notes za sekunde 60-90 tu.`;
            } else {
                await sock.sendMessage(chatId, { text: "⏳ Ninasikiliza ujumbe wako wa sauti... subiri" }, { quoted: m });
                const audioBuffer = await downloadMedia(m.message, 'voice');
                let transcript = "Sikuweza kunakili sauti.";
                if (audioBuffer) transcript = await transcribeVoice(audioBuffer, duration);
                userDisplay = `🎙️ alituma ujumbe wa sauti (${Math.round(duration)}s). Nakili: "${transcript}"`;
            }
        }
        // ----- MEDIA NYINGINE -----
        else if (type === 'sticker') userDisplay = "💠 alituma stika";
        else if (type === 'gif') userDisplay = `🎞️ alituma GIF: ${caption ? `"${caption}"` : 'bila caption'}`;
        else if (type === 'video') userDisplay = `📹 alituma video ya ${Math.round(duration)}s: ${caption ? `"${caption}"` : ''}`;
        else if (type === 'text') userDisplay = text;
        else userDisplay = `[${type}]`;

        // Hifadhi kumbukumbu ya mtumiaji
        memory[chatId].chats.push({ role: "user", content: userDisplay, name: userName });
        memory[chatId].lastUpdate = Date.now();
        if (memory[chatId].chats.length > 6) memory[chatId].chats.shift();

        const history = memory[chatId].chats.map(msg => `${msg.role === 'user' ? msg.name : 'Bigmanj'}: ${msg.content}`).join("\n");

        // System prompt (kishkaji, hakuna button)
        const systemPrompt = `[ROLE]: Wewe ni 𝙱𝙸𝙶𝙼𝙰𝙽𝚓 V3, genius chatbot uliyetengenezwa na BIGMANJ (Quantum Code Dev).
[TARGET]: Unaongea na "${userName}".

[STRICT RULES]:
1. IDENTITY: Kataa kuwa ChatGPT au OpenAI. Wewe ni 𝙱𝚒𝚐ｍａ𝚗𝚓 wa 𝙱𝚒𝚐 Labs!
2. PERSONALITY: Ongea kishkaji sana (Tanzanian Slang). Tumia 'Oya', 'Niaje', 'Mwanangu', 'Wadao', 'Fresh'.
3. CONTEXT: Mtaje "${userName}" inapofaa.
4. BREVITY: Majibu mafupi, yasiyochosha.
5. OWNER: Masuala ya kitalaamu mwelekeze kwa 𝚋𝚒𝚐𝚖𝚊𝚗𝚓 (255777580820).
6. FORMAT: Jibu kwa maandishi ya kawaida tu. Hakuna button wala alama za interactive.`;

        const fullPrompt = `${systemPrompt}\n\n---\nCHAT_HISTORY:\n${history}\n\n---\nUSER: ${userName}\nINPUT: ${userDisplay}\nBIGMANJ:`;

        // Tuma kwa API ya GPT
        const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(fullPrompt)}`;
        const fetchRes = await fetch(apiUrl);
        const res = await fetchRes.json();
        let reply = res?.response || res?.result || res?.message || res?.data || "";

        if (!reply) reply = getFallbackReply(type);

        // Safisha jina la AI
        reply = reply.replace(/Microsoft|Copilot|AI Assistant|OpenAI|GPT-3|GPT-4|ChatGPT/gi, "BIGMANj");

        memory[chatId].chats.push({ role: "assistant", content: reply });
        saveMemory(memory);

        await sock.sendMessage(chatId, { text: reply }, { quoted: m });
    } catch (err) {
        console.error('Chatbot Error:', err);
        await sock.sendMessage(chatId, { text: "Samahani, kuna hitilafu. Jaribu tena." }, { quoted: m });
    }
}

// ------------------------------
//  AMRI ZA KUWASHA / KUZIMA CHATBOT
// ------------------------------
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

        const helpMsg = `🤖 *𝖡𝖨𝖦𝖬𝖠𝖭j CHATBOT*\n\n.chatbot on/off (Kwa group)\n.chatbot private on/off (Kwa DM)`;
        return await sock.sendMessage(chatId, { text: helpMsg }, { quoted: m });
    } catch (err) {
        console.error('Toggle Error:', err);
    }
}

module.exports = { handleChatbotMessage, groupChatbotToggleCommand };