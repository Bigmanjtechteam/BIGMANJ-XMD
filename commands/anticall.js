const fs = require('fs');

const ANTICALL_PATH = './data/anticall.json';

// Load full state (enabled + call counters for auto‑ban)
function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false, callCounts: {} };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return {
            enabled: !!data.enabled,
            callCounts: data.callCounts || {}
        };
    } catch {
        return { enabled: false, callCounts: {} };
    }
}

function writeState(state) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify(state, null, 2));
    } catch (err) {
        console.log(`Failed to write anticall state: ${err.message}`);
    }
}

// Allowed numbers (never blocked, never counted)
const ALLOWED_NUMBERS = ['255715206874']; // add more if needed

function isAllowedNumber(number) {
    return ALLOWED_NUMBERS.includes(number);
}

async function anticallCommand(sock, chatId, message, args) {
    const state = readState();
    const sub = (args || '').trim().toLowerCase();

    if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
        await sock.sendMessage(chatId, {
            text: `*ANTICALL*\n\n.anticall on  - Enable auto-block on incoming calls\n.anticall off - Disable anticall\n.anticall status - Show current status`
        }, { quoted: message });
        return;
    }

    if (sub === 'status') {
        let statusText = `*[ ANTICALL STATUS ]*\n\n*🤖 BIGMANJ BOT V3* \n*by ~© bigmanj tech ™~* \nCalls: ${state.enabled ? 'BLOCKED ✅' : 'ALLOWED ❌'}\nMessages: ALLOWED ✅\nAuto‑ban after 3 calls: YES\n\n© bigmanj tech ™ with ♥︎`;
        await sock.sendMessage(chatId, { text: statusText }, { quoted: message });
        return;
    }

    const enable = sub === 'on';
    if (enable === state.enabled) {
        await sock.sendMessage(chatId, {
            text: `Anticall is already *${enable ? 'ENABLED' : 'DISABLED'}*.`
        }, { quoted: message });
        return;
    }

    // Update state (preserve call counters)
    state.enabled = enable;
    writeState(state);

    const responseText = enable
        ? `*⚙️– ANTICALL ACTIVATED*\n*BIGMANJ BOT V3*\n*by ~© bigmanj tech ™~*\n\n🔒 All incoming calls are now BLOCKED\n📝 Send a message instead\n\n✅ Status: ON\n\nStay safe from spam calls.\n\n━━━━━━━━━━━━━━━━\n© bigmanj tech ™ with ♥︎`
        : `*⚙️– ANTICALL DEACTIVATED*\n*BIGMANJ BOT V3*\n*by ~© bigmanj tech ™~*\n\n🔓 Calls are now ALLOWED\n📞 You may receive voice calls\n\n⚠️ Note: Bot may still log call attempts\n\n━━━━━━━━━━━━━━━━\n© bigmanj tech ™ with ♥︎`;

    await sock.sendMessage(chatId, { text: responseText }, { quoted: message });
}

// Handle incoming calls with auto‑ban after 3 calls
async function handleAnticall(sock, update) {
    const state = readState();
    if (!state.enabled) return;

    try {
        const call = update.call;
        if (!call) return;

        const callerId = call[0]?.from;
        if (!callerId) return;

        // Extract raw number (remove @s.whatsapp.net if present)
        let rawNumber = callerId.split('@')[0];

        // Skip if allowed number
        if (isAllowedNumber(rawNumber)) {
            console.log(`📞 Allowed number ${rawNumber} – ignoring anticall`);
            return;
        }

        // Increment call counter for this number
        const currentCount = state.callCounts[rawNumber] || 0;
        const newCount = currentCount + 1;
        state.callCounts[rawNumber] = newCount;
        writeState(state);

        // Reject the call
        await sock.rejectCall(call[0].id, callerId);
        console.log(`📵 Call rejected from: ${rawNumber} (count: ${newCount})`);

        // Auto‑ban after 3 calls
        if (newCount >= 3) {
            // Send a final warning + block (optional)
            await sock.sendMessage(callerId, {
                text: `*🤖 BIGMANJ BOT V3* \nby *~© bigmanj tech ™~*\n\n*– Voice Call Policy*\n\n*We don't accept calls 📞. Please text us.*\n*✅ Quick replies for messages*\n*❌ Calls are automatically ignored*\n\n*Thank you for understanding*\n\n*If repeated three times @${rawNumber} blocked*\n\n© bigmanj tech ™ with ♥︎`
            });
            // Optionally block the user (uncomment if your sock supports it)
            // await sock.updateBlockStatus(callerId, 'block');
            console.log(`🚫 User ${rawNumber} blocked after 3 calls`);
            // Reset counter after block so it doesn't keep sending messages
            delete state.callCounts[rawNumber];
            writeState(state);
        } else if (newCount === 1) {
            // Send the polite policy message on first call
            await sock.sendMessage(callerId, {
                text: `*🤖 BIGMANJ BOT V3* \nby *~© bigmanj tech ™~*\n\n*– Voice Call Policy*\n\n*We don't accept calls 📞. Please text us.*\n*✅ Quick replies for messages*\n*❌ Calls are automatically ignored*\n\n*Thank you for understanding*\n\n*If repeated three times @${rawNumber} blocked*\n\n© bigmanj tech ™ with ♥︎`
            });
        } else if (newCount === 2) {
            // Second call – warning
            await sock.sendMessage(callerId, {
                text: `⚠️ *WARNING* ⚠️\n\nYou have called ${newCount} time(s).\nOne more call and you will be *PERMANENTLY BLOCKED*.\n\n© bigmanj tech ™ with ♥︎`
            });
        }
    } catch (err) {
        console.log(`Anticall error: ${err.message}`);
    }
}

module.exports = { anticallCommand, readState, handleAnticall };