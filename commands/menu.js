const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const { sendInteractiveMessage } = require('gifted-btns');

/**
 * @project: MICKEY GLITCH V3.0.5
 * @author: Quantum Base Developer (TZ)
 * @description: Enhanced Menu - Reads real command names & metadata
 */

const menuCommand = async (sock, chatId, m) => {
    try {
        const botName = 'MICKEY GLITCH';
        const now = moment().tz('Africa/Dar_es_Salaam');
        const greet = now.hour() < 12 ? 'Asubuhi ☀️' : now.hour() < 18 ? 'Mchana 🌤️' : 'Jioni 🌙';

        const commandsDir = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

        const menuSections = {};

        for (const file of commandFiles) {
            // Epuka faili za mfumo zisizo na amri za watumiaji
            if (['menu.js', 'help.js', 'main.js'].includes(file)) continue;

            try {
                // Tunafuta cache ili kupata mabadiliko mapya ya code (Hot Reloading)
                delete require.cache[require.resolve(path.join(commandsDir, file))];
                const cmdFile = require(path.join(commandsDir, file));

                // 🛠️ LOGIC YA KUPATA JINA HALISI:
                // 1. Inatafuta 'command' 2. Inatafuta 'alias' ya kwanza 3. Inatafuta 'name' 4. Mwisho ni jina la faili
                let cmdName = cmdFile.command || 
                              (Array.isArray(cmdFile.alias) ? cmdFile.alias[0] : cmdFile.alias) || 
                              cmdFile.name || 
                              file.replace('.js', '');

                // Kusafisha jina: Herufi ndogo na kufuta maneno ya ziada
                cmdName = cmdName.toString().toLowerCase().replace('command', '').trim();

                const category = (cmdFile.category || 'Mengineyo').toUpperCase();
                const description = cmdFile.description || `Tumia amri ya .${cmdName}`;

                if (!menuSections[category]) {
                    menuSections[category] = [];
                }

                // Tunaongeza kwenye section husika
                menuSections[category].push({
                    header: '', 
                    title: `.${cmdName.toUpperCase()}`,
                    description: description,
                    id: `.${cmdName}` 
                });

            } catch (e) {
                // Skip files ambazo si commands au zina error
                continue;
            }
        }

        // Kupanga sections (Categories) kwa herufi (A-Z)
        const sortedCategories = Object.keys(menuSections).sort();

        const sections = sortedCategories.map(cat => ({
            title: `⭐ ${cat}`,
            rows: menuSections[cat]
        }));

        const helpText = `╔════════════════════╗
  ✨ *${botName}* — *V3.0.5*
╚════════════════════╝
┌  👋 *Habari za ${greet}*
│  👤 *User:* ${m.pushName || 'User'}
│  📅 *Date:* ${now.format('ddd, MMM D')}
│  ⏰ *Time:* ${now.format('HH:mm:ss')}
└────────────────────┘
*Quantum Base Developer (TZ)*

👇 *Chagua kundi la amri hapo chini:*`;

        // Tuma ujumbe wa interactive (Button/List)
        await sendInteractiveMessage(sock, chatId, {
            text: helpText,
            contextInfo: {
                externalAdReply: {
                    title: "𝙼𝚒𝚌𝚔𝚎𝚢 𝙶𝚕𝚒𝚝𝚌𝚑 𝙼𝚎𝚗𝚞 𝚂𝚢𝚜𝚝𝚎𝚖",
                    body: "𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚀𝚞𝚊𝚗𝚝𝚞𝚖 𝙲𝚘𝚍𝚎",
                    thumbnailUrl: 'https://water-billing-292n.onrender.com/1761205727440.png',
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

// Export kwa ajili ya main.js
module.exports = menuCommand;
