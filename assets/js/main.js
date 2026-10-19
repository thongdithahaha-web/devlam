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
    return {
        'data': params.get('d') || params.get('id') || null
    };
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
            const compressedMsgs = parts[0] || '';
            rawMusic = parts[1] || rawMusic;
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


