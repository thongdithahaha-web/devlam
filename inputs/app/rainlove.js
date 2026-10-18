//======Data=====
const messagesContainer = document.getElementById("messagesContainer");
const addMessageBtn = document.getElementById("addMessageBtn");

function addMessage(value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "input-wrapper";
  wrapper.innerHTML = `
      <input type="text" class="message" placeholder="Nhập lời chúc..." value="${value}">
      <button type="button" class="removeBtn">✖</button>
    `;
  messagesContainer.appendChild(wrapper);

  // nút xoá
  wrapper.querySelector(".removeBtn").addEventListener("click", () => {
    wrapper.remove();
  });
}
const rent = atob("ZGV2cGFuLnZlcmNlbC5hcHA=");
addMessageBtn.addEventListener("click", () => addMessage());

const customImageInput = document.getElementById("customImage");
const uploadInput = document.getElementById("upload-imgbb");
const previewContainer = document.getElementById("preview");

let atess = [];
async function loadKeys() {
  try {
    const res = await fetch("../assets/json/atons.json", { cache: "no-store" });
    const data = await res.json();
    const decodedText = atob(data.encodedData);
    const innerData = JSON.parse(decodedText);
    atess = innerData.aton.map((k) => atob(k));
    console.log("Truy cập", atess.length, "key:", atess);
  } catch (err) {
    console.error("❌ Lỗi khi đọc keys:", err);
  }
}
loadKeys();

// Mã hóa key
// const enco = "eyJhdG9uIjpbIlpqQm1ZV0ZtTURGaU1UWTFaV1kzTVdRNE1qVTFNalUxTURBMlpXUTVPR1E9Il19";
// let atess = [];
// // 🔐 Giải mã key
// (function loadKeys() {
//   try {
//     const decodedText = atob(enco);
//     const innerData = JSON.parse(decodedText);
//     atess = innerData.aton.map((k) => atob(k));
//     console.log("✅ Giải mã", atess.length, "API key:", atess);
//   } catch (err) {
//     console.error("❌ Lỗi giải mã key:", err);
//   }
// })();

// Mảng ảnh tạm
let imageLinks = [];

function toggleCustomImageInput() {
  console.log("toggleCustomImageInput chạy!");

  const gifValue = document.getElementById("gif").value;
  const customImageInput = document.getElementById("customImage");
  const customImageGroup = document.getElementById("customImageGroup");
  const gifPreview = document.getElementById("gifPreview");
  const gifImage = document.getElementById("gifImage");
  const previewContainer = document.getElementById("preview");

  if (gifValue !== "") {
    imageLinks = [];
    customImageInput.value = "";
    previewContainer.innerHTML = "";

    customImageGroup.style.display = "none";
    gifImage.src = gifValue;
    gifPreview.style.display = "block";
  } else {
    customImageGroup.style.display = "block";
    const customURL = customImageInput.value.trim();
    if (customURL !== "") {
      gifImage.src = customURL;
      gifPreview.style.display = "block";
    } else {
      gifPreview.style.display = "none";
      gifImage.src = "";
    }
  }
}

document
  .getElementById("gif")
  .addEventListener("change", toggleCustomImageInput);
document
  .getElementById("customImage")
  .addEventListener("input", toggleCustomImageInput);
// --- Hàm cập nhật preview ---
function updatePreview() {
  previewContainer.innerHTML = "";

  // --- Style cho container preview ---
  previewContainer.style.display = "flex";
  previewContainer.style.flexWrap = "wrap"; // cho nhiều ảnh xuống dòng
  previewContainer.style.justifyContent = "center"; // căn giữa theo ngang
  previewContainer.style.alignItems = "center"; // căn giữa theo dọc
  previewContainer.style.gap = "16px"; // khoảng cách giữa ảnh
  previewContainer.style.padding = "16px";

  if (imageLinks.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.textContent = "📷 Chưa có ảnh nào được chọn";
    emptyText.style.color = "#ff7994";
    emptyText.style.fontStyle = "italic";
    emptyText.style.fontSize = "14px";
    emptyText.style.textAlign = "center";
    previewContainer.appendChild(emptyText);
    return;
  }

  // --- Render từng ảnh ---
  imageLinks.forEach((url) => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "120px";
    wrapper.style.height = "120px";
    wrapper.style.borderRadius = "12px";
    wrapper.style.overflow = "hidden";
    wrapper.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
    wrapper.style.transition = "transform 0.25s ease, box-shadow 0.25s ease";

    const img = document.createElement("img");
    img.src = url;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "12px";
    img.style.transition = "transform 0.3s ease";
    img.addEventListener(
      "mouseenter",
      () => (img.style.transform = "scale(1.05)"),
    );
    img.addEventListener(
      "mouseleave",
      () => (img.style.transform = "scale(1)"),
    );

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.style.position = "absolute";
    removeBtn.style.top = "6px";
    removeBtn.style.right = "6px";
    removeBtn.style.width = "24px";
    removeBtn.style.height = "24px";
    removeBtn.style.background = "rgba(255, 121, 148, 0.85)";
    removeBtn.style.border = "none";
    removeBtn.style.color = "white";
    removeBtn.style.fontWeight = "bold";
    removeBtn.style.fontSize = "16px";
    removeBtn.style.borderRadius = "50%";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.display = "flex";
    removeBtn.style.alignItems = "center";
    removeBtn.style.justifyContent = "center";
    removeBtn.style.transition = "all 0.2s ease";
    removeBtn.addEventListener("mouseenter", () => {
      removeBtn.style.background = "#ff4d6d";
      removeBtn.style.transform = "scale(1.1)";
    });
    removeBtn.addEventListener("mouseleave", () => {
      removeBtn.style.background = "rgba(255, 121, 148, 0.85)";
      removeBtn.style.transform = "scale(1)";
    });
    removeBtn.addEventListener("click", () => {
      imageLinks = imageLinks.filter((u) => u !== url);
      updatePreview();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    previewContainer.appendChild(wrapper);
  });

  customImageInput.value = imageLinks[0] || "";
}

// --- Khi nhập link thủ công ---
customImageInput.addEventListener("change", () => {
  const url = customImageInput.value.trim();
  if (!url) return;
  if (imageLinks.length >= 1) {
    alert("Chỉ được chọn tối đa 1 ảnh.");
    return;
  }
  imageLinks.push(url);
  updatePreview();
});

// --- Upload ảnh ---
uploadInput.addEventListener("change", async (event) => {
  const files = event.target.files;
  if (!files.length) return;

  if (!atess.length) {
    alert("Lỗi kết nối key. Vui lòng thử lại sau!");
    return;
  }

  if (imageLinks.length >= 1) {
    alert("Chỉ được chọn tối đa 1 ảnh.");
    uploadInput.value = "";
    return;
  }

  const file = files[0];
  const formData = new FormData();
  formData.append("image", file);

  let uploaded = false;

  for (const tato of atess) {
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${tato}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const link = data.data.display_url;
        imageLinks.push(link);
        updatePreview();
        uploaded = true;
        break;
      } else {
        console.warn("⚠️ Key lỗi:", data.error?.message);
      }
    } catch (err) {
      console.warn("⚠️ Lỗi upload:", err.message);
    }
  }

  if (!uploaded) {
    alert("❌ Upload thất bại, hãy thử lại sau!");
  }

  uploadInput.value = "";
});

// --- Khi tải trang ---
updatePreview();

document.addEventListener("DOMContentLoaded", () => {
  const customInput = document.getElementById("customImage");
  const gifSelect = document.getElementById("gif");
  const gifImage = document.getElementById("gifImage");
  const gifPreview = document.getElementById("gifPreview");

  if (!customInput || !gifSelect || !gifImage || !gifPreview) {
    console.warn("❌ Một số phần tử chưa tồn tại trong DOM!");
    return;
  }

  customInput.addEventListener("input", () => {
    const customURL = customInput.value.trim();

    // Nếu người dùng chưa chọn GIF nào và có nhập URL tùy chỉnh
    if (!gifSelect.value && customURL) {
      gifImage.src = customURL;
      gifPreview.style.display = "block";
    }
    // Nếu người dùng xóa URL thì ẩn preview
    else if (!customURL) {
      gifPreview.style.display = "none";
      gifImage.src = "";
    }
  });
});

// Hàm tạo link
function generateLink() {
  const messageInputs = document.querySelectorAll(".message");
  const msgArray = [];
  messageInputs.forEach((input) => {
    if (input.value.trim()) msgArray.push(input.value.trim());
  });

  if (msgArray.length === 0) {
    alert("❗ Vui lòng nhập ít nhất 1 lời chúc!");
    return;
  }

  const msg = msgArray.join("|");
  const gif = document.getElementById("gif").value.trim();
  const customImage = document.getElementById("customImage").value.trim();
  const music = document.getElementById("music").value.trim();
  const finalImage = customImage || gif;

  if (customImage && !customImage.match(/\.(gif|jpg|png|jpeg)$/i)) {
    alert(
      "⚠️ Link ảnh không hợp lệ. Vui lòng dùng link có đuôi .gif, .jpg, hoặc .png",
    );
    return;
  }

  const rainText = document.getElementById("rainText").value.trim();
  const rainColor = document.getElementById("rainColor").value || "#f584b7";
  const data = {
    msg,
    gif: finalImage,
    music,
    rainText: rainText || "i love u",
    rainColor,
  };

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  if (encoded.length > 1800) {
    alert("❗ Dữ liệu quá dài, vui lòng rút gọn lại một chút!");
    return;
  }

  const baseURL = "https://lovecodes2.vercel.app/lovex";
  const fullURL = `${baseURL}/rainz.html?id=${encodeURIComponent(encoded)}`;
  const linkOutput = document.getElementById("linkOutput");
  const qrBox = document.getElementById("qrBox");
  const qrContainer = document.getElementById("qrcode");

  linkOutput.innerHTML = "";
  if (qrBox) qrBox.style.display = "none";
  if (qrContainer) qrContainer.innerHTML = "";

  linkOutput.innerHTML = `
    <p style="text-align: center; font-weight: bold; color: #ff6e75; margin-bottom: 12px;">
      ✅ Link của bạn đã sẵn sàng!
    </p>
    
    <div id="resultContainer" style="display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%;">
      
      <input type="text" id="finalLink" value="${fullURL}" readonly 
        style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; text-align: center; background: #fff; font-family: 'Mali', cursive; color: #555;" />
      
      <div style="display: flex; gap: 10px; justify-content: center; width: 100%;">
        <a href="${fullURL}" target="_blank" id="viewBtn"
          style="padding: 10px 10px; background-color: #ff6e75; font-size: 14px; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-family: 'Mali', cursive; min-width: 110px; text-align: center; display: flex; align-items: center; justify-content: center;">
          Xem trang
        </a>
        <button id="copyBtn" onclick="copyLink()" class="copy-btn" 
          style="padding: 10px 20px; background-color: #0a2f66; font-size: 14px; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: 'Mali', cursive; min-width: 110px;">
          Copy
        </button>
      </div>
      
    </div>
  `;
}

function copyLink() {
  const input = document.getElementById("finalLink");
  const copyBtn = document.getElementById("copyBtn"); // nút copy

  // Copy text
  navigator.clipboard
    .writeText(input.value)
    .then(() => {
      copyBtn.textContent = "Đã copy"; // đổi chữ
      copyBtn.disabled = true; // tạm khóa nút (nếu muốn)
      setTimeout(() => {
        copyBtn.textContent = "Copy"; // đổi lại
        copyBtn.disabled = false;
      }, 2000); // sau 2 giây
    })
    .catch(() => {
      copyBtn.textContent = "Lỗi 😢";
      setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
    });
}

(() => {
  const captchaPopup = document.getElementById("captcha-popup");
  const captchaCodeEl = document.getElementById("captcha-code");
  const captchaInput = document.getElementById("captcha-input");
  const captchaError = document.getElementById("captcha-error");
  const captchaSubmit = document.getElementById("captcha-submit");
  const refreshBtn = document.getElementById("refresh-captcha");
  const inputFile = document.getElementById("upload-imgbb");
  const labelUpload = document.querySelector('label[for="upload-imgbb"]');

  captchaPopup.addEventListener("click", (e) => {
    if (e.target === captchaPopup) {
      captchaPopup.style.display = "none";
    }
  });

  function generateCaptcha(length = 5) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let captcha = "";
    for (let i = 0; i < length; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
  }

  let currentCaptcha = "";

  function renderCaptcha() {
    currentCaptcha = generateCaptcha();
    captchaCodeEl.textContent = currentCaptcha;
    captchaInput.value = "";
    captchaError.textContent = "";
  }

  labelUpload.addEventListener("click", (e) => {
    e.preventDefault();
    renderCaptcha();
    captchaPopup.style.display = "flex";
    captchaInput.focus();
  });

  refreshBtn.addEventListener("click", () => {
    renderCaptcha();
    captchaInput.focus();
  });

  captchaSubmit.addEventListener("click", () => {
    const userInput = captchaInput.value.trim();
    if (userInput === "") {
      captchaError.textContent = "Vui lòng nhập CAPTCHA";
      return;
    }
    if (userInput === currentCaptcha) {
      captchaError.textContent = "";
      captchaPopup.style.display = "none";
      inputFile.click();
    } else {
      captchaError.textContent = "Mã CAPTCHA không đúng, vui lòng thử lại.";
      captchaInput.focus();
    }
  });

  captchaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      captchaSubmit.click();
    }
  });

  inputFile.addEventListener("change", () => {
    captchaPopup.style.display = "none";
  });
})();

window.toggleCustomImageInput = toggleCustomImageInput;
window.generateLink = generateLink;
window.copyLink = copyLink;