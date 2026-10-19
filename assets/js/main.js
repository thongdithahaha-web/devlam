/**
 * =============================================================================
 * File: main.js
 * Project: Lovely 3D Heart - TLoves Clone 100%
 * Description: Controller logic for decompressing message payloads and launching
 *              the 3D Heart visualizer (Three.js + React Three Fiber / Troika)
 * =============================================================================
 */



function decompressText(text) {
    if (!text) return text;
    if (typeof decompressWithDictionary === 'function') {
        return decompressWithDictionary(text);
    }
    if (window.Keypans && typeof window.Keypans.decompressWithDictionary === 'function') {
        return window.Keypans.decompressWithDictionary(text);
    }
    return text;
}

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    let d = params.get('d') || params.get('id');
    if (!d && window.location.hash) {
        const hashStr = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashStr);
        d = hashParams.get('d') || hashParams.get('id') || (!hashStr.includes('=') ? hashStr : null);
    }
    return {
        'data': d || null
    };
}

function isMusicString(str) {
    if (!str) return false;
    var s = str.trim().toLowerCase();
    return s.endsWith('.mp3') || s.endsWith('.wav') || s.endsWith('.m4a') || 
           s.startsWith('idb:') || s.startsWith('n/') || s.startsWith('a/') || 
           s.includes('.mp3?') || s.includes('catbox') || s.includes('pomf') || s.includes('litterbox');
}

const { data: compressedData } = getQueryParams();
let rawMessage = 'Anh yêu em',
    rawMusic = 'n/t.mp3',
    messagesArray = [],
    imagesArray = [],
    hideHeartsFlag = '0';

if (compressedData && typeof LZString !== 'undefined') {
    try {
        const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
        if (decompressed) {
            const parts = decompressed.split('|');

            // 1. Định dạng LittleLove: [music, ...messages]
            if (isMusicString(parts[0])) {
                rawMusic = parts[0];
                messagesArray = parts.slice(1).map(decompressText).map(s => s.trim()).filter(Boolean);
                rawMessage = messagesArray.join(', ');
            }
            // 2. Định dạng TextLoveV2: [mainText, subText, music, ...messages]
            else if (isMusicString(parts[2])) {
                rawMusic = parts[2];
                const mainTxt = decompressText(parts[0]).trim();
                const subTxt = decompressText(parts[1]).trim();
                const moreMsgs = parts.slice(3).map(decompressText).map(s => s.trim()).filter(Boolean);
                messagesArray = [mainTxt, subTxt, ...moreMsgs].filter(Boolean);
                rawMessage = mainTxt + (subTxt ? ' - ' + subTxt : '');
            }
            // 3. Định dạng TextAnim: [line1, line2, icon, music]
            else if (isMusicString(parts[3])) {
                rawMusic = parts[3];
                const l1 = decompressText(parts[0]).trim();
                const l2 = decompressText(parts[1]).trim();
                const icon = (parts[2] || '').trim();
                messagesArray = [l1 + ' ' + icon, l2].filter(Boolean);
                rawMessage = l1 + ' ' + icon + ', ' + l2;
            }
            // 4. Định dạng LoveQuiz: [imgMain, imgSub, mainText, subText, yesText, noText]
            else if (parts.length >= 5 && ((parts[0] && parts[0].includes('http')) || (parts[1] && parts[1].includes('http')))) {
                imagesArray = [parts[0], parts[1]].filter(Boolean);
                messagesArray = [
                    decompressText(parts[2]).trim(),
                    decompressText(parts[3]).trim(),
                    'Yes: ' + decompressText(parts[4]).trim(),
                    'No: ' + decompressText(parts[5]).trim()
                ].filter(Boolean);
                rawMessage = messagesArray.join(' | ');
            }
            // 5. Định dạng tiêu chuẩn (TLoves / DearText): [messagesTilde, music, imagesTilde, hideHearts]
            else {
                const compressedMsgs = parts[0] || '';
                if (parts[1] && (isMusicString(parts[1]) || parts[1].startsWith('http') || parts[1].includes('.'))) {
                    rawMusic = parts[1];
                }
                const compressedImages = parts[2] || '';
                hideHeartsFlag = parts[3] || '0';

                messagesArray = compressedMsgs.split('~')
                    .map(msg => decompressText(msg).trim())
                    .filter(Boolean);
                rawMessage = messagesArray.join(', ');

                if (compressedImages) {
                    imagesArray = compressedImages.split('~')
                        .map(img => img.trim())
                        .filter(Boolean);
                }
            }
        }
    } catch (err) {
        console.error('Lỗi giải mã LZString:', err);
    }
}

if (messagesArray.length === 0) {
    messagesArray = [
        'Chúc bạn 20/10 vui vẻ nhaaa 🌷',
        'Chúc bạn luôn xinh đẹp và gặp nhiều điều may mắn nhooo 💗',
        'Mong bạn ngày nào cũng vui vẻ, cười thật nhiều nhaaa',
        'Chúc bạn luôn hạnh phúc và đạt được những điều mình mong muốn',
        'Chúc bạn 20/10 nhận được thật nhiều niềm vui nèee 🎀',
        'Mong mọi điều tốt đẹp sẽ đến với bạn nha 🫶'
    ];
    rawMessage = messagesArray.join(', ');
}

function getAudioBlobFromIDB(id) {
    return new Promise(function(resolve) {
        if (!window.indexedDB) return resolve(null);
        var req = indexedDB.open('lkimlam_audio_db', 1);
        req.onerror = function() { resolve(null); };
        req.onsuccess = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('audios')) return resolve(null);
            var tx = db.transaction('audios', 'readonly');
            var store = tx.objectStore('audios');
            var getReq = store.get(id);
            getReq.onsuccess = function() {
                if (getReq.result && getReq.result.blob) resolve(getReq.result.blob);
                else resolve(null);
            };
            getReq.onerror = function() { resolve(null); };
        };
    });
}

async function resolveAudioStream(rawUrl) {
    if (!rawUrl) return './n/t.mp3';
    var trimmed = rawUrl.trim();
    if (trimmed.startsWith('idb:')) {
        try {
            var blob = await getAudioBlobFromIDB(trimmed);
            if (blob) return URL.createObjectURL(blob);
        } catch(e) {}
    }
    if (/^https?:\/\//i.test(trimmed)) {
        if (trimmed.includes('tmpfiles.org/') && !trimmed.includes('tmpfiles.org/dl/')) {
            trimmed = trimmed.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        }
        try {
            var cached = await getAudioBlobFromIDB(trimmed);
            if (cached) return URL.createObjectURL(cached);
        } catch(e) {}
        return trimmed;
    }
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('./')) return trimmed;
    return './' + trimmed;
}

// Determine safe music URL & play audio
let audio = new Audio();
audio.loop = true;

resolveAudioStream(rawMusic || 'n/t.mp3').then(function(src) {
    audio.src = src;
});

audio.onerror = function() {
    if (audio.src !== './n/t.mp3') {
        audio.src = './n/t.mp3';
    }
};

const startAudio = () => {
    audio.play().catch(err => {
        console.log('Chờ người dùng tương tác để phát nhạc:', err);
    });
};

document.body.addEventListener('click', startAudio, { once: true });
document.body.addEventListener('touchstart', startAudio, { once: true });

// Setup data-page payload for 3D visualizer
const data = {
    'component': 'views/home',
    'props': {
        'message': rawMessage,
        'client': {
            'id': 1,
            'fontName': 'Mali',
            'color': '#EE66A6',
            'messages': messagesArray,
            'image': imagesArray.length > 0 ? imagesArray : [''],
            'hideHearts': hideHeartsFlag === '1'
        },
        'clientId': '1'
    },
    'url': ''
};

const appEl = document.getElementById('app');
if (appEl) {
    appEl.setAttribute('data-page', JSON.stringify(data));
}

// Dynamically load the 3D heart visualizer module
const script = document.createElement('script');
script.type = 'module';
script.src = './assets/js/dear.js';
document.head.appendChild(script);


