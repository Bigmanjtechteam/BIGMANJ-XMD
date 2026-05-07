const chalk = require('chalk');

/**
 * Handle Status Forwarding to Owner
 * Inatumia copyNForward kuzuia media key errors
 */
async function handleStatusForward(Mickey, viewedMek) {
    try {
        // Hakikisha viewedMek ipo na ina data halali
        if (!viewedMek || !viewedMek.key) return;

        const myNumber = Mickey.user.id.split(':')[0] + "@s.whatsapp.net";

        // Forward status kwenda kwa mmiliki wa bot
        await Mickey.copyNForward(myNumber, viewedMek, true, {
            quoted: viewedMek,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: `𝚂𝚝𝚊𝚝𝚞𝚜 𝙵𝚘𝚛𝚠𝚊𝚛𝚍: ${viewedMek.pushName || 'User'}`,
                    body: '𝙼𝚒𝚌𝚔𝚎𝚢 𝙶𝚕𝚒𝚝𝚌𝚑™',
                    thumbnailUrl: 'https://i.imgur.com/2wzGhpF.jpeg',
                    showAdAttribution: true
                }
            }
        });

        console.log(chalk.cyan(`[FORWARD] Status sent to Owner`));
    } catch (err) {
        if (!err.message.includes('participant')) {
            console.log(chalk.red(`[FORWARD ERROR]: ${err.message}`));
        }
    }
}

module.exports = { handleStatusForward };
