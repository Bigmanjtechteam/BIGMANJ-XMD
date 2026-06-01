const axios = require('axios');
const moment = require('moment-timezone');

function formatDate(dateString) {
    const date = new Date(dateString);
    return moment(date).tz('Africa/Dar_es_Salaam').format('MMM D, YYYY');
}

async function repoCommand(sock, chatId, message) {
    try {
        const repoOwner = 'brightsonnjegite-sudo';
        const repoName = 'BIGMANJ-XMD';
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
        const zipUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/main.zip`;
        const repoUrl = `https://github.com/${repoOwner}/${repoName}`;

        // Loading reaction
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // Fetch repo data
        const response = await axios.get(apiUrl);
        const repoData = response.data;

        const caption = `✨ *${repoData.name}*

👤 *Owner:* ${repoData.owner.login}
⭐ *Stars:* ${repoData.stargazers_count}
🍴 *Forks:* ${repoData.forks_count}
👁️ *Watchers:* ${repoData.watchers_count}
🐛 *Open Issues:* ${repoData.open_issues_count}

🟨 *Language:* ${repoData.language || 'N/A'}
📜 *License:* ${repoData.license ? repoData.license.name : 'N/A'}
📅 *Last Updated:* ${formatDate(repoData.updated_at)}

📝 *Description:*
${repoData.description || 'No description provided.'}

💡 *Type .menu to see all commands*
> bigmanj tech™`;

        // Use WhatsApp native template buttons (no external library needed)
        await sock.sendMessage(chatId, {
            text: caption,
            footer: 'BIGMANj DT Tech • Powered by Bigmanj',
            templateButtons: [
                { urlButton: { displayText: '🌐 OPEN REPOSITORY', url: repoUrl } },
                { urlButton: { displayText: '📦 DOWNLOAD ZIP', url: zipUrl } },
                { copyCodeButton: { displayText: '📋 COPY REPO LINK', copyCode: repoUrl } }
            ]
        }, { quoted: message });

        // Success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Repo error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Failed to fetch repository data!*\nPlease try again later.'
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = repoCommand;