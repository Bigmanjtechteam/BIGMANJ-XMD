const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');

const REPO_URL = 'https://github.com/brightsonnjegite-sudo/BIGMANJ-XMD';
const REPO_API_URL = 'https://api.github.com/repos/brightsonnjegite-sudo/BIGMANJ-XMD';

/**
 * @project: MICKEY GLITCH PREMIUM BOT
 * @command: UPDATE SYSTEM
 * @repo: https://github.com/brightsonnjegite-sudo/BIGMANJ-XMD
 */

async function updateCommand(sock, chatId, message, customUrl = null) {
    try {
        const isOwner = message.key.fromMe;
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: "❌ Samahani, ni owner pekee anayeruhusiwa kutumia hii command!" });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        // --- REPO YAKO HALISI ---
        const mainRepo = REPO_URL;
        
        let updateZipUrl;
        
        if (customUrl && customUrl.startsWith('http')) {
            updateZipUrl = customUrl.trim();
        } else if (customUrl === 'branch' && customUrl.split(' ')[1]) {
            // Kwa branch tofauti: .update branch main
            const branch = customUrl.split(' ')[1] || 'main';
            updateZipUrl = `${mainRepo}/archive/refs/heads/${branch}.zip`;
        } else {
            // Default: main branch
            updateZipUrl = `${mainRepo}/archive/refs/heads/main.zip`;
        }

        console.log(chalk.blue(`[Mickey Update] Downloading from: ${updateZipUrl}`));

        const tmpDir = path.join(process.cwd(), 'temp_update');
        const zipPath = path.join(tmpDir, 'mickey_update.zip');
        const extractPath = path.join(tmpDir, 'extracted');

        // Clean previous temp
        if (fs.existsSync(tmpDir)) fs.removeSync(tmpDir);
        fs.ensureDirSync(tmpDir);

        await sock.sendMessage(chatId, { text: "📥 *Ina-download update kutoka Mickey Glitch Repo...*" });

        // Download with better error handling
        const response = await axios({
            method: 'get',
            url: updateZipUrl,
            responseType: 'stream',
            timeout: 90000,
            headers: {
                'User-Agent': 'Mickey-Glitch-Bot/3.0'
            }
        }).catch(err => {
            throw new Error(`Download failed: ${err.message}`);
        });

        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await sock.sendMessage(chatId, { text: "📦 *Kuna-extract files mpya...*" });

        // Extract using unzip
        exec(`unzip -o ${zipPath} -d ${extractPath}`, async (err, stdout, stderr) => {
            if (err) {
                console.log(chalk.red("Extraction failed:"), stderr);
                
                // Try using node.js extraction if unzip fails
                await sock.sendMessage(chatId, { text: "⚠️ *Trying alternative extraction method...*" });
                
                const AdmZip = require('adm-zip');
                try {
                    const zip = new AdmZip(zipPath);
                    zip.extractAllTo(extractPath, true);
                } catch (zipErr) {
                    await sock.sendMessage(chatId, { text: "❌ *Extraction Failed:* Hakikisha unzip ipo kwenye system.\nJaribu: `apt install unzip -y`" });
                    fs.removeSync(tmpDir);
                    return;
                }
            }

            try {
                const folders = fs.readdirSync(extractPath);
                if (folders.length === 0) throw new Error("No files extracted");

                // Find the root folder (BIGMANJ-XMD-main or similar)
                let rootFolder = path.join(extractPath, folders[0]);
                
                // Handle nested folders
                while (fs.readdirSync(rootFolder).length === 1 && 
                       fs.statSync(path.join(rootFolder, fs.readdirSync(rootFolder)[0])).isDirectory()) {
                    rootFolder = path.join(rootFolder, fs.readdirSync(rootFolder)[0]);
                }

                // Files/folders to PROTECT (hazitabadilishwa)
                const protectedItems = [
                    'node_modules',
                    'session',
                    'auth_info_baileys',
                    'sessions',
                    '.git',
                    '.env',
                    'config.js',
                    'settings.json',
                    'database.json',
                    'data/chatbot.json',
                    'data/chatbot_memory.json',
                    'data/user_prefs.json',
                    'data/stats.json',
                    'data/custom_responses.json',
                    'data/reminders.json'
                ];

                await sock.sendMessage(chatId, { text: "📋 *Ina-copy files mpya (huku ikilinda data yako)...*" });

                const files = fs.readdirSync(rootFolder);
                let copiedCount = 0;
                let skippedCount = 0;

                for (const file of files) {
                    const shouldProtect = protectedItems.some(protected => 
                        file === protected || file.startsWith(protected + '/')
                    );
                    
                    if (!shouldProtect && file !== 'BIGMANJ-XMD-main') {
                        const source = path.join(rootFolder, file);
                        const dest = path.join(process.cwd(), file);
                        
                        if (fs.existsSync(source)) {
                            fs.copySync(source, dest, { overwrite: true });
                            copiedCount++;
                        }
                    } else {
                        skippedCount++;
                    }
                }

                // Special handling for package.json - merge dependencies
                const newPackagePath = path.join(rootFolder, 'package.json');
                const currentPackagePath = path.join(process.cwd(), 'package.json');
                
                if (fs.existsSync(newPackagePath)) {
                    const newPackage = require(newPackagePath);
                    const currentPackage = require(currentPackagePath);
                    
                    // Keep current version but merge new scripts if needed
                    if (newPackage.scripts && !currentPackage.scripts) {
                        currentPackage.scripts = newPackage.scripts;
                        fs.writeFileSync(currentPackagePath, JSON.stringify(currentPackage, null, 2));
                    }
                }

                // Clean temp folder
                fs.removeSync(tmpDir);

                const successMsg = `✅ *UPDATE IMEKAMILIKA KWA MAFANIKIO!* 🎉

📊 *Statistics:*
├ 📁 Files zilizobadilishwa: ${copiedCount}
├ 🔒 Files zilizolindwa: ${skippedCount}
└ 🔄 Bot itaji-restart

🔐 *Data iliyohifadhiwa:* Session, Memory, User Preferences, Stats zote ziko salama!

⚠️ Bot ina-restart baada ya sekunde 5...

*BIGMANJ•DT Premium Bot - Imeboreshwa!* 🚀`;

                await sock.sendMessage(chatId, { text: successMsg });
                console.log(chalk.green.bold('✅ MICKEY GLITCH UPDATE SUCCESSFUL!'));
                console.log(chalk.yellow(`📁 ${copiedCount} files updated, ${skippedCount} files protected`));

                // Graceful restart
                setTimeout(() => {
                    console.log(chalk.yellow('🔄 Restarting Mickey Glitch Bot...'));
                    process.exit(0);
                }, 5000);

            } catch (copyErr) {
                console.error(chalk.red("Copy error:"), copyErr);
                await sock.sendMessage(chatId, { text: `❌ *Update Failed:* ${copyErr.message}\n\nTafadhali wasiliana na Mickeydeveloper.` });
                fs.removeSync(tmpDir);
            }
        });

    } catch (err) {
        console.error(chalk.red("Update Error:"), err.message);
        await sock.sendMessage(chatId, { text: `❌ *Update Imefeli:* ${err.message}\n\nSababu inawezekana:\n• Repo iko private au haipatikani\n• Connection timeout\n• Hakuna unzip kwenye server\n\nTafadhali jaribu tena baadaye.` }).catch(() => {});
    }
}

// Check version command
async function checkVersion(sock, chatId, message) {
    try {
        const isOwner = message.key.fromMe;
        if (!isOwner) return;

        const packageJson = require(path.join(process.cwd(), 'package.json'));
        const currentVersion = packageJson.version || '3.0.0';
        
        // Check latest commit from repo
        try {
            const apiUrl = `${REPO_API_URL}/commits/main`;
            const response = await axios.get(apiUrl, { timeout: 5000 });
            const latestCommit = response.data;
            const lastUpdate = new Date(latestCommit.commit.author.date).toLocaleString();
            
            const versionMsg = `🤖 *MICKEY GLITCH PREMIUM BOT*

📌 *Current Version:* ${currentVersion}
📦 *Repository:* BIGMANJ-XMD
🕐 *Latest Update:* ${lastUpdate}
📝 *Latest Commit:* ${latestCommit.commit.message.slice(0, 50)}...

💡 *Commands:*
├ .update - Update to latest version
├ .update branch [name] - Update from specific branch
├ .version - Check this status
└ .update [url] - Update from custom URL

✅ *Bot iko running smoothly!* 🚀`;
            
            await sock.sendMessage(chatId, { text: versionMsg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `🤖 *MICKEY GLITCH PREMIUM BOT*\n📌 Version: ${currentVersion}\n⚠️ Unable to check remote updates` });
        }
    } catch (err) {
        console.error("Version check error:", err);
    }
}

 module.exports = updateCommand;