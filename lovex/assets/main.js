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

// Decompress URL payload if present
if (encodedData && typeof LZString !== 'undefined') {
    try {
        var decompressed = LZString.decompressFromEncodedURIComponent(encodedData);
        if (decompressed) {
            var parts = decompressed.split('|');
            var rawTitle = parts[0] || '';
            var rawPass = parts[1] || '';
            var rawMsg = parts[2] || '';
            var rawImages = parts[3] || '';
            var rawMusic = parts[4] || '';

            if (rawTitle) TITLE_TEXT = decompressText(rawTitle);
            PASSCODE = rawPass ? rawPass.trim() : '';
            if (rawMsg) LOVE_MESSAGE = decompressText(rawMsg);
            if (rawImages) {
                PHOTO_LIST = rawImages.split('~').filter(Boolean).map(fixImageUrl);
            }
            if (rawMusic) {
                var trimmedMusic = rawMusic.trim();
                if (/^https?:\/\//i.test(trimmedMusic) || trimmedMusic.startsWith('data:') || trimmedMusic.startsWith('blob:')) {
                    MUSIC = trimmedMusic;
                } else if (trimmedMusic.startsWith('./')) {
                    MUSIC = trimmedMusic;
                } else {
                    MUSIC = './' + trimmedMusic;
                }
            }
        }
    } catch (err) {
        console.error('Lỗi giải mã LZString:', err);
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

    renderMusic();
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
        '<audio id="bg-music" loop>' +
            '<source src="' + MUSIC + '" type="audio/mpeg">' +
        '</audio>';
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
