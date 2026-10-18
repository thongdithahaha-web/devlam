/**
 * DevLam Portal Main Script - Clean & Standalone
 * Supports full offline/local execution without domain locks
 */

let rawAllData = [];
let allWebProducts = [];
let allAppProducts = [];

const itemsPerPage = 8;
let currentWebPage = 1;
let currentAppPage = 1;
let activeTab = 'web';
let currentCategoryFilter = 'all';

function getItemDescription(item) {
    return item.descriptions || item.description || 'Chưa có mô tả chi tiết.';
}

function getItemUseLink(item) {
    const link = item.paymentLinksss || item.paymentLinkssss || item.paymentLinkss || item.paymentLinks || item.demoLink || item.link;
    return (link && link !== "#") ? link : './inputs/flower.html';
}

function getItemDownloadLink(item) {
    const link = item.downloadLink || item.paymentLink;
    return (link && link !== "#") ? link : './download/taive.html?id=update';
}

function getItemImage(item) {
    return item.image || item.img || './assets/anh/loves.jpg';
}

function switchTab(tab) {
    activeTab = tab;
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'web') {
        tabs[0].classList.add('active');
        document.getElementById('web-section').style.display = 'block';
        document.getElementById('app-section').style.display = 'none';
        renderWebProducts(currentWebPage);
    } else {
        tabs[1].classList.add('active');
        document.getElementById('web-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        renderAppProducts(currentAppPage);
    }
}

function toggleExploreMenu() {
    document.getElementById("explore-menu").classList.toggle("show");
}

function selectExploreCategory(category, element) {
    currentCategoryFilter = category;

    // Cập nhật giao diện nút bấm
    const exploreBtn = element ? element.closest('.explore-dropdown-wrapper')?.querySelector('.explore-btn') : null;
    if (exploreBtn && element) {
        if (category === 'all') {
            exploreBtn.innerHTML = `<i class="fa-solid fa-compass"></i> Khám phá <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem;"></i>`;
        } else {
            exploreBtn.innerHTML = `${element.innerHTML} <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem;"></i>`;
        }
    }

    // Đánh dấu mục đang chọn
    document.querySelectorAll("#explore-menu .menu-item").forEach(item => item.classList.remove("active"));
    if (element) element.classList.add("active");

    // Đóng menu
    const menu = document.getElementById("explore-menu");
    if (menu) menu.classList.remove("show");

    // Tiến hành lọc dữ liệu
    processDataFiltering();
}

function processDataFiltering() {
    let filteredData = rawAllData;
    
    if (currentCategoryFilter !== 'all') {
        filteredData = rawAllData.filter(item => 
            item.category && item.category.toLowerCase().includes(currentCategoryFilter.toLowerCase())
        );
    }

    allWebProducts = filteredData.filter(item => {
        const cat = (item.category || '').toLowerCase();
        return !cat.includes('app') && !cat.includes('game') && !cat.includes('tool');
    });

    allAppProducts = filteredData.filter(item => {
        const cat = (item.category || '').toLowerCase();
        return cat.includes('app') || cat.includes('game') || cat.includes('tool');
    });

    currentWebPage = 1;
    currentAppPage = 1;

    if (activeTab === 'web') {
        renderWebProducts(1);
    } else {
        renderAppProducts(1);
    }
}

function renderWebProducts(page = 1) {
    const grid = document.getElementById("web-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const start = (page - 1) * itemsPerPage;
    const pageProducts = allWebProducts.slice(start, start + itemsPerPage);

    if (pageProducts.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px 0;">Không có dữ liệu Web trong danh mục này.</p>`;
        renderPagination('web-pagination', 0, 1, () => {});
        return;
    }

    pageProducts.forEach((product) => {
        grid.appendChild(createCardHTML(product, 'web'));
    });

    renderPagination('web-pagination', allWebProducts.length, page, (newPage) => {
        currentWebPage = newPage;
        renderWebProducts(newPage);
    });
}

function renderAppProducts(page = 1) {
    const grid = document.getElementById("app-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const start = (page - 1) * itemsPerPage;
    const pageProducts = allAppProducts.slice(start, start + itemsPerPage);

    if (pageProducts.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px 0;">Không có dữ liệu App trong danh mục này.</p>`;
        renderPagination('app-pagination', 0, 1, () => {});
        return;
    }

    pageProducts.forEach((product) => {
        grid.appendChild(createCardHTML(product, 'app'));
    });

    renderPagination('app-pagination', allAppProducts.length, page, (newPage) => {
        currentAppPage = newPage;
        renderAppProducts(newPage);
    });
}

function createCardHTML(product, type) {
    const card = document.createElement("div");
    card.className = "card";
    const imageUrl = getItemImage(product);
    const description = getItemDescription(product);
    const useUrl = getItemUseLink(product);
    const downloadUrl = getItemDownloadLink(product);

    const isGenerator = useUrl.includes('/inputs/') || useUrl.includes('/input/');
    const isGame = (product.category || '').toLowerCase().includes('game') || product.price === 'Chơi';
    const useText = isGenerator ? 'Tạo link' : (isGame ? 'Chơi ngay' : 'Mở');
    const useIcon = isGenerator ? 'fa-wand-magic-sparkles' : (isGame ? 'fa-gamepad' : 'fa-arrow-up-right-from-square');
    const priceDisplay = isGame ? 'Miễn phí' : (product.price || 'Miễn phí');

    card.innerHTML = `
        <div class="card-glare"></div>
        <div class="card-img-wrapper" onclick="openDetailModal('${encodeURIComponent(product.name)}', '${type}')" style="cursor: pointer;">
            <span class="badge">${product.category || (type === 'app' ? 'App' : 'Web')}</span>
            <img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.src='./assets/anh/loves.jpg'" />
        </div>
        <h3 onclick="openDetailModal('${encodeURIComponent(product.name)}', '${type}')" style="cursor: pointer;" title="${product.name}">${product.name}</h3>
        <p>${description}</p>
        <div class="card-footer">
            <span class="price-tag">${priceDisplay}</span>
            <div class="card-actions-group">
                <a href="${useUrl}" target="_blank" class="card-btn card-btn-use" title="${useText}">
                    <i class="fa-solid ${useIcon}"></i> ${useText}
                </a>
                <a href="${downloadUrl}" target="_blank" class="card-btn card-btn-dl" title="Tải mã nguồn">
                    <i class="fa-solid fa-download"></i> Tải code
                </a>
            </div>
        </div>
    `;
    return card;
}

function renderPagination(elementId, totalItems, currentPage, onPageChange) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = "";

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        
        if (i === currentPage) {
            btn.className = "active-page";
        }

        btn.onclick = () => onPageChange(i);
        container.appendChild(btn);
    }
}

function openDetailModal(encodedName, type) {
    const productName = decodeURIComponent(encodedName);
    const sourceList = type === 'app' ? allAppProducts : allWebProducts;
    const product = sourceList.find((p) => p.name === productName);
    if (!product) return;

    document.getElementById("modal-title").textContent = product.name;
    document.getElementById("modal-desc").textContent = getItemDescription(product);
    document.getElementById("modal-author").textContent = product.author || "devlekimlam";

    const linksContainer = document.getElementById("modal-links");
    linksContainer.innerHTML = "";

    const useUrl = getItemUseLink(product);
    const downloadUrl = getItemDownloadLink(product);
    const isGenerator = useUrl.includes('/inputs/') || useUrl.includes('/input/');
    const isGame = (product.category || '').toLowerCase().includes('game') || product.price === 'Chơi';
    const buttonText = product.buttonText || (isGenerator ? 'Tạo Link Hiệu Ứng' : (isGame ? 'Chơi Game Ngay' : 'Mở / Xem Dự Án'));
    const useIcon = isGenerator ? 'fa-wand-magic-sparkles' : (isGame ? 'fa-gamepad' : 'fa-rocket');

    if (useUrl) {
        linksContainer.innerHTML += `
            <a href="${useUrl}" target="_blank" class="btn-use">
                <i class="fa-solid ${useIcon}"></i> ${buttonText}
            </a>
        `;
    }

    if (downloadUrl) {
        linksContainer.innerHTML += `
            <a href="${downloadUrl}" target="_blank" class="btn-download">
                <i class="fa-solid fa-download"></i> Tải Mã Nguồn (${product.name})
            </a>
        `;
    }

    // Direct fast link to master zip
    linksContainer.innerHTML += `
        <a href="./downloads/all/devlam-all-projects.zip" download class="btn-download" style="background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.4); margin-top: 4px;">
            <i class="fa-solid fa-file-zipper"></i> Tải Trọn Bộ Tất Cả Dự Án (ZIP)
        </a>
    `;

    document.getElementById("detail-modal").style.display = "flex";
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = "none";
}

// Đọc file JSON chứa encodedData
fetch("./assets/pz.json")
    .then((res) => res.json())
    .then((data) => {
        if (!data || !data.encodedData) {
            throw new Error("Không tìm thấy trường encodedData trong file JSON");
        }

        let base64Str = data.encodedData;
        const pad = base64Str.length % 4;
        if (pad) {
            base64Str += '='.repeat(4 - pad);
        }

        const binaryString = atob(base64Str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const jsonString = new TextDecoder('utf-8').decode(bytes);

        rawAllData = JSON.parse(jsonString);
        processDataFiltering();
    })
    .catch((err) => {
        console.error("Lỗi đọc/giải mã file JSON:", err);
        rawAllData = [];
        processDataFiltering();
    });

// Search box
const searchBox = document.getElementById("search-box");
if (searchBox) {
    searchBox.addEventListener("input", function () {
        const keyword = this.value.toLowerCase().trim();
        
        let baseProducts = (activeTab === 'web') ? allWebProducts : allAppProducts;
        let gridId = (activeTab === 'web') ? "web-grid" : "app-grid";
        let renderType = (activeTab === 'web') ? 'web' : 'app';

        if (currentCategoryFilter && currentCategoryFilter !== 'all') {
            baseProducts = baseProducts.filter(p => p.category?.toLowerCase() === currentCategoryFilter.toLowerCase());
        }

        const filtered = keyword ? baseProducts.filter(p => p.name.toLowerCase().includes(keyword)) : baseProducts;
        
        renderCustomGrid(gridId, filtered.slice(0, 8), renderType);
        const paginationId = (activeTab === 'web') ? 'web-pagination' : 'app-pagination';
        renderPagination(paginationId, filtered.length, 1, (page) => {
            const start = (page - 1) * itemsPerPage;
            renderCustomGrid(gridId, filtered.slice(start, start + itemsPerPage), renderType);
        });
    });
}

function renderCustomGrid(gridId, list, type) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    if (list.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px 0;">Không tìm thấy kết quả.</p>`;
        return;
    }
    list.forEach(item => grid.appendChild(createCardHTML(item, type)));
}

function toggleWidgetMenu() {
    const menu = document.getElementById("widget-menu");
    const tooltip = document.getElementById("widget-tooltip");
    if (menu) menu.classList.toggle("show");
    if (menu && menu.classList.contains("show") && tooltip) {
        tooltip.style.display = "none";
    }
}

function closeWidget() {
    const widget = document.getElementById("contact-widget");
    if (widget) {
        widget.style.display = "none";
    }
}

window.onclick = function (e) {
    if (e.target.classList.contains("modal-overlay")) {
        e.target.style.display = "none";
    }
    if (!e.target.closest('.explore-dropdown-wrapper')) {
        const exploreMenu = document.getElementById("explore-menu");
        if (exploreMenu && exploreMenu.classList.contains("show")) {
            exploreMenu.classList.remove("show");
        }
    }
    if (!e.target.closest('#contact-widget')) {
        const widgetMenu = document.getElementById("widget-menu");
        if (widgetMenu && widgetMenu.classList.contains("show")) {
            widgetMenu.classList.remove("show");
        }
    }
};

// Tooltip rotate messages
const tooltipMessages = [
    "Website miễn phí! 🎁",
    "Gửi gắm yêu thương! 💌",
    "Nếu cần hỗ trợ? ✨",
    "Nhắn cho mình nhé! 💖"
];

let messageIndex = 0;
let tooltipInterval = null;

function startAutoChangeTooltip() {
    const textElement = document.getElementById("tooltip-text");
    if (!textElement) return;

    tooltipInterval = setInterval(() => {
        textElement.classList.add("fade-out");

        setTimeout(() => {
            messageIndex = (messageIndex + 1) % tooltipMessages.length;
            textElement.textContent = tooltipMessages[messageIndex];
            textElement.classList.remove("fade-out");
        }, 400);
    }, 3500);
}

function closeTooltip(event) {
    if (event) event.stopPropagation();
    const tooltip = document.getElementById("widget-tooltip");
    if (tooltip) {
        tooltip.style.display = "none";
    }
    if (tooltipInterval) {
        clearInterval(tooltipInterval);
    }
}

/**
 * 3D Interactive Background Canvas
 */
function init3DBackground() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(65, Math.floor((width * height) / 18000));
    const colors = ["rgba(236, 72, 153, ", "rgba(139, 92, 246, ", "rgba(56, 189, 248, "];

    for (let i = 0; i < count; i++) {
        particles.push({
            x: (Math.random() - 0.5) * width * 1.5,
            y: (Math.random() - 0.5) * height * 1.5,
            z: Math.random() * 800 + 100,
            vz: (Math.random() * 0.4 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: Math.random() * 2 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.5 + 0.3
        });
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener("mousemove", (e) => {
        targetX = (e.clientX - width / 2) * 0.05;
        targetY = (e.clientY - height / 2) * 0.05;
    });

    const fov = 400;

    function render() {
        ctx.clearRect(0, 0, width, height);

        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        const cx = width / 2;
        const cy = height / 2;
        const projected = [];

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            if (p.z <= 20) p.z = 900;
            if (p.z > 900) p.z = 21;

            const scale = fov / (fov + p.z);
            const x2d = (p.x + mouseX) * scale + cx;
            const y2d = (p.y + mouseY) * scale + cy;

            projected.push({ x: x2d, y: y2d, scale, p });

            if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
                const r = p.radius * scale * 1.8;
                ctx.beginPath();
                ctx.arc(x2d, y2d, Math.max(0.8, r), 0, Math.PI * 2);
                ctx.fillStyle = p.color + (p.alpha * scale) + ")";
                ctx.shadowBlur = 8 * scale;
                ctx.shadowColor = p.color + "0.8)";
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // Draw distance connections in 3D projection
        const maxDist = 110;
        for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
                const p1 = projected[i];
                const p2 = projected[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    const depthDiff = Math.abs(p1.p.z - p2.p.z);
                    if (depthDiff < 250) {
                        const alpha = (1 - dist / maxDist) * 0.22 * ((p1.scale + p2.scale) / 2);
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
        }

        requestAnimationFrame(render);
    }

    render();
}

/**
 * Animated Typewriter Effect with multi-sentence cycling
 */
function initTypewriterEffect() {
    const el = document.getElementById("typewriter-text");
    if (!el) return;

    const phrases = [
        "Vũ trụ tình yêu & Source code công nghệ độc đáo 💖",
        "Kho giao diện Web, App, Game 3D chuyển động đỉnh cao 🚀",
        "Tạo link tỏ tình, thiệp hoa, sinh nhật siêu nhanh & miễn phí ✨",
        "Dev by lekimlamdev — Chia sẻ đam mê & mã nguồn mở 🔥"
    ];

    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let speed = 70;

    function tick() {
        const currentPhrase = phrases[phraseIdx];

        if (isDeleting) {
            el.textContent = currentPhrase.substring(0, charIdx - 1);
            charIdx--;
            speed = 35;
        } else {
            el.textContent = currentPhrase.substring(0, charIdx + 1);
            charIdx++;
            speed = 70;
        }

        if (!isDeleting && charIdx === currentPhrase.length) {
            speed = 2200; // Dừng lại ở câu hoàn chỉnh
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
            speed = 400; // Nghỉ trước khi gõ câu mới
        }

        setTimeout(tick, speed);
    }

    tick();
}

/**
 * 3D Card Interactive Tilt & Glare
 */
function init3DCardTilt() {
    let activeCard = null;

    document.addEventListener("mousemove", (e) => {
        const card = e.target.closest(".card");
        if (card) {
            activeCard = card;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotX = -((y - centerY) / centerY) * 12;
            const rotY = ((x - centerX) / centerX) * 12;

            card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;
            card.style.setProperty("--glare-x", `${((x / rect.width) * 100).toFixed(1)}%`);
            card.style.setProperty("--glare-y", `${((y / rect.height) * 100).toFixed(1)}%`);
        } else if (activeCard) {
            activeCard.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
            activeCard = null;
        }
    });

    document.addEventListener("mouseleave", () => {
        if (activeCard) {
            activeCard.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
            activeCard = null;
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    startAutoChangeTooltip();
    init3DBackground();
    initTypewriterEffect();
    init3DCardTilt();
});
