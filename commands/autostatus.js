const chalk = require('chalk');
const fs = require('fs');

/**
 * @project: MICKEY GLITCH V3
 * @feature: Auto Status View & Reaction
 */

async function handleAutoStatus(Mickey, chatUpdate) {
    try {
        // 1. Angalia kama ni status broadcast
        const mek = chatUpdate.messages[0];
        if (!mek || !mek.key || mek.key.remoteJid !== 'status@broadcast') return null;

        // 2. Angalia kama kipengele kimepashwa (On/Off) kwenye settings
        let statusSettings = { autoStatus: false };
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            statusSettings.autoStatus = data.autoStatus || false;
        } catch (e) {
            statusSettings.autoStatus = false;
        }

        // Kama imezimwa, usiendelee
        if (!statusSettings.autoStatus) return null;

        // 3. View Status (Kusoma)
        await Mickey.readMessages([mek.key]);

        // 4. Auto Reaction (Like)
        // Tunapata JID ya mtumaji kwa usahihi (Inasupport LID na S.WHATSAPP.NET)
        const senderJid = mek.key.participant || mek.participant || mek.key.remoteJid;
        
        try {
            await Mickey.sendMessage('status@broadcast', {
                react: { key: mek.key, text: '💚' }
            }, { statusJidList: [senderJid] });
        } catch (e) {
            // Reaction ikifeli isizime bot
        }

        console.log(chalk.green(`[STATUS] Viewed & Liked: ${mek.pushName || 'User'}`));
        
        // Tunarudisha 'mek' ili 'statusforward.js' iweze kuitumia pia
        return mek;

    } catch (err) {
        // Kuzuia log chafu za 'participant' errors
        if (!err.message.includes('participant')) {
            console.log(chalk.red(`[STATUS ERROR]: ${err.message}`));
        }
        return null;
    }
}

// Command handler ya kuwasha/kuzima (.autostatus on/off)
async function autoStatusCommand(sock, chatId, m, args) {
    try {
        const action = args[0]?.toLowerCase();
        let data = JSON.parse(fs.readFileSync('./data/messageCount.json'));

        if (action === 'on') {
            data.autoStatus = true;
            fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
            return await sock.sendMessage(chatId, { text: '✅ *Auto Status imewashwa!* sasa bot ita-view status zote.' }, { quoted: m });
        } else if (action === 'off') {
            data.autoStatus = false;
            fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
            return await sock.sendMessage(chatId, { text: '❌ *Auto Status imezimwa!*' }, { quoted: m });
        } else {
            return await sock.sendMessage(chatId, { text: `Usage: *.autostatus on* au *.autostatus off*\nStatus sasa: *${data.autoStatus ? 'WASHWA' : 'ZIMWA'}*` }, { quoted: m });
        }
    } catch (e) {
        console.error(e);
    }
}

// Export kwa ajili ya main.js na menu.js
module.exports = { 
    handleAutoStatus, 
    autoStatusCommand 
};

// Metadata kwa ajili ya menu.js
module.exports.command = "autostatus";
module.exports.description = "Washa/Zima uwezo wa ku-view status za watu.";
