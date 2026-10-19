/**
 * =============================================================================
 * File: main.js
 * Description: Controller logic for Lovely Valentine / Birthday Website
 * Features:
 *   - Auto-decoding URL parameters (?d=... or ?id=...) using LZString + Keypans
 *   - 4-Digit Passcode Lock screen (if configured) or Direct Unlock
 *   - Interactive 3D Tulip Bouquet (Three.js) with Touch / Drag
 *   - Heartfelt Typewriter Love Letter Modal
 *   - 3D Floating Photo Sky with perspective & swaying animations
 *   - Audio player with auto-play on first interaction
 * =============================================================================
 */

// 1. URL Query Extraction & Global States
var params = new URLSearchParams(window.location.search);
var encodedData = params.get('d') || params.get('id');

var PASSCODE = '';
var TITLE_TEXT = 'Chào Công Chúa';
var LOVE_MESSAGE = 'Chúc công chúa luôn thật hạnh phúc! Mong rằng mỗi ngày trôi qua em đều cảm nhận được sự yêu thương và trân trọng từ anh. Dù ngoài kia có nhiều sóng gió thế nào, anh vẫn sẽ luôn ở đây nắm chặt tay em. Yêu em thật nhiều!';
var PHOTO_LIST = ['assets/a/anhz.png'];
var MUSIC = './n/c.mp3';

function fixImageUrl(url) {
    if (!url) return '';
    var trimmed = url.trim();
    if (trimmed.startsWith('assets/') || trimmed.startsWith('./') || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return 'https://' + trimmed;
}

function decompressText(text) {
    if (!text) return '';
    if (window.Keypans && typeof window.Keypans.decompressWithDictionary === 'function') {
        return window.Keypans.decompressWithDictionary(text);
    }
    return text;
}

// Helper: Lấy Blob trực tiếp từ IndexedDB lkimlam_audio_db
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

// Giải mã URL âm thanh từ IndexedDB hoặc Cloud Stream
async function resolveAudioStream(rawUrl) {
    if (!rawUrl) return './n/c.mp3';
    var trimmed = rawUrl.trim();

    // 1. Khóa lưu trực tiếp IndexedDB
    if (trimmed.startsWith('idb:')) {
        try {
            var blob = await getAudioBlobFromIDB(trimmed);
            if (blob) return URL.createObjectURL(blob);
        } catch (e) {}
    }

    // 2. URL đám mây (Catbox / Litterbox / Pomf2 / tmpfiles)
    if (/^https?:\/\//i.test(trimmed)) {
        if (trimmed.includes('tmpfiles.org/') && !trimmed.includes('tmpfiles.org/dl/')) {
            trimmed = trimmed.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        }
        try {
            var cached = await getAudioBlobFromIDB(trimmed);
            if (cached) return URL.createObjectURL(cached);
        } catch (e) {}
        return trimmed;
    }

    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
    if (trimmed.startsWith('./')) return trimmed;
    return './' + trimmed;
}

// Decompress URL payload if present
if (encodedData && typeof LZString !== 'undefined') {
    try {
        var decompressed = LZString.decompressFromEncodedURIComponent(encodedData);
        if (decompressed) {
            var parts = decompressed.split('|');

            // 1. Định dạng MyHeart: parts[0] là nhạc, parts[1] là mã màu hex (#ff9090)
            if (parts[1] && /^#[0-9a-f]{3,8}$/i.test(parts[1].trim())) {
                MUSIC = parts[0] || MUSIC;
                if (parts[2]) {
                    PHOTO_LIST = parts[2].split(/[,~]+/).filter(Boolean).map(fixImageUrl);
                }
                var msgs = parts.slice(3).map(decompressText).filter(Boolean);
                if (msgs.length) LOVE_MESSAGE = msgs.join('\n\n');
                TITLE_TEXT = 'Gửi Người Anh Yêu';
                PASSCODE = '';
            }
            // 2. Định dạng Galaxy / TextLove (3 phần: ảnh | chữ | nhạc)
            else if (parts.length === 3 && (parts[2] || '').match(/\.(mp3|wav|m4a)|idb:|n\/|a\//i)) {
                if (parts[0]) {
                    PHOTO_LIST = parts[0].split(/[,~]+/).filter(Boolean).map(fixImageUrl);
                }
                var txt = parts[1] || '';
                var msgs = txt.split(/;;;|~/).map(decompressText).filter(Boolean);
                if (msgs.length) LOVE_MESSAGE = msgs.join('\n\n');
                else if (txt) LOVE_MESSAGE = decompressText(txt);
                MUSIC = parts[2] || MUSIC;
                TITLE_TEXT = 'Gửi Tình Yêu Của Anh';
                PASSCODE = '';
            }
            // 3. Định dạng SkyGifts (3 phần: tiêu đề | ảnh | lời chúc)
            else if (parts.length === 3 && !(/^\d{4}$/.test((parts[1] || '').trim()))) {
                TITLE_TEXT = decompressText(parts[0]) || 'Chúc Mừng Bạn';
                if (parts[1]) {
                    PHOTO_LIST = parts[1].split(/[,~]+/).filter(Boolean).map(fixImageUrl);
                }
                var msgs = (parts[2] || '').split(/;;;|~/).map(decompressText).filter(Boolean);
                if (msgs.length) LOVE_MESSAGE = msgs.join('\n\n');
                else if (parts[2]) LOVE_MESSAGE = decompressText(parts[2]);
                PASSCODE = '';
            }
            // 4. Định dạng Valentine chuẩn (5 hoặc 6 phần: tiêu đề | mã pass | lời chúc | ảnh | [ảnh chọn] | nhạc)
            else {
                var rawTitle = parts[0] || '';
                var rawPass = parts[1] || '';
                var rawMsg = parts[2] || '';
                var rawImages = parts[3] || '';
                var rawMusic = '';

                if (parts.length >= 6) {
                    var candidate4 = (parts[4] || '').trim();
                    var candidate5 = (parts[5] || '').trim();
                    if (candidate5 && (candidate5.includes('.mp3') || candidate5.includes('.wav') || candidate5.includes('.m4a') || candidate5.startsWith('idb:') || candidate5.startsWith('n/') || candidate5.startsWith('a/'))) {
                        rawMusic = candidate5;
                    } else if (candidate4 && (candidate4.includes('.mp3') || candidate4.includes('.wav') || candidate4.includes('.m4a') || candidate4.startsWith('idb:') || candidate4.startsWith('n/') || candidate4.startsWith('a/'))) {
                        rawMusic = candidate4;
                    } else {
                        rawMusic = candidate5 || candidate4;
                    }
                } else {
                    rawMusic = (parts[4] || '').trim();
                }

                if (rawTitle) TITLE_TEXT = decompressText(rawTitle);
                PASSCODE = (rawPass && /^\d{4}$/.test(rawPass.trim())) ? rawPass.trim() : '';
                if (rawMsg) LOVE_MESSAGE = decompressText(rawMsg);
                if (rawImages) {
                    PHOTO_LIST = rawImages.split(/[,~]+/).filter(Boolean).map(fixImageUrl);
                }
                if (rawMusic) {
                    MUSIC = rawMusic;
                }
            }
        } else if (encodedData) {
            try {
                var jsonStr = '';
                try {
                    jsonStr = decodeURIComponent(escape(atob(encodedData)));
                } catch(e) {
                    try {
                        jsonStr = atob(encodedData);
                    } catch(e2) {}
                }
                if (jsonStr && jsonStr.startsWith('{') && jsonStr.includes('msg')) {
                    var rainData = JSON.parse(jsonStr);
                    if (rainData.msg) {
                        if (Array.isArray(rainData.msg)) {
                            LOVE_MESSAGE = rainData.msg.join('\n\n');
                        } else if (typeof rainData.msg === 'string') {
                            LOVE_MESSAGE = rainData.msg.split('|').join('\n\n');
                        }
                    }
                    if (rainData.gif) {
                        PHOTO_LIST = [fixImageUrl(rainData.gif)];
                    }
                    if (rainData.music) {
                        MUSIC = rainData.music;
                    }
                    if (rainData.rainText) {
                        TITLE_TEXT = rainData.rainText;
                    }
                    PASSCODE = '';
                }
            } catch (errJson) {}
        }
    } catch (err) {
        console.error('Lỗi giải mã payload:', err);
    }
}

// 2. Preloader
function hideLoader() {
    var loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.add('hide');
}
window.addEventListener('load', function () {
    setTimeout(hideLoader, 300);
});

// 3. Screen Activation & Passcode Check
document.addEventListener('DOMContentLoaded', function () {
    var lockScreen = document.getElementById('lock-screen');
    var heartScreen = document.getElementById('heart-screen');

    if (!PASSCODE) {
        // No passcode configured -> directly display 3D bouquet
        if (lockScreen) lockScreen.classList.remove('active');
        if (heartScreen) heartScreen.classList.add('active');

        // Unlock audio on first user touch/click anywhere
        var unlockAudio = function () {
            var audio = document.getElementById('bg-music');
            var disk = document.getElementById('music-disk');
            if (audio && audio.paused) {
                audio.play().catch(function () {});
                if (disk) disk.classList.add('playing');
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
    } else {
        // Passcode configured -> show lock screen first
        if (lockScreen) lockScreen.classList.add('active');
        if (heartScreen) heartScreen.classList.remove('active');
    }

    // Tự động phân giải nhạc từ IndexedDB hoặc Cloud Stream trước khi phát
    resolveAudioStream(MUSIC).then(function(resolvedSrc) {
        MUSIC = resolvedSrc;
        renderMusic();
    });
});

// 4. Music Player Setup
function renderMusic() {
    var container = document.getElementById('music-container');
    if (!container) return;

    container.innerHTML = 
        '<div class="music-control" onclick="toggleMusic()">' +
            '<div class="disk" id="music-disk"></div>' +
            '<span style="font-size: 14px; font-weight: bold;">Play Music</span>' +
        '</div>' +
        '<audio id="bg-music" loop preload="auto">' +
            '<source src="' + MUSIC + '" type="audio/mpeg">' +
        '</audio>';

    var audio = document.getElementById('bg-music');
    if (audio) {
        audio.onerror = function() {
            console.warn('Luồng phát lỗi, chuyển sang nhạc dự phòng');
            if (MUSIC !== './n/c.mp3') {
                audio.src = './n/c.mp3';
                audio.play().catch(function() {});
            }
        };
    }
}

function toggleMusic() {
    var audio = document.getElementById('bg-music');
    var disk = document.getElementById('music-disk');
    if (!audio) return;

    if (audio.paused) {
        audio.play().catch(function (err) { console.log('Audio play blocked:', err); });
        if (disk) disk.classList.add('playing');
    } else {
        audio.pause();
        if (disk) disk.classList.remove('playing');
    }
}

// 5. Passcode Keypad Logic
var currentInput = '';

function press(num) {
    if (currentInput.length < 4) {
        currentInput += num;
        updateDots();
        if (currentInput.length === 4) {
            checkPass();
        }
    }
}

function clearInput() {
    currentInput = '';
    updateDots();
    var dots = document.querySelectorAll('.dot');
    dots.forEach(function (dot) { dot.classList.remove('error'); });
}

function updateDots() {
    var dots = document.querySelectorAll('.dot');
    dots.forEach(function (dot, index) {
        if (index < currentInput.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

function checkPass() {
    var dots = document.querySelectorAll('.dot');
    var audio = document.getElementById('bg-music');
    var lockScreen = document.getElementById('lock-screen');
    var heartScreen = document.getElementById('heart-screen');

    if (currentInput === PASSCODE) {
        setTimeout(function () {
            if (lockScreen) lockScreen.classList.remove('active');
            if (heartScreen) heartScreen.classList.add('active');
            if (audio && audio.paused) {
                toggleMusic();
            }
        }, 300);
    } else {
        dots.forEach(function (dot) { dot.classList.add('error'); });
        setTimeout(clearInput, 250);
    }
}
