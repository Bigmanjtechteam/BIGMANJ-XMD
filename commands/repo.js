/**
 * repo.js - Repository Information with Interactive Buttons
 * Shows GitHub repo info with CTA buttons for copy, open URL, and download ZIP
 */
const axios = require('axios');
const { sendInteractiveMessage } = require('gifted-btns');

// Format date to readable format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Get language color emoji
function getLanguageEmoji(language) {
    const emojis = {
        'JavaScript': '🟨',
        'TypeScript': '🔵',
        'Python': '🟦',
        'Java': '☕',
        'Go': '🔵',
        'Rust': '🦀',
        'PHP': '💜',
        'C++': '⚙️',
        'Shell': '💻'
    };
    return emojis[language] || '📝';
}

async function repoCommand(sock, chatId, message) {
    if (!sock || !chatId) return;

    try {
        // Send loading reaction
        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        // Fetch repository data
        const repoRes = await axios.get('https://api.github.com/repos/Mickeydeveloper/Mickey-Glitch', {
            headers: { 'User-Agent': 'MickeyBot' }
        });

        const repo = repoRes.data;

        // Build repository information text (reduced links)
        const repoText = `✨ *${repo.name.toUpperCase()}*\n\n` +
            `👤 *Owner:* ${repo.owner.login}\n` +
            `⭐ *Stars:* ${repo.stargazers_count.toLocaleString()}\n` +
            `🍴 *Forks:* ${repo.forks_count.toLocaleString()}\n` +
            `👁️ *Watchers:* ${repo.watchers_count.toLocaleString()}\n` +
            `🐛 *Open Issues:* ${repo.open_issues_count}\n\n` +
            `${getLanguageEmoji(repo.language)} *Language:* ${repo.language || 'Not specified'}\n` +
            `📜 *License:* ${repo.license?.name || 'N/A'}\n` +
            `📅 *Last Updated:* ${formatDate(repo.updated_at)}\n\n` +
            `📝 *Description:*\n${repo.description || 'No description available'}\n\n` +
            `💡 *Type .menu to see all commands*`;

        // Send interactive message with CTA buttons
        await sendInteractiveMessage(sock, chatId, {
            text: repoText,
            footer: "Mickey Glitch Tech • Powered by Mickey Glitch",
            interactiveButtons: [
                {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Copy Repo Link',
                        copy_code: repo.html_url
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '🌐 Open Repository',
                        url: repo.html_url
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📦 Download ZIP',
                        id: 'repo_download_zip'
                    })
                }
            ]
        }, { quoted: message });

        // Send success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('Repo Error:', err);

        // Send error message
        await sock.sendMessage(chatId, {
            text: `❌ *Error fetching repo data.*\n\n_${err.message}_`
        }, { quoted: message });

        // Send error reaction
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = repoCommand;
