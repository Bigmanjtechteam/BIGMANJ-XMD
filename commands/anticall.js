const fs = require('fs');

const ANTICALL_PATH = './data/anticall.json';

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

const ALLOWED_NUMBERS = ['255715206874'];

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
        const statusText = 
`*[ ANTICALL STATUS ]*

*🤖 BIGMANJ BOT V3* 
*by ~© bigmanj tech ™~* 
Calls: ${state.enabled ? 'BLOCKED ✅' : 'ALLOWED ❌'}
Messages: ALLOWED ✅
Auto‑ban after 3 calls: YES

© bigmanj tech ™ with ♥︎`;
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

    state.enabled = enable;
    writeState(state);

    const responseText = enable 
        ? `*⚙️– ANTICALL ACTIVATED*\n*BIGMANJ BOT V3*\n*by ~© bigmanj tech ™~*\n\n🔒 All incoming calls are now BLOCKED\n📝 Send a message instead\n\n✅ Status: ON\n\nStay safe from spam calls.\n\n━━━━━━━━━━━━━━━━\n© bigmanj tech ™ with ♥︎`
        : `*⚙️– ANTICALL DEACTIVATED*\n*BIGMANJ BOT V3*\n*by ~© bigmanj tech ™~*\n\n🔓 Calls are now ALLOWED\n📞 You may receive voice calls\n\n⚠️ Note: Bot may still log call attempts\n\n━━━━━━━━━━━━━━━━\n© bigmanj tech ™ with ♥︎`;

    await sock.sendMessage(chatId, { text: responseText }, { quoted: message });
}

async function sendCallPolicyMessage(sock, toJid, callerNumber) {
    const policyMsg = 
`*🤖 BIGMANJ BOT V3* 
by *~© bigmanj tech ™~*

*– Voice Call Policy*

*We don't accept calls 📞. Please text us.*
*✅ Quick replies for messages*
*❌ Calls are automatically ignored*

*Thank you for understanding*

*If repeated three times @${callerNumber} blocked*

© bigmanj tech ™ with ♥︎`;
    await sock.sendMessage(toJid, { text: policyMsg });
}

async function handleAnticall(sock, update) {
    const state = readState();
    if (!state.enabled) return;

    try {
        const call = update.call;
        if (!call) return;

        const callerId = call[0]?.from;
        if (!callerId) return;

        let rawNumber = callerId.split('@')[0];
        if (isAllowedNumber(rawNumber)) {
            console.log(`📞 Allowed number ${rawNumber} – ignoring anticall`);
            return;
        }

        const currentCount = state.callCounts[rawNumber] || 0;
        const newCount = currentCount + 1;
        state.callCounts[rawNumber] = newCount;
        writeState(state);

        await sock.rejectCall(call[0].id, callerId);
        console.log(`📵 Call rejected from: ${rawNumber} (count: ${newCount})`);

        await sendCallPolicyMessage(sock, callerId, rawNumber);

        if (newCount >= 3) {
            // await sock.updateBlockStatus(callerId, 'block');
            console.log(`🚫 User ${rawNumber} blocked after 3 calls`);
            delete state.callCounts[rawNumber];
            writeState(state);
        }
    } catch (err) {
        console.log(`Anticall error: ${err.message}`);
    }
}

module.exports = { anticallCommand, readState, handleAnticall };