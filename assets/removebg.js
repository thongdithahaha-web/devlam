/**
 * DevLam Canvas Background Remover
 * Pure Client-Side Implementation with Magic Wand Flood-Fill, Feathering, Brush, and Undo/Redo
 */

(function () {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const fileInput = document.getElementById('fileInput');
    const tolSlider = document.getElementById('tol');
    const tolValue = document.getElementById('tolValue');
    const featherSlider = document.getElementById('feather');
    const featherValue = document.getElementById('featherValue');
    const brushSlider = document.getElementById('brushSize');
    const brushValue = document.getElementById('brushValue');

    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const drawBtn = document.getElementById('drawBtn');
    const eraseBtn = document.getElementById('eraseBtn');
    const colorPicker = document.getElementById('colorPicker');

    let originalImageData = null;
    let undoStack = [];
    let redoStack = [];
    const maxHistory = 20;

    let currentMode = 'magic'; // 'magic' | 'draw' | 'erase'
    let isDrawing = false;
    let lastX = 0, lastY = 0;

    // Sync slider displays
    if (tolSlider && tolValue) {
        tolSlider.addEventListener('input', () => tolValue.textContent = tolSlider.value);
    }
    if (featherSlider && featherValue) {
        featherSlider.addEventListener('input', () => featherValue.textContent = featherSlider.value);
    }
    if (brushSlider && brushValue) {
        brushSlider.addEventListener('input', () => brushValue.textContent = brushSlider.value);
    }

    function saveState() {
        if (!canvas.width || !canvas.height) return;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStack.push(data);
        if (undoStack.length > maxHistory) undoStack.shift();
        redoStack = [];
    }

    // Load Image
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    // Set canvas dimensions
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    undoStack = [];
                    redoStack = [];
                    saveState();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            if (!originalImageData) return;
            saveState();
            ctx.putImageData(originalImageData, 0, 0);
        });
    }

    // Undo / Redo
    if (undoBtn) {
        undoBtn.addEventListener('click', function () {
            if (undoStack.length > 1) {
                redoStack.push(undoStack.pop());
                const prev = undoStack[undoStack.length - 1];
                ctx.putImageData(prev, 0, 0);
            }
        });
    }

    if (redoBtn) {
        redoBtn.addEventListener('click', function () {
            if (redoStack.length > 0) {
                const next = redoStack.pop();
                undoStack.push(next);
                ctx.putImageData(next, 0, 0);
            }
        });
    }

    // Download PNG
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!canvas.width || !canvas.height) return;
            const a = document.createElement('a');
            a.download = 'removed-bg.png';
            a.href = canvas.toDataURL('image/png');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // Tools toggle
    if (drawBtn) {
        drawBtn.addEventListener('click', () => {
            currentMode = currentMode === 'draw' ? 'magic' : 'draw';
            updateToolStyles();
        });
    }

    if (eraseBtn) {
        eraseBtn.addEventListener('click', () => {
            currentMode = currentMode === 'erase' ? 'magic' : 'erase';
            updateToolStyles();
        });
    }

    function updateToolStyles() {
        if (drawBtn) drawBtn.style.outline = currentMode === 'draw' ? '2px solid #38bdf8' : 'none';
        if (eraseBtn) eraseBtn.style.outline = currentMode === 'erase' ? '2px solid #38bdf8' : 'none';
    }

    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: Math.floor((e.clientX - rect.left) * scaleX),
            y: Math.floor((e.clientY - rect.top) * scaleY)
        };
    }

    // Canvas click & draw handlers
    canvas.addEventListener('mousedown', function (e) {
        if (!canvas.width || !canvas.height) return;
        const { x, y } = getCanvasCoordinates(e);

        if (currentMode === 'magic') {
            saveState();
            removeBackgroundAt(x, y);
        } else {
            isDrawing = true;
            lastX = x;
            lastY = y;
            saveState();
            drawStroke(x, y);
        }
    });

    canvas.addEventListener('mousemove', function (e) {
        if (!isDrawing) return;
        const { x, y } = getCanvasCoordinates(e);
        drawStroke(x, y);
        lastX = x;
        lastY = y;
    });

    window.addEventListener('mouseup', () => isDrawing = false);

    function drawStroke(x, y) {
        const size = parseInt(brushSlider ? brushSlider.value : 10, 10);
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);

        if (currentMode === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        } else {
            ctx.fillStyle = colorPicker ? colorPicker.value : '#000000';
            ctx.fill();
        }
    }

    // Magic Wand Flood Fill background removal
    function removeBackgroundAt(startX, startY) {
        const width = canvas.width;
        const height = canvas.height;
        if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const startIndex = (startY * width + startX) * 4;
        const targetR = data[startIndex];
        const targetG = data[startIndex + 1];
        const targetB = data[startIndex + 2];
        const targetA = data[startIndex + 3];

        if (targetA === 0) return; // Already transparent

        const tolerance = parseInt(tolSlider ? tolSlider.value : 35, 10) * 4;
        const feather = parseInt(featherSlider ? featherSlider.value : 20, 10);

        const visited = new Uint8Array(width * height);
        const queue = [startX + startY * width];
        visited[startX + startY * width] = 1;

        function colorMatch(idx) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a === 0) return true;
            const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
            return diff <= tolerance;
        }

        const removedIndices = [];

        while (queue.length > 0) {
            const pos = queue.pop();
            const px = pos % width;
            const py = Math.floor(pos / width);
            const idx = pos * 4;

            if (colorMatch(idx)) {
                data[idx + 3] = 0; // Make transparent
                removedIndices.push(pos);

                // 4-way neighbors
                if (px > 0 && !visited[pos - 1]) {
                    visited[pos - 1] = 1;
                    queue.push(pos - 1);
                }
                if (px < width - 1 && !visited[pos + 1]) {
                    visited[pos + 1] = 1;
                    queue.push(pos + 1);
                }
                if (py > 0 && !visited[pos - width]) {
                    visited[pos - width] = 1;
                    queue.push(pos - width);
                }
                if (py < height - 1 && !visited[pos + width]) {
                    visited[pos + width] = 1;
                    queue.push(pos + width);
                }
            }
        }

        // Feather boundary pixels
        if (feather > 0) {
            for (let i = 0; i < removedIndices.length; i++) {
                const pos = removedIndices[i];
                const px = pos % width;
                const py = Math.floor(pos / width);

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = px + dx;
                        const ny = py + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nidx = (ny * width + nx) * 4;
                            if (data[nidx + 3] > 0) {
                                data[nidx + 3] = Math.max(0, data[nidx + 3] - Math.round(255 / (feather + 1)));
                            }
                        }
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }
})();
