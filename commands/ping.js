const os = require('os');
const { sendButtons } = require('gifted-btns');

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function getSpeedStatus(latency) {
    if (latency < 100) return { text: 'Excellent', emoji: '🟢' };
    if (latency < 300) return { text: 'Good', emoji: '🟡' };
    return { text: 'Slow', emoji: '🔴' };
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: '⚡' }, { quoted: message });
        const latency = Date.now() - start;

        const uptime = formatUptime(process.uptime());
        const usedRam = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
        const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
        const cpuCores = os.cpus().length;
        const platform = os.platform();
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

        const speedStatus = getSpeedStatus(latency);

        const pingText = `╔════════════════════╗
║   ⚡ *BIGMANj* ⚡    ║
╚════════════════════╝

⚡ *BIGMANj ENGINE*
SYSTEM STATUS REPORT

━━━━━━━━━━━━━━━━━━━━

🚀 *Speed*
└➤ ${latency}ms ${speedStatus.emoji} ${speedStatus.text}

⏱️ *Uptime*
└➤ ${uptime}

💾 *RAM Usage*
└➤ ${usedRam}MB / ${totalRam}GB

🆓 *Free RAM*
└➤ ${freeRam}GB

🖥️ *CPU Cores*
└➤ ${cpuCores}

💻 *Platform*
└➤ ${platformName}

━━━━━━━━━━━━━━━━━━━━

🟢 ALL SYSTEMS ONLINE
└➤ Stable Connection

━━━━━━━━━━━━━━━━━━━━

⚫ Refresh    🔵 Help    📊 Detailed Info
━━━━━━━━━━━━━━━━━━━━

© 2026 Bigmanj Labs™
> Bigmanj Tech`;

        const buttons = [
            { id: '.ping', text: '⚫ REFRESH' },
            { id: '.repo', text: '📊 DETAILED INFO' },
            { id: '.menu', text: '🔵 HELP' }
        ];

        await sendButtons(sock, chatId, {
            title: '⚡ *BIGMANj ENGINE*',
            text: pingText,
            footer: 'Bigmanj Tech',
            buttons: buttons
        }, { quoted: message });

    } catch (error) {
        console.error('Ping error:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get system status' }, { quoted: message });
    }
}

module.exports = pingCommand;