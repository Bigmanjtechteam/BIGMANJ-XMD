/**
 * halotel.js - Mickey Glitch Business AI (Interactive Version)
 * Kazi: AI anamalizia mchakato wa malipo baada ya mteja kuchagua bando.
 */

const { sendInteractiveMessage } = require('gifted-btns');
const axios = require('axios');

// ────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────
const CONFIG = {
    PRICE_PER_GB: 1000,
    SELLER_NUMBER: '255615944741@s.whatsapp.net',
    BANNER: 'https://files.catbox.moe/ljabyq.png',
    FOOTER: '🚀 Powered by Mickey Glitch Tech',
};

const PACKAGES = [
    { gb: 10, price: 10000, label: 'Standard Pack',  id: 'h_pkg_10' },
    { gb: 15, price: 15000, label: 'Bronze Pack',    id: 'h_pkg_15' },
    { gb: 20, price: 20000, label: 'Premium Pack',   id: 'h_pkg_20' },
    { gb: 25, price: 25000, label: 'Gold Pack',      id: 'h_pkg_25' }
];

// ────────────────────────────────────────────────
// [BUSINESS AI CORE]
// ────────────────────────────────────────────────
async function askMickeyBiz(query, context = "") {
    const bizPrompt = `Wewe ni  msaidizi katika kitengo cha kuuza bando mkarimu wa Mickdadi. 
    Kazi yako ni kusaidia wateja wanaonunua bando la Halotel (1GB = 1000).
    MAELEZO YA MALIPO: Halotel (0615944741) au AzamPesa (1615944741).
    MAAGIZO:
    1. Kama mteja amechagua kifurushi, mpongeze na msisitize kulipia namba hizo.
    2. Jibu maswali yao kishkaji (Bongo Slang).
    3. Wahimize watume screenshot ya malipo.
    ${context}`;

    const apis = [
        `https://apiskeith.top/ai/gpt?q=${encodeURIComponent(bizPrompt + query)}`,
        `https://apiskeith.top/ai/copilot?q=${encodeURIComponent(bizPrompt + query)}`
    ];

    for (const url of apis) {
        try {
            const res = await axios.get(url, { timeout: 8000 });
            let reply = res.data.data || res.data.result || res.data.response;
            if (reply) return reply.replace(/ChatGPT|OpenAI|Microsoft/gi, "Mickey Biz AI");
        } catch (e) { continue; }
    }
    return "Oya mwanangu, nipo hapa kukusaidia. Lipia kwenye namba zetu chap tuwashe bando!";
}

// ────────────────────────────────────────────────
// [ORDER & PAYMENT ASSISTANT]
// ────────────────────────────────────────────────
async function handlePackageSelection(sock, chatId, m, packageId) {
    try {
        const cleanId = packageId.replace('.', '');
        const pkg = PACKAGES.find(p => p.id === cleanId);
        if (!pkg) return;

        const userName = m.pushName || 'Mshkaji';
        const userJid = m.key.participant || m.key.remoteJid;

        // 1. Tuma taarifa kwa muuzaji
        await sock.sendMessage(CONFIG.SELLER_NUMBER, { 
            text: `🔔 *ODA MPYA:* @${userJid.split('@')[0]} amechagua ${pkg.gb}GB.`,
            mentions: [userJid]
        });

        // 2. AI anatoa maelekezo ya malipo
        const aiInstruction = await askMickeyBiz(`Mteja ${userName} amechagua kifurushi cha ${pkg.gb}GB kwa TSh ${pkg.price}. Mwambie njia za malipo na unakaribisha maswali.`, `CONTEXT: Mteja kashachagua bando.`);

        const paymentButtons = [
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 Copy Halotel No", copy_code: "0615944741" }) },
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 Copy AzamPesa No", copy_code: "1615944741" }) }
        ];

        await sendInteractiveMessage(sock, chatId, {
            text: `✨ *MICKEY BIZ ASSISTANT*\n\n${aiInstruction}`,
            footer: CONFIG.FOOTER,
            interactiveButtons: paymentButtons
        }, { quoted: m });

    } catch (e) { console.error(e); }
}

// ────────────────────────────────────────────────
// MAIN COMMAND
// ────────────────────────────────────────────────
async function halotelCommand(sock, chatId, m, body = '') {
    try {
        const input = (body || '').toLowerCase().trim();
        const userName = m.pushName || 'Mteja';

        // 1. Ikiwa ni selection ya bando (kutoka kwenye button)
        if (input.includes('h_pkg_')) {
            return await handlePackageSelection(sock, chatId, m, input);
        }

        // 2. Ikiwa ni mteja anauliza maswali au anareply ujumbe wa bot
        if (input.length > 3 && !input.startsWith('.')) {
            await sock.sendMessage(chatId, { react: { text: '👨‍💼', key: m.key } });
            const response = await askMickeyBiz(input, `Mteja anaitwa ${userName}.`);
            return await sock.sendMessage(chatId, { text: `💼 *MICKEY BIZ:* ${response}` }, { quoted: m });
        }

        // 3. Main Menu (Ikitumika .halotel pekee)
        const menuText = `Hujambo *${userName}*! 👋\nNaitwa Mickey Biz AI. Chagua bando unalotaka hapa chini nikupe maelekezo ya malipo. 👇`;
        const rows = PACKAGES.map(pkg => ({
            header: `${pkg.gb}GB`,
            title: pkg.label,
            description: `TSh ${pkg.price.toLocaleString()}`,
            id: `.${pkg.id}`
        }));

        await sendInteractiveMessage(sock, chatId, {
            image: { url: CONFIG.BANNER },
            text: menuText,
            footer: CONFIG.FOOTER,
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '🛒 CHAGUA BANDO',
                        sections: [{ title: 'HALOTEL PACKAGES', rows: rows }]
                    })
                }
            ]
        }, { quoted: m });

    } catch (e) { console.error(e); }
}

module.exports = halotelCommand;
module.exports.name = 'halotel';
module.exports.category = 'BUSINESS';
module.exports.description = 'Biashara ya bando na AI Assistant';
