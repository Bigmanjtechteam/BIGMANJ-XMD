const axios = require('axios');

/**
 * ai.js - BIGMANj AI Assistant (Enhanced Fully Integrated Version)
 * Creator: bigmanj (Quantum Code Developer)
 */
const aiCommand = async (sock, chatId, msg, args) => {
    // Extract query from arguments
    const query = Array.isArray(args) ? args.join(' ') : args;

    if (!query) {
        return sock.sendMessage(chatId, {
            text: '╭━━━〔 *BIGMANj AI* 〕━━━┈⊷\n┃\n┃ 📝 *Usage:* `.ai [swali lako]`\n┃ 💡 *Example:* `.ai mambo vipi?`\n┃\n╰━━━━━━━━━━━━━━━━━━━━┈⊷'
        }, { quoted: msg });
    }

    // Length protection
    if (query.length > 5000) {
        return sock.sendMessage(chatId, { text: '⚠️ *Mzee, swali lako ni refu kupita kiasi! Punguza kidogo.*' }, { quoted: msg });
    }

    // Thinking reaction
    await sock.sendMessage(chatId, { react: { text: '🧠', key: msg.key } }).catch(() => {});

    try {
        // System prompt – identity and rules (no “Mickey”)
        const systemPrompt = `[ROLE]: Wewe ni BIGMANj V3, genius AI msaidizi uliyetengenezwa na BIGMANj (Quantum Code Dev).
[CONTEXT]: Repo yako ipo hapa: https://github.com/brightsonnjegite-sudo/Mickey-Glitch (inayoendeshwa na bigmanj).
[RULES]:
- Ongea kishkaji (Bongo Swahili Slang).
- Jibu yawe mafupi na yenye akili, moja kwa moja kwenye swali lililoulizwa.
- Usijitaje kama AI wa OpenAI au Microsoft.
- Kama ishu ni ngumu, waambie wamcheki bigmanj (255612130873).`;

        const fullQuery = `${systemPrompt}\n\nSwali la mtumiaji: ${query}\nJibu lako fupi, kwa Kiswahili cha kishkaji, lenye ufahamu:`;

        // Multi-API fallback list (more reliable endpoints)
        const apiUrls = [
            `https://api.popcat.xyz/gpt?prompt=${encodeURIComponent(fullQuery)}&key=popcat`