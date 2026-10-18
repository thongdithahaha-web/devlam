const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const numberChars = '0123456789';
const symbolChars = '!@#$%^&*()_+[]{}|;:,.<>?';

const lengthNumber = document.getElementById('lengthNumber');
const lengthRange = document.getElementById('lengthRange');
const lengthValue = document.getElementById('lengthValue');
const uppercaseEl = document.getElementById('uppercase');
const lowercaseEl = document.getElementById('lowercase');
const numbersEl = document.getElementById('numbers');
const symbolsEl = document.getElementById('symbols');
const passwordEl = document.getElementById('password');
const strengthEl = document.getElementById('strength');
const crackTimeEl = document.getElementById('crack-time');

function syncLength(val) {
    val = Math.max(4, Math.min(50, parseInt(val) || 12));
    if (lengthNumber) lengthNumber.value = val;
    if (lengthRange) lengthRange.value = val;
    if (lengthValue) lengthValue.textContent = val;
    generatePassword();
}

if (lengthNumber) lengthNumber.addEventListener('input', (e) => syncLength(e.target.value));
if (lengthRange) lengthRange.addEventListener('input', (e) => syncLength(e.target.value));

[uppercaseEl, lowercaseEl, numbersEl, symbolsEl].forEach(el => {
    if (el) el.addEventListener('change', generatePassword);
});

function generatePassword() {
    if (!passwordEl) return;
    let pool = '';
    let guaranteed = [];
    if (uppercaseEl && uppercaseEl.checked) { pool += uppercaseChars; guaranteed.push(uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]); }
    if (lowercaseEl && lowercaseEl.checked) { pool += lowercaseChars; guaranteed.push(lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]); }
    if (numbersEl && numbersEl.checked) { pool += numberChars; guaranteed.push(numberChars[Math.floor(Math.random() * numberChars.length)]); }
    if (symbolsEl && symbolsEl.checked) { pool += symbolChars; guaranteed.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]); }

    if (!pool) {
        passwordEl.textContent = 'Chọn ít nhất 1 loại ký tự!';
        if (strengthEl) strengthEl.innerHTML = 'Mức độ an toàn: <strong>Quá yếu</strong>';
        if (crackTimeEl) crackTimeEl.innerHTML = 'Thời gian phá mật khẩu ước tính: <strong>0 giây</strong>';
        return;
    }

    const len = (lengthRange && parseInt(lengthRange.value)) || 12;
    let pwdArr = [...guaranteed];
    const array = new Uint32Array(Math.max(0, len - pwdArr.length));
    crypto.getRandomValues(array);
    for (let i = 0; i < array.length; i++) {
        pwdArr.push(pool[array[i] % pool.length]);
    }
    // Shuffle
    for (let i = pwdArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pwdArr[i], pwdArr[j]] = [pwdArr[j], pwdArr[i]];
    }

    const password = pwdArr.join('');
    passwordEl.textContent = password;
    calculateStrength(password, pool.length);
}

function calculateStrength(pwd, poolSize) {
    if (!strengthEl || !crackTimeEl) return;
    const len = pwd.length;
    let entropy = len * Math.log2(poolSize || 1);
    let strength = 'Yếu';
    let color = '#e74c3c';
    let time = 'vài giây';

    if (entropy < 35) {
        strength = 'Rất yếu';
        color = '#e74c3c';
        time = 'dưới 1 giây';
    } else if (entropy < 55) {
        strength = 'Trung bình';
        color = '#f39c12';
        time = 'vài giờ đến vài ngày';
    } else if (entropy < 75) {
        strength = 'Mạnh';
        color = '#27ae60';
        time = 'vài thế kỷ';
    } else {
        strength = 'Rất mạnh';
        color = '#2ecc71';
        time = 'hàng triệu năm';
    }

    strengthEl.innerHTML = `Mức độ an toàn: <strong style="color: ${color}">${strength}</strong>`;
    crackTimeEl.innerHTML = `Thời gian phá mật khẩu ước tính: <strong>${time}</strong>`;
}

function copyPassword() {
    if (!passwordEl) return;
    const text = passwordEl.textContent;
    if (!text || text.includes('Chọn ít nhất')) return;
    navigator.clipboard.writeText(text).then(() => {
        const oldTitle = passwordEl.title;
        passwordEl.title = 'Đã sao chép!';
        setTimeout(() => passwordEl.title = oldTitle, 2000);
    }).catch(() => {
        alert('Không thể sao chép tự động.');
    });
}

function downloadPassword() {
    if (!passwordEl) return;
    const text = passwordEl.textContent;
    if (!text || text.includes('Chọn ít nhất')) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'password.txt';
    a.click();
    URL.revokeObjectURL(a.href);
}

window.addEventListener('DOMContentLoaded', generatePassword);
if (document.readyState !== 'loading') {
    generatePassword();
}
