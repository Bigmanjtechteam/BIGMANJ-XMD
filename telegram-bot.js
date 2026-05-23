const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search'); 
const settings = require('./settings');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const TELEGRAM_DATA_DIR = path.join(__dirname, 'data');
const TELEGRAM_DATA_FILE = path.join(TELEGRAM_DATA_DIR, 'telegramPairs.json');
const TELEGRAM_BASE_URL = (token) => `https://api.telegram.org/bot${token}`;

const AXIOS_DEFAULTS = {
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

// Exponential backoff retry mechanism
async function tryRequest(getter, attempts = 2) {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
        try { return await getter(); } 
        catch (err) { lastErr = err; if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i)); }
    }
    throw lastErr;
}

// Get MP3/Audio Link na Multi-API JSON Fallback
async function getYoutubeMp3(ytUrl) {
    const apis = [
        async () => {
            const res = await axios.get(`https://nayan-video-downloader.vercel.app/youtube?url=${encodeURIComponent(ytUrl)}`, AXIOS_DEFAULTS);
            const formats = res.data?.data?.data?.formats || [];
            const found = formats.find(f => f.type === 'audio' || f.mimeType?.includes('audio')) || formats[formats.length - 1];
            if (found?.url) return found.url;
            throw new Error();
        },
        async () => {
            const res = await axios.get(`https://apiskeith.top/download/audio?url=${encodeURIComponent(ytUrl)}`, AXIOS_DEFAULTS);
            return res.data?.result?.url || res.data?.result?.download || res.data?.result || res.data?.url || res.data?.download || res.data?.audio;
        },
        async () => {
            const res = await axios.get(`https://eliteprotech-apis.zone.id/ytmp3?url=${encodeURIComponent(ytUrl)}`, AXIOS_DEFAULTS);
            return res.data?.result?.url || res.data?.result?.download || res.data?.url || res.data?.download;
        }
    ];

    for (const api of apis) {
        try {
            const downloadUrl = await tryRequest(api);
            if (downloadUrl && typeof downloadUrl === 'string') return downloadUrl;
        } catch { continue; }
    }
    throw new Error('API zote za MP3 zimefeli.');
}

// Get MP4/Video Link na Multi-API JSON Fallback
async function getYoutubeMp4(ytUrl) {
    const apis = [
        async () => {
            const res = await axios.get(`https://nayan-video-downloader.vercel.app/youtube?url=${encodeURIComponent(ytUrl)}`, AXIOS_DEFAULTS);
            const formats = res.data?.data?.data?.formats || [];
            const found = formats.find(f => f.type === 'video_with_audio' && f.ext === 'mp4') || formats.find(f => f.ext === 'mp4') || formats[0];
            if (found?.url) return found.url;
            throw new Error();
        },
        async () => {
            const res = await axios.get(`https://apiskeith.top/download/mp4?url=${encodeURIComponent(ytUrl)}`, AXIOS_DEFAULTS);
            return res.data?.result?.url || res.data?.result?.download || res.data?.result || res.data?.url || res.data?.download || res.data?.video;
        },
        async () => {
            const res = await axios.get(`https://eliteprotech-apis.zone.id/ytmp4?url=${encodeURIComponent(ytUrl)}`, AXIOS_DEFAULTS);
            return res.data?.result?.url || res.data?.result?.download || res.data?.url || res.data?.download;
        }
    ];

    for (const api of apis) {
        try {
            const downloadUrl = await tryRequest(api);
            if (downloadUrl && typeof downloadUrl === 'string') return downloadUrl;
        } catch { continue; }
    }
    throw new Error('API zote za MP4 zimefeli.');
}

async function removeWebhookIfSet(token) {
  try {
    const resp = await axios.post(`${TELEGRAM_BASE_URL(token)}/deleteWebhook`);
    return resp?.data?.ok || false;
  } catch (err) { return false; }
}

function ensureTelegramDataFile() {
  if (!fs.existsSync(TELEGRAM_DATA_DIR)) fs.mkdirSync(TELEGRAM_DATA_DIR, { recursive: true });
  if (!fs.existsSync(TELEGRAM_DATA_FILE)) fs.writeFileSync(TELEGRAM_DATA_FILE, JSON.stringify([]), 'utf8');
}

function loadAllowedChats() {
  ensureTelegramDataFile();
  try {
    const raw = fs.readFileSync(TELEGRAM_DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
  } catch (error) { return []; }
}

function saveAllowedChats(chats) {
  const unique = Array.from(new Set(chats.map(id => String(id))));
  fs.writeFileSync(TELEGRAM_DATA_FILE, JSON.stringify(unique, null, 2), 'utf8');
}

function isChatAllowed(chatId) { return loadAllowedChats().includes(String(chatId)); }

function addAllowedChat(chatId) {
  const allowed = loadAllowedChats();
  if (!allowed.includes(String(chatId))) {
    allowed.push(String(chatId));
    saveAllowedChats(allowed);
  }
}

function removeAllowedChat(chatId) {
  const allowed = loadAllowedChats().filter(id => id !== String(chatId));
  saveAllowedChats(allowed);
}

// 👑 MENU APPEARANCE UPGRADE
function formatHelpText() {
  return [
    '┏━━━━━━━━━━━━━━━━━━━━┓',
    '┃   *MICKEY GLITCH TELEGRAM BOT* ┃',
    '┗━━━━━━━━━━━━━━━━━━━━┛',
    '',
    '🛡️ *PAIRING SYSTEM (INDEX)*',
    '┣ /pair `<code|number>` ➔ Connect chat to bot',
    '┗ /unpair ➔ Disconnect chat from bot',
    '',
    '🤖 *CORE COMMANDS*',
    '┣ /menu , /help ➔ Main menu list',
    '┣ /ping ➔ Test bot latency',
    '┣ /alive ➔ Check system status',
    '┣ /owner ➔ Contact developer info',
    '┗ /update ➔ Pull code from GitHub (Owner)',
    '',
    '🎵 *MEDIA & AUTOMATION*',
    '┣ /play `<song name>` ➔ Download YT Audio',
    '┣ /video `<video name>` ➔ Download YT Video',
    '┣ /shazam ➔ Identify song from replied audio/video',
    '┗ /stickertelegram `<link>` ➔ Fetch sticker pack info',
    '',
    '⏳ _Powered by Mickey Developer_'
  ].join('\n');
}

function isOwnerChat(chatId) {
  const ownerId = String(settings.telegram?.ownerId || '').trim();
  return ownerId && String(chatId) === ownerId;
}

function isTelegramAuthorized(chatId) {
  if (isChatAllowed(chatId)) return true;
  if (isOwnerChat(chatId)) return true;
  if (String(settings.commandMode || '').toLowerCase() === 'public') return true;
  return false;
}

// FIXED: Yeyote sasa anaweza kutumia command ya pair kwa kutumia muundo na index ya system config
function canPair(chatId, code) {
  const inputCode = String(code || '').trim();
  const ownerId = String(settings.telegram?.ownerId || '').trim();
  const ownerNumber = String(settings.ownerNumber || '').replace(/\D/g, '').trim();
  const pairCode = String(settings.telegram?.pairCode || '').trim();

  if (ownerId && String(chatId) === ownerId) return true;
  if (!inputCode) return false;
  
  if (pairCode && inputCode === pairCode) return true;
  if (ownerNumber && inputCode === ownerNumber) return true;

  return false;
}

async function sendTelegramMessage(chatId, text, extra = {}) {
  const token = settings.telegram?.botToken?.trim();
  if (!token || !chatId) return;
  try {
    await axios.post(`${TELEGRAM_BASE_URL(token)}/sendMessage`, {
      chat_id: String(chatId),
      text,
      disable_web_page_preview: true,
      parse_mode: 'Markdown',
      ...extra
    });
  } catch (error) {
    console.error('Telegram sendMessage failed:', error?.response?.data || error.message);
  }
}

// Boresho: Inatuma Thumbnail ya video kwanza
async function sendTelegramPhoto(chatId, photoUrl, caption = '') {
  const token = settings.telegram?.botToken?.trim();
  if (!token || !chatId) return;
  try {
    await axios.post(`${TELEGRAM_BASE_URL(token)}/sendPhoto`, {
      chat_id: String(chatId),
      photo: photoUrl,
      caption: caption,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Telegram sendPhoto failed:', error?.response?.data || error.message);
  }
}

async function sendTelegramMedia(chatId, type, url, caption = '') {
  const token = settings.telegram?.botToken?.trim();
  if (!token || !chatId) return;
  const endpoint = type === 'audio' ? 'sendAudio' : 'sendVideo';
  try {
    await axios.post(`${TELEGRAM_BASE_URL(token)}/${endpoint}`, {
      chat_id: String(chatId),
      [type]: url,
      caption: caption,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error(`Telegram ${endpoint} failed:`, error?.response?.data || error.message);
    await sendTelegramMessage(chatId, `❌ Kushindwa kutuma ${type}. Faili limezuiwa au ni kubwa mno.`);
  }
}

async function handleStickerTelegram(chatId, args) {
  if (!args.length) return sendTelegramMessage(chatId, '⚠️ Tumia: /stickertelegram https://t.me/addstickers/PackName');
  const url = args[0].trim();
  const match = url.match(/(?:https?:\/\/)?t\.me\/addstickers\/(.+)/i);
  if (!match) return sendTelegramMessage(chatId, '❌ URL ya Sticker si sahihi.');

  const packName = match[1];
  try {
    const response = await axios.get(`${TELEGRAM_BASE_URL(settings.telegram.botToken)}/getStickerSet`, { params: { name: packName } });
    if (!response.data?.ok || !response.data.result) throw new Error();

    const stickerSet = response.data.result;
    const stickers = stickerSet.stickers || [];
    const sample = stickers.slice(0, 8).map((st, i) => `${i + 1}. ${st.emoji || '☀️'}`);

    const text = [`📦 Sticker Pack: ${stickerSet.title}`, `🆔 Name: ${stickerSet.name}`, `🧩 Count: ${stickers.length}`, '', 'Samples:', sample.join('\n')].join('\n');
    await sendTelegramMessage(chatId, text);
  } catch (error) {
    await sendTelegramMessage(chatId, '❌ Ilifeli kupata maelezo ya sticker pack.');
  }
}

async function handleUpdateCommand(chatId, isActiveOwner) {
  if (!isActiveOwner) return sendTelegramMessage(chatId, '🚷 Amri hii ni maalum kwa Owner tu!');
  await sendTelegramMessage(chatId, '⏳ *Inatafuta mabadiliko kutoka GitHub (Mickey-Glitch)...*');

  const rawUrl = 'https://raw.githubusercontent.com/Mickeydeveloper/Mickey-Glitch/main/telegram-bot.js';
  try {
    const response = await axios.get(rawUrl, { responseType: 'text' });
    if (response.status === 200 && response.data) {
      fs.writeFileSync(__filename, response.data, 'utf8');
      await sendTelegramMessage(chatId, '✅ *Msimbo umesasishwa kwa mafanikio!* Inajiwasha upya...');
      setTimeout(() => { process.exit(0); }, 2000);
    } else { throw new Error('Data haikupatikana'); }
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ *Mchakato umefeli:* ${error.message}`);
  }
}

// 🎧 SHAZAM TELEGRAM COMMAND IMPLEMENTATION
async function handleShazamCommand(chatId, repliedMessage) {
    const token = settings.telegram?.botToken?.trim();
    const media = repliedMessage.audio || repliedMessage.video || repliedMessage.voice;
    
    if (!media || !media.file_id) {
        return sendTelegramMessage(chatId, '❌ *Tafadhali reply ujumbe wa audio au video kwa kutumia /shazam*');
    }

    if (!settings.acrcloud || !settings.acrcloud.access_key) {
        return sendTelegramMessage(chatId, '❌ *ACRCloud API haijawekwa kwenye settings.js!*');
    }

    await sendTelegramMessage(chatId, '🔍 *Inatambua wimbo, subiri kidogo...*');

    try {
        // Pata file path kutoka Telegram Seva
        const fileRes = await axios.get(`${TELEGRAM_BASE_URL(token)}/getFile?file_id=${media.file_id}`);
        if (!fileRes.data?.ok) throw new Error("Mchakato wa kupata faili umefeli.");
        
        const filePath = fileRes.data.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

        // Download faili kwenda kwenye buffer ya ndani
        const responseBuffer = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(responseBuffer.data);

        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const tempInput = path.join(tempDir, `shazam_in_${Date.now()}`);
        const tempAudio = path.join(tempDir, `shazam_out_${Date.now()}.wav`);

        fs.writeFileSync(tempInput, mediaBuffer);

        try {
            await execAsync(`ffmpeg -i "${tempInput}" -vn -acodec pcm_s16le -ar 44100 -ac 2 -t 15 "${tempAudio}" -y`);
        } catch (e) {
            fs.copySync(tempInput, tempAudio);
        }

        const acrcloud = require('acrcloud');
        const acr = new acrcloud({
            host: settings.acrcloud.host,
            access_key: settings.acrcloud.access_key,
            access_secret: settings.acrcloud.access_secret
        });

        const result = await acr.identify(fs.readFileSync(tempAudio));

        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);

        if (result.status?.code === 0 && result.metadata?.music?.length > 0) {
            const song = result.metadata.music[0];
            const title = song.title || 'Unknown';
            const artist = song.artists?.[0]?.name || 'Unknown';

 const caption = `🎵 *SHAZAM IDENTIFIED!*

━━━━━━━━━━━━━━━━━━

📌 *Title:* ${title}
👤 *Artist:* ${artist}
💿 *Album:* ${song.album?.name || 'N/A'}

━━━━━━━━━━━━━━━━━━
`;
 `💡 _Unaweza kudownload kwa kuandika:_ \n`/play ${title} ${artist}`;

            // Tuma ujumbe ukiwa na Inline Button ya Telegram kwa urahisi
            await sendTelegramMessage(chatId, caption, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: `📥 Download MP3`, callback_data: `play_${title}` }
                    ]]
                }
            });
        } else {
            await sendTelegramMessage(chatId, '❌ *Wimbo haukutambulika.* Jaribu kipande chenye sauti safi.');
        }
    } catch (err) {
        console.error("SHAZAM ERROR:", err);
        await sendTelegramMessage(chatId, '❌ Mfumo wa Shazam umepata tatizo la kiufundi.');
    }
}

async function handleUpdate(update) {
  // Kushughulikia inline button click (Callback Query)
  if (update.callback_query) {
      const callback = update.callback_query;
      const chatId = callback.message.chat.id;
      const data = callback.data;
      if (data.startsWith('play_')) {
          const trackTitle = data.replace('play_', '');
          await sendTelegramMessage(chatId, `🎵 *Inasindika amri ya kupakua:* _${trackTitle}_...`);
          // Trigger automatic flow
          const searchResult = await yts(trackTitle);
          const video = searchResult.videos[0];
          if (video) {
              await sendTelegramPhoto(chatId, video.thumbnail, `🎵 *${video.title}*\n📥 *Inapakua Audio...*`);
              const audioUrl = await getYoutubeMp3(video.url);
              await sendTelegramMedia(chatId, 'audio', audioUrl, `🎵 *Title:* ${video.title}`);
          }
      }
      return;
  }

  const message = update.message || update.edited_message;
  if (!message) return;

  const chatId = message.chat?.id;
  const sender = message.from;
  const rawText = String(message.text || '').trim();

  // Mfumo wa Shazam unakagua kama kuna reply
  if (rawText.toLowerCase().startsWith('/shazam') || rawText.toLowerCase().startsWith('.shazam')) {
      if (message.reply_to_message) {
          await handleShazamCommand(chatId, message.reply_to_message);
      } else {
          await sendTelegramMessage(chatId, '❌ *Tafadhali reply kwenye audio/video kisha uandike /shazam*');
      }
      return;
  }

  if (!rawText.startsWith('/') && !rawText.startsWith('.')) return;

  const cleanText = rawText.substring(1);
  const parts = cleanText.split(/\s+/);
  const commandText = parts[0].toLowerCase();
  const args = parts.slice(1);
  const fullArgs = args.join(' ');

  const allowed = isTelegramAuthorized(chatId);
  const isActiveOwner = isOwnerChat(chatId);

  if (commandText === 'start' || commandText === 'menu' || commandText === 'help') {
    await sendTelegramMessage(chatId, formatHelpText());
    return;
  }

  if (commandText === 'pair') {
    if (isChatAllowed(chatId) || isActiveOwner) {
      return sendTelegramMessage(chatId, '✅ Chat hii tayari imeshaunganishwa (Paired) na Mfumo wa Index.');
    }
    const code = args[0] || '';
    if (!canPair(chatId, code)) {
      return sendTelegramMessage(chatId, '❌ Pairing imekataa. Tumia code sahihi au namba ya mmiliki kutoka kwenye Index.');
    }
    addAllowedChat(chatId);
    return sendTelegramMessage(chatId, '✅ Bot imepairishwa kikamilifu kwenye index ya chat hii! Tumia /menu kuanza.');
  }

  if (commandText === 'unpair') {
    if (!isChatAllowed(chatId)) return sendTelegramMessage(chatId, 'ℹ️ Chat hii haijawa paired bado.');
    removeAllowedChat(chatId);
    return sendTelegramMessage(chatId, '✅ Chat imeondolewa kwenye pairing kwa mafanikio.');
  }

  if (commandText === 'update') {
    await handleUpdateCommand(chatId, isActiveOwner);
    return;
  }

  if (!allowed) {
    return sendTelegramMessage(chatId, '⚠️ Chat hii haijapairishwa bado. Andika `/pair <code|namba>` ili kuitumia.');
  }

  switch (commandText) {
    case 'ping':
      return sendTelegramMessage(chatId, `🏓 Pong! Inaitikia vizuri kabisa.\n👤 Mtumiaji: ${sender?.username || sender?.first_name || 'Mgeni'}`);

    case 'alive':
      return sendTelegramMessage(chatId, `✅ Mickey Glitch Bot iko Active.\n✨ Jukwaa: Telegram Engine\n⚙️ Usanidi: Safi`);

    case 'owner':
      return sendTelegramMessage(chatId, `👤 Mmiliki: ${settings.botOwner || 'Mickey Developer'}\n📱 WhatsApp: https://wa.me/${settings.ownerNumber}`);

    case 'stickertelegram':
      return handleStickerTelegram(chatId, args);

    // FIXED: Play command inatuma THUMBNAIL kwanza kabla ya audio!
    case 'play': {
      if (!fullArgs) return sendTelegramMessage(chatId, '⚠️ Tafadhali weka jina la wimbo! Mfano: `/play Jux Enjoy`');
      await sendTelegramMessage(chatId, `🎵 *Inatafuta wimbo:* _${fullArgs}_...`);

      try {
        const searchResult = await yts(fullArgs);
        const video = searchResult.videos[0];
        if (!video) return sendTelegramMessage(chatId, '❌ Wimbo haukupatikana YouTube.');

        // Tuma Thumbnail kwanza kabisa
        await sendTelegramPhoto(chatId, video.thumbnail, `🎵 *${video.title}*\n⏱️ Muda: ${video.timestamp}\n📥 *Inapakua Audio hivi sasa...*`);

        const audioUrl = await getYoutubeMp3(video.url);
        await sendTelegramMedia(chatId, 'audio', audioUrl, `🎵 *Title:* ${video.title}\n🔗 *Link:* ${video.url}\n\n> *Mickey Developer* ⚡`);
      } catch (err) {
        console.error(err);
        await sendTelegramMessage(chatId, '❌ Ilitokea hitilafu wakati wa kupakua audio.');
      }
      return;
    }

    // FIXED: Video command inatuma THUMBNAIL kwanza kabla ya video!
    case 'video': {
      if (!fullArgs) return sendTelegramMessage(chatId, '⚠️ Tafadhali weka jina la video! Mfano: `/video Marioo Mi Amor`');
      await sendTelegramMessage(chatId, `📹 *Inatafuta video:* _${fullArgs}_...`);

      try {
        const searchResult = await yts(fullArgs);
        const video = searchResult.videos[0];
        if (!video) return sendTelegramMessage(chatId, '❌ Video haikutumbukia kwenye utafutaji.');

        // Tuma Thumbnail kwanza kabisa
        await sendTelegramPhoto(chatId, video.thumbnail, `🎥 *${video.title}*\n⏱️ Muda: ${video.timestamp}\n📥 *Inapakua Video hivi sasa...*`);

        const videoUrl = await getYoutubeMp4(video.url);
        await sendTelegramMedia(chatId, 'video', videoUrl, `📹 *Title:* ${video.title}\n🔗 *Link:* ${video.url}\n\n> *Mickey Developer* ⚡`);
      } catch (err) {
        console.error(err);
        await sendTelegramMessage(chatId, '❌ Imefeli kupata link ya video kutoka kwenye seva.');
      }
      return;
    }

    default:
      if (rawText.startsWith('/') || rawText.startsWith('.')) {
        return sendTelegramMessage(chatId, `❌ Amri ya '${commandText}' haipo.\nTumia /menu kuona zilizopo.`);
      }
      return;
  }
}

async function startTelegramBot() {
  const token = settings.telegram?.botToken?.trim();
  if (!token) {
    console.error('Telegram botToken haipo kwenye settings.js');
    process.exit(1);
  }

  ensureTelegramDataFile();
  try { await removeWebhookIfSet(token); } catch (e) {}

  let offset = 0;
  console.log('✅ Telegram Bot Engine Imewashwa Vizuri kwa Mfumo wa Index.');

  while (true) {
    try {
      const response = await axios.get(`${TELEGRAM_BASE_URL(token)}/getUpdates`, {
        params: { offset: offset + 1, timeout: 30, allowed_updates: ['message', 'edited_message', 'callback_query'] },
        timeout: 60000
      });

      if (!response.data?.ok) throw new Error();
      const updates = response.data.result || [];
      for (const update of updates) {
        offset = update.update_id;
        await handleUpdate(update);
      }
    } catch (error) {
      if (error?.response?.data?.error_code === 409) {
        try { await removeWebhookIfSet(token); } catch (e) {}
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

module.exports = { startTelegramBot, isChatAllowed, addAllowedChat, removeAllowedChat };
