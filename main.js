/**
 * 🤖 MICKEY GLITCH - MAIN HANDLER WITH AUTO-REGISTRATION
 * Full-power message handler with dynamic command loading
 * Supports all commands, lib, data automatic registration
 */

const fs = require('fs');
const fsSync = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// ═════════════════════════════════════════════════════════════════════════════
// 🔧 INITIALIZATION & AUTO-SETUP
// ═════════════════════════════════════════════════════════════════════════════

// Auto-create muhimu folders
const folders = ['./temp', './tmp', './data', './lib', './commands', './downloads', './downloads/statuses'];
folders.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

process.env.TMPDIR = path.join(process.cwd(), 'temp');

const settings = require('./settings');
require('./config.js');

// ═════════════════════════════════════════════════════════════════════════════
// 📦 COMMAND & LIB REGISTRY
// ═════════════════════════════════════════════════════════════════════════════

global.commandRegistry = new Map();
global.libRegistry = new Map();
global.dataRegistry = new Map();
global.commandStats = { total: 0, loaded: 0, failed: 0, lastUpdate: new Date() };

// ─────────────────────────────────────────────────────────────
// 📚 AUTO-LOAD LIBRARIES
// ─────────────────────────────────────────────────────────────
function loadLibraries() {
    const libDir = './lib';
    const libFiles = fs.readdirSync(libDir).filter(f => f.endsWith('.js') && !f.startsWith('Mickey'));
    
    libFiles.forEach(file => {
        try {
            const libPath = path.join(libDir, file);
            delete require.cache[require.resolve(libPath)];
            const libModule = require(libPath);
            global.libRegistry.set(file.replace('.js', ''), libModule);
            console.log(chalk.green(`✅ Lib Loaded: ${file}`));
        } catch (e) {
            console.error(chalk.red(`❌ Lib Error [${file}]: ${e.message}`));
            global.commandStats.failed++;
        }
    });
    console.log(chalk.cyan(`📚 Total Libs: ${global.libRegistry.size}`));
}

// ─────────────────────────────────────────────────────────────
// 📋 AUTO-LOAD DATA FILES
// ─────────────────────────────────────────────────────────────
function loadDataRegistry() {
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) return;
    
    const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    dataFiles.forEach(file => {
        try {
            const dataPath = path.join(dataDir, file);
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            global.dataRegistry.set(file.replace('.json', ''), { path: dataPath, data });
            console.log(chalk.green(`✅ Data Loaded: ${file}`));
        } catch (e) {
            console.error(chalk.red(`❌ Data Error [${file}]: ${e.message}`));
        }
    });
    console.log(chalk.cyan(`📋 Total Data Files: ${global.dataRegistry.size}`));
}

// ─────────────────────────────────────────────────────────────
// 🎮 AUTO-LOAD COMMANDS (DYNAMIC REGISTRY)
// ─────────────────────────────────────────────────────────────
function loadCommands() {
    const cmdDir = './commands';
    const cmdFiles = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js') && !f.startsWith('Mickey'));
    
    global.commandStats.total = cmdFiles.length;
    
    cmdFiles.forEach(file => {
        try {
            const cmdPath = path.join(cmdDir, file);
            delete require.cache[require.resolve(cmdPath)];
            const cmdModule = require(cmdPath);
            const cmdName = file.replace('.js', '').toLowerCase();
            
            global.commandRegistry.set(cmdName, {
                name: cmdName,
                file: file,
                module: cmdModule,
                loadedAt: new Date().toISOString()
            });
            
            console.log(chalk.green(`✅ Command Loaded: ${cmdName}`));
            global.commandStats.loaded++;
        } catch (e) {
            console.error(chalk.red(`❌ Command Error [${file}]: ${e.message}`));
            global.commandStats.failed++;
        }
    });
    
    console.log(chalk.cyan(`🎮 Total Commands: ${global.commandRegistry.size} (${global.commandStats.failed} failed)`));
}

// ─────────────────────────────────────────────────────────────
// 📡 SPECIAL HANDLERS (CRITICAL)
// ─────────────────────────────────────────────────────────────
let specialHandlers = {
    autostatus: null,
    chatbot: null,
    statusforward: null,
    autoread: null,
    antidelete: null,
    antilink: null,
    antibadword: null
};

function loadSpecialHandlers() {
    try {
        const handlers = require('./commands/autostatus');
        specialHandlers.autostatus = handlers;
        console.log(chalk.green('✅ AutoStatus Handler Ready'));
    } catch (e) { console.error(chalk.red('❌ AutoStatus Error:'), e.message); }
    
    try {
        const handlers = require('./commands/chatbot');
        specialHandlers.chatbot = handlers;
        console.log(chalk.green('✅ Chatbot Handler Ready'));
    } catch (e) { console.error(chalk.red('❌ Chatbot Error:'), e.message); }
    
    try {
        const handlers = require('./commands/statusforward');
        specialHandlers.statusforward = handlers;
        console.log(chalk.green('✅ StatusForward Handler Ready'));
    } catch (e) { console.error(chalk.red('❌ StatusForward Error:'), e.message); }
    
    try {
        const handlers = require('./commands/autoread');
        specialHandlers.autoread = handlers;
        console.log(chalk.green('✅ AutoRead Handler Ready'));
    } catch (e) { console.error(chalk.red('❌ AutoRead Error:'), e.message); }
    
    try {
        const handlers = require('./commands/antidelete');
        specialHandlers.antidelete = handlers;
        console.log(chalk.green('✅ AntiDelete Handler Ready'));
    } catch (e) { console.error(chalk.red('❌ AntiDelete Error:'), e.message); }
    
    try {
        const handlers = require('./commands/antilink');
        specialHandlers.antilink = handlers;
        console.log(chalk.green('✅ AntiLink Handler Ready'));
    } catch (e) { console.error(chalk.red('❌ AntiLink Error:'), e.message); }
    
    try {
        const handlers = require('./commands/antibadword');
        specialHandlers.antibadword = handlers;
        console.log(chalk.green('✅ AntiBadword Handler Ready'));
    } catch (e) { console.error(chalk.red('❌ AntiBadword Error:'), e.message); }
}

// ═════════════════════════════════════════════════════════════════════════════
// 👥 HELPER UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

const isOwnerOrSudo = require('./lib/isOwner');
const isBanned = require('./lib/isBanned');
const isAdmin = require('./lib/isAdmin');

// Extract text from any message type
function extractText(message) {
    if (!message) return '';
    
    return (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.audioMessage?.caption ||
        message.documentMessage?.caption ||
        message.stickerMessage?.caption ||
        ''
    ).trim();
}

// Check if message is from status broadcast
function isStatusUpdate(remoteJid) {
    return remoteJid === 'status@broadcast';
}

// Get mentions from message
function getMentions(message) {
    return message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔔 MESSAGE HANDLER - MAIN ENGINE
// ═════════════════════════════════════════════════════════════════════════════

async function handleMessages(sock, messageUpdate) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;
        
        const m = messages[0];
        if (!m?.message) return;

        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const isFromMe = m.key.fromMe;
        const body = extractText(m.message);
        const isGroup = chatId?.endsWith('@g.us');
        
        // ─────────────────────────────────────────────────
        // 🔴 SECURITY CHECKS
        // ─────────────────────────────────────────────────
        if (await isBanned(senderId, sock)) {
            console.log(chalk.yellow(`🚫 Banned user: ${senderId}`));
            return;
        }

        // ─────────────────────────────────────────────────
        // 🔧 BACKGROUND HANDLERS (ALWAYS RUN)
        // ─────────────────────────────────────────────────
        
        // 1. AntiDelete Handler
        if (specialHandlers.antidelete?.storeMessage) {
            await specialHandlers.antidelete.storeMessage(sock, m);
        }
        
        // 2. Message Revocation Handler
        if (m.message?.protocolMessage?.type === 0) {
            if (specialHandlers.antidelete?.handleMessageRevocation) {
                await specialHandlers.antidelete.handleMessageRevocation(sock, m);
                return;
            }
        }
        
        // 3. AutoRead Handler (before chatbot)
        if (specialHandlers.autoread?.handleAutoread) {
            await specialHandlers.autoread.handleAutoread(sock, m);
        }
        
        // 4. AntiLink/AntiBadword Middleware
        if (isGroup && !isFromMe && !await isOwnerOrSudo(senderId, sock, chatId)) {
            if (specialHandlers.antilink?.checkAndDeleteMessage) {
                const shouldDelete = await specialHandlers.antilink.checkAndDeleteMessage(sock, chatId, body, m);
                if (shouldDelete) return;
            }
            
            if (specialHandlers.antibadword?.checkAndWarn) {
                const shouldWarn = await specialHandlers.antibadword.checkAndWarn(sock, chatId, senderId, body, m);
                if (shouldWarn) return;
            }
        }

        // ─────────────────────────────────────────────────
        // 💬 CHATBOT MODE (NO PREFIX)
        // ─────────────────────────────────────────────────
        if (!body.startsWith('.')) {
            if (specialHandlers.chatbot?.handleChatbotMessage) {
                await specialHandlers.chatbot.handleChatbotMessage(sock, chatId, m, body);
            }
            return;
        }

        // ─────────────────────────────────────────────────
        // 🎯 COMMAND PARSING
        // ─────────────────────────────────────────────────
        const args = body.slice(1).split(/\s+/);
        const commandName = args[0]?.toLowerCase();
        const commandArgs = args.slice(1);
        const isOwner = isFromMe || await isOwnerOrSudo(senderId, sock, chatId);

        // ─────────────────────────────────────────────────
        // 🚀 EXECUTE COMMAND
        // ─────────────────────────────────────────────────
        await executeCommand(sock, commandName, {
            m, chatId, senderId, isFromMe, isOwner, isGroup,
            args: commandArgs, fullArgs: args, body, message: m.message
        });

    } catch (err) {
        if (!err.message?.includes('No session found') && 
            !err.message?.includes('No matching sessions') &&
            !err.message?.includes('timed out')) {
            console.error(chalk.bgRed.black('  ❌ MSG ERROR  '), chalk.red(err.message));
        }
    }
}

// ─────────────────────────────────────────────────────────────
// 🎮 COMMAND EXECUTOR
// ─────────────────────────────────────────────────────────────
async function executeCommand(sock, commandName, context) {
    if (!commandName) return;
    
    // Special commands with direct handlers
    const specialCmds = {
        'autostatus': specialHandlers.autostatus?.autoStatusCommand,
        'statusforward': specialHandlers.statusforward?.statusForwardCommand,
        'autoread': specialHandlers.autoread?.autoreadCommand,
        'antidelete': specialHandlers.antidelete?.antideleteCommand,
        'antilink': specialHandlers.antilink?.antilinkCommand,
        'antibadword': specialHandlers.antibadword?.antibadwordCommand,
    };
    
    // Check special handlers first
    if (specialCmds[commandName]) {
        try {
            await specialCmds[commandName](sock, context.chatId, context.m, context.args);
            return;
        } catch (e) {
            console.error(chalk.red(`❌ Error in ${commandName}:`, e.message));
            return;
        }
    }
    
    // Check dynamic registry
    const cmd = global.commandRegistry.get(commandName);
    if (!cmd) {
        // Unknown command - optionally send help
        return;
    }
    
    try {
        // Call the command module
        if (typeof cmd.module === 'function') {
            await cmd.module(sock, context.chatId, context.senderId, context.body.slice(1 + commandName.length), context.m);
        } else if (cmd.module?.default) {
            await cmd.module.default(sock, context.chatId, context.senderId, context.body.slice(1 + commandName.length), context.m);
        } else if (cmd.module?.command) {
            await cmd.module.command(sock, context);
        }
        
        console.log(chalk.blue(`✨ Command: ${commandName}`));
    } catch (e) {
        console.error(chalk.red(`❌ Error in command ${commandName}:`), e.message);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// 👥 GROUP EVENTS HANDLER
// ═════════════════════════════════════════════════════════════════════════════

async function handleGroupParticipantUpdate(sock, update) {
    try {
        console.log(chalk.cyan('📢 Group Update:'), update);
    } catch (e) {
        console.error(chalk.red('❌ Group Update Error:'), e.message);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 🛡️ STATUS HANDLER (Full Power)
// ════════════════════════════════════════════════════════════════════════════

async function handleStatus(sock, messageUpdate) {
    try {
        if (!sock || !messageUpdate?.messages) return;
        
        for (const m of messageUpdate.messages || []) {
            if (m.key?.remoteJid !== 'status@broadcast') continue;
            
            // 1. AutoStatus Handler (View + Like)
            if (specialHandlers.autostatus?.handleAutoStatus) {
                await specialHandlers.autostatus.handleAutoStatus(sock, { messages: [m] });
            }
            
            // 2. StatusForward Handler (Download + Forward)
            if (specialHandlers.statusforward?.handleStatusForward) {
                await specialHandlers.statusforward.handleStatusForward(sock, { messages: [m] });
            }
        }
    } catch (e) {
        // Silent - prevent crashes kwa status issues
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// 📂 FILE WATCHER - AUTO-DETECT & RELOAD
// ═════════════════════════════════════════════════════════════════════════════

function setupFileWatcher() {
    const watchDirs = ['./commands', './lib', './data'];
    const fileTimestamps = new Map();
    
    watchDirs.forEach(dir => {
        if (!fs.existsSync(dir)) return;
        
        try {
            fs.watch(dir, { persistent: true, recursive: false }, (eventType, filename) => {
                if (!filename || filename.startsWith('.')) return;
                
                const filePath = path.join(dir, filename);
                const now = Date.now();
                
                // Debounce: ignore rapid events
                if (fileTimestamps.has(filePath) && now - fileTimestamps.get(filePath) < 2000) {
                    return;
                }
                fileTimestamps.set(filePath, now);
                
                // Check if file still exists
                if (!fs.existsSync(filePath)) {
                    console.log(chalk.red(`🗑️  File removed: ${filename}`));
                    if (dir.includes('commands') && filename.endsWith('.js')) {
                        const cmdName = filename.replace('.js', '').toLowerCase();
                        global.commandRegistry.delete(cmdName);
                        console.log(chalk.yellow(`⚠️  Command Unregistered: ${cmdName}`));
                    }
                    return;
                }
                
                // File changed or created
                console.log(chalk.magenta(`🔄 File changed: ${filename}`));
                
                if (dir.includes('commands') && filename.endsWith('.js')) {
                    const cmdName = filename.replace('.js', '').toLowerCase();
                    try {
                        delete require.cache[require.resolve(filePath)];
                        const cmdModule = require(filePath);
                        global.commandRegistry.set(cmdName, {
                            name: cmdName,
                            file: filename,
                            module: cmdModule,
                            loadedAt: new Date().toISOString()
                        });
                        console.log(chalk.green(`✅ Command Reloaded: ${cmdName}`));
                    } catch (e) {
                        console.error(chalk.red(`❌ Command Reload Error [${filename}]: ${e.message}`));
                    }
                } else if (dir.includes('lib') && filename.endsWith('.js')) {
                    try {
                        delete require.cache[require.resolve(filePath)];
                        const libModule = require(filePath);
                        const libName = filename.replace('.js', '');
                        global.libRegistry.set(libName, libModule);
                        console.log(chalk.green(`✅ Lib Reloaded: ${libName}`));
                    } catch (e) {
                        console.error(chalk.red(`❌ Lib Reload Error [${filename}]: ${e.message}`));
                    }
                } else if (dir.includes('data') && filename.endsWith('.json')) {
                    try {
                        const dataName = filename.replace('.json', '');
                        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        global.dataRegistry.set(dataName, { path: filePath, data });
                        console.log(chalk.green(`✅ Data Reloaded: ${dataName}`));
                    } catch (e) {
                        console.error(chalk.red(`❌ Data Reload Error [${filename}]: ${e.message}`));
                    }
                }
            });
            
            console.log(chalk.cyan(`👁️  Watching ${dir} for changes...`));
        } catch (e) {
            console.error(chalk.red(`❌ Watcher setup error for ${dir}: ${e.message}`));
        }
    });

    console.log(chalk.cyan('✨ File watcher active - Auto-reloading on changes\n'));
}

// ═════════════════════════════════════════════════════════════════════════════
// 🚀 INITIALIZATION SEQUENCE
// ═════════════════════════════════════════════════════════════════════════════

async function initializeAllSystems() {
    return new Promise((resolve) => {
        console.log(chalk.bgCyan.black('\n  🔧  INITIALIZING MICKEY GLITCH SYSTEMS  🔧  \n'));
        
        // Load all systems
        loadLibraries();
        loadDataRegistry();
        loadCommands();
        loadSpecialHandlers();
        
        // Setup file watching (non-blocking)
        setupFileWatcher();
        
        console.log(chalk.bgGreen.black('\n  ✅  ALL SYSTEMS READY  ✅  \n'));
        console.log(chalk.cyan(`📊 Status: ${global.commandRegistry.size} commands, ${global.libRegistry.size} libs, ${global.dataRegistry.size} data files\n`));
        
        resolve();
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// 📊 COMMAND STATISTICS
// ═════════════════════════════════════════════════════════════════════════════

function getStats() {
    return {
        timestamp: new Date().toISOString(),
        commands: global.commandRegistry.size,
        libraries: global.libRegistry.size,
        dataFiles: global.dataRegistry.size,
        specialHandlers: Object.keys(specialHandlers).filter(k => specialHandlers[k]).length,
        uptime: process.uptime()
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// ✅ EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
    handleMessages,
    handleStatus,
    handleGroupParticipantUpdate,
    initializeAllSystems,
    getStats,
    executeCommand,
    extractText,
    getMentions,
    isStatusUpdate
};
