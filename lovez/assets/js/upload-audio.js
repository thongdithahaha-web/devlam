/**
 * =============================================================================
 * File: upload-audio.js
 * Author: devlekimlam
 * Project: lekimlamdev
 * Description: 
 *   - Quản lý bộ nhớ lưu trữ nhạc trực tiếp bằng IndexedDB (lkimlam_audio_db)
 *   - Tải nhạc và stream trực tiếp lên máy chủ đám mây (Catbox / Litterbox / Pomf2)
 *   - Đồng bộ trạng thái chờ khi bấm "Tạo Đường Link Ngay"
 *   - Hỗ trợ giải mã và phát nhạc tức thì 100% trên cả thiết bị tạo lẫn thiết bị nhận
 * =============================================================================
 */

(function (window) {
  'use strict';

  const DB_NAME = 'lkimlam_audio_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'audios';

  // State globals
  window.isUploadingAudio = false;
  window.uploadedAudioUrl = '';
  window.currentAudioUploadPromise = null;
  window.currentAudioBlob = null;
  window.currentAudioBlobUrl = null;

  // 1. ================= Khởi tạo & thao tác IndexedDB =================
  function openAudioDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('Trình duyệt không hỗ trợ IndexedDB.');
        return resolve(null);
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('Lỗi mở IndexedDB:', request.error);
        resolve(null);
      };
    });
  }

  async function saveAudioBlob(id, blob, filename) {
    try {
      const db = await openAudioDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({
          id: id,
          blob: blob,
          name: filename || 'audio.mp3',
          type: blob.type || 'audio/mpeg',
          size: blob.size,
          updatedAt: Date.now()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('Lỗi lưu IndexedDB:', e);
      return false;
    }
  }

  async function getAudioBlob(id) {
    try {
      const db = await openAudioDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  window.saveAudioBlob = saveAudioBlob;
  window.getAudioBlob = getAudioBlob;

  // 2. ================= Tải nhạc lên đám mây (Stream MP3 trực tiếp) =================
  async function uploadToApiServer(file, base64Data) {
    const endpoints = ['/api/upload-music', '/api/upload'];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name || 'music.mp3',
            base64: base64Data
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.url) {
            return data.url;
          }
        }
      } catch (err) {
        // Tiếp tục thử fallback tiếp theo
      }
    }
    return null;
  }

  // Fallback tải trực tiếp từ Browser lên Litterbox (hỗ trợ CORS)
  async function uploadDirectLitterbox(file) {
    try {
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('time', '72h');
      fd.append('fileToUpload', file, file.name || 'music.mp3');

      const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: fd
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.startsWith('http')) {
          return text.trim();
        }
      }
    } catch (e) {
      console.warn('Litterbox direct fallback failed:', e);
    }
    return null;
  }

  // Fallback tải trực tiếp từ Browser lên Pomf2
  async function uploadDirectPomf(file) {
    try {
      const fd = new FormData();
      fd.append('files[]', file, file.name || 'music.mp3');

      const res = await fetch('https://pomf2.lain.la/upload.php', {
        method: 'POST',
        body: fd
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.files && json.files[0] && json.files[0].url) {
          return json.files[0].url;
        }
      }
    } catch (e) {
      console.warn('Pomf2 direct fallback failed:', e);
    }
    return null;
  }

  /**
   * Xử lý file nhạc người dùng chọn từ máy
   */
  window.handleAudioFileSelection = function (file, options) {
    options = options || {};
    const onStatus = options.onStatus || function () {};
    const onPreviewReady = options.onPreviewReady || function () {};

    if (!file) return;

    if (!file.type.includes('audio') && !file.name.match(/\.(mp3|m4a|wav|ogg|aac|flac)$/i)) {
      onStatus({
        status: 'error',
        message: '⚠️ Vui lòng chọn file âm thanh (.mp3, .m4a, .wav).'
      });
      return;
    }

    if (file.size > 35 * 1024 * 1024) {
      onStatus({
        status: 'error',
        message: '⚠️ File nhạc quá lớn (>35MB). Vui lòng chọn file dưới 35MB.'
      });
      return;
    }

    // 1. Tạo local ID & Blob URL cho trải nghiệm tức thì (0ms latency)
    const localId = 'idb:lkl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    window.currentAudioBlob = file;
    if (window.currentAudioBlobUrl) {
      URL.revokeObjectURL(window.currentAudioBlobUrl);
    }
    window.currentAudioBlobUrl = URL.createObjectURL(file);
    window.uploadedAudioUrl = localId; // Gán tạm để nếu chạy offline vẫn hoạt động

    // Lưu ngay file vào IndexedDB (không lo giới hạn 5MB)
    saveAudioBlob(localId, file, file.name);

    if (typeof window.updateCustomAudioOption === 'function') {
      window.updateCustomAudioOption(localId);
    }

    onPreviewReady(window.currentAudioBlobUrl);
    onStatus({
      status: 'loading',
      message: '⏳ Đang lưu vào bộ nhớ máy và đồng bộ bài hát lên máy chủ... (' + Math.round(file.size / 1024) + ' KB)'
    });

    window.isUploadingAudio = true;

    // 2. Chạy tải lên đám mây trong nền
    window.currentAudioUploadPromise = new Promise(async (resolve) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64Data = evt.target.result;
        let cloudUrl = null;

        // B1: Thử API upload server (/api/upload-music)
        cloudUrl = await uploadToApiServer(file, base64Data);

        // B2: Thử Litterbox direct
        if (!cloudUrl) {
          cloudUrl = await uploadDirectLitterbox(file);
        }

        // B3: Thử Pomf2 direct
        if (!cloudUrl) {
          cloudUrl = await uploadDirectPomf(file);
        }

        if (cloudUrl) {
          window.uploadedAudioUrl = cloudUrl;
          // Lưu thêm bản cache vào IndexedDB với key là cloudUrl
          await saveAudioBlob(cloudUrl, file, file.name);

          if (typeof window.updateCustomAudioOption === 'function') {
            window.updateCustomAudioOption(cloudUrl);
          }

          window.isUploadingAudio = false;
          onStatus({
            status: 'success',
            url: cloudUrl,
            message: '✅ Đã tải nhạc lên đám mây thành công! Link stream mượt mà: ' + (file.name || 'nhạc của bạn')
          });
          resolve(cloudUrl);
        } else {
          // Fallback offline: Giữ localId đã lưu trong IndexedDB
          window.uploadedAudioUrl = localId;
          if (typeof window.updateCustomAudioOption === 'function') {
            window.updateCustomAudioOption(localId);
          }
          window.isUploadingAudio = false;
          onStatus({
            status: 'local',
            url: localId,
            message: '✅ Đã lưu nhạc trực tiếp vào IndexedDB máy (' + (file.name || 'MP3') + '). Mở máy bạn nghe mượt 100%!'
          });
          resolve(localId);
        }
      };
      reader.onerror = () => {
        window.isUploadingAudio = false;
        resolve(localId);
      };
      reader.readAsDataURL(file);
    });

    return window.currentAudioUploadPromise;
  };

  /**
   * Chờ quá trình upload nhạc kết thúc trước khi sinh link
   */
  window.waitForAudioUpload = async function () {
    if (window.isUploadingAudio && window.currentAudioUploadPromise) {
      await window.currentAudioUploadPromise;
    }
    return window.uploadedAudioUrl;
  };

  // 3. ================= Trình giải mã nguồn phát (Dành cho trang nhận) =================
  /**
   * Giải mã luồng nhạc thành URL phát an toàn cho thẻ <audio>:
   * - Nếu là idb: -> Lấy Blob từ IndexedDB -> URL.createObjectURL()
   * - Nếu là Cloud URL (Catbox/Litterbox): Kiểm tra xem máy này có lưu Blob trong IndexedDB không; nếu có thì dùng Blob (cực nhanh), nếu không thì phát qua luồng stream internet.
   * - Sửa tự động link tmpfiles.org sang /dl/ trực tiếp.
   */
  window.resolveAudioStream = async function (rawUrl) {
    if (!rawUrl) return './n/c.mp3';
    rawUrl = rawUrl.trim();

    // 1. Trường hợp lưu trực tiếp IndexedDB
    if (rawUrl.startsWith('idb:')) {
      const blob = await getAudioBlob(rawUrl);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    }

    // 2. Trường hợp là URL đám mây
    if (/^https?:\/\//i.test(rawUrl)) {
      // Sửa lỗi tmpfiles.org nếu có
      if (rawUrl.includes('tmpfiles.org/') && !rawUrl.includes('tmpfiles.org/dl/')) {
        rawUrl = rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      }

      // Kiểm tra cache IndexedDB trên máy này
      const cachedBlob = await getAudioBlob(rawUrl);
      if (cachedBlob) {
        return URL.createObjectURL(cachedBlob);
      }
      return rawUrl;
    }

    // 3. Dữ liệu base64 hoặc blob sẵn
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }

    // 4. File cục bộ tương đối (vd: n/c.mp3 hoặc ./n/c.mp3)
    if (rawUrl.startsWith('./')) {
      return rawUrl;
    }
    return './' + rawUrl;
  };

  // 4. ================= Nén & Tải ảnh lên đám mây =================
  window.compressImageToJpeg = function (file, maxDimension, quality) {
    maxDimension = maxDimension || 800;
    quality = quality || 0.72;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxDimension || h > maxDimension) {
            if (w > h) {
              h = Math.round((h * maxDimension) / w);
              w = maxDimension;
            } else {
              w = Math.round((w * maxDimension) / h);
              h = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  window.isUploadingPhoto = false;
  window.uploadedPhotoUrl = '';
  window.currentPhotoUploadPromise = null;
  window.waitForPhotoUpload = async function () {
    if (window.isUploadingPhoto && window.currentPhotoUploadPromise) {
      await window.currentPhotoUploadPromise;
    }
    return window.uploadedPhotoUrl;
  };

  window.uploadImageFile = async function (file) {
    if (!file) return null;
    window.isUploadingPhoto = true;

    // 1. Nén ảnh bằng Canvas sang JPEG gọn gàng
    const compressedDataUrl = await window.compressImageToJpeg(file, 800, 0.72);

    // 2. Chuyển thành Blob & tạo key IndexedDB ngắn gọn (~22 ký tự)
    const byteString = atob(compressedDataUrl.split(',')[1]);
    const mimeString = compressedDataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const localImgId = 'idb:img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Lưu ngay Blob vào IndexedDB để làm local fallback an toàn
    await saveAudioBlob(localImgId, blob, file.name || 'image.jpg');
    window.uploadedPhotoUrl = localImgId;

    // 3. Tiến hành tải lên đám mây trong nền (API Server -> Pomf2 direct -> Litterbox direct)
    window.currentPhotoUploadPromise = (async () => {
      let cloudUrl = null;

      // Bước A: Thử API Server (/api/upload)
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name || 'photo.jpg',
            base64: compressedDataUrl
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.url) {
            cloudUrl = data.url;
          }
        }
      } catch (e) {}

      // Bước B: Thử Pomf2 direct (CORS mở, upload trực tiếp cực nhanh)
      if (!cloudUrl) {
        try {
          const fd = new FormData();
          fd.append('files[]', blob, file.name || 'photo.jpg');
          const res = await fetch('https://pomf2.lain.la/upload.php', {
            method: 'POST',
            body: fd
          });
          if (res.ok) {
            const json = await res.json();
            if (json && json.success && json.files && json.files[0] && json.files[0].url) {
              cloudUrl = json.files[0].url;
            }
          }
        } catch (e) {}
      }

      // Bước C: Thử Litterbox direct
      if (!cloudUrl) {
        try {
          const fd = new FormData();
          fd.append('reqtype', 'fileupload');
          fd.append('time', '72h');
          fd.append('fileToUpload', blob, file.name || 'image.jpg');
          const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
            method: 'POST',
            body: fd
          });
          if (res.ok) {
            const text = await res.text();
            if (text && text.startsWith('http')) {
              cloudUrl = text.trim();
            }
          }
        } catch (e) {}
      }

      if (cloudUrl) {
        window.uploadedPhotoUrl = cloudUrl;
        await saveAudioBlob(cloudUrl, blob, file.name || 'image.jpg');
        return cloudUrl;
      }

      // Fallback an toàn: Trả về localImgId (22 ký tự). Tuyệt đối không trả về chuỗi Base64 khổng lồ gây HTTP 414!
      return localImgId;
    })().finally(() => {
      window.isUploadingPhoto = false;
    });

    return window.currentPhotoUploadPromise;
  };

  /**
   * Phân giải nguồn ảnh an toàn: IDB blob, cloud link, hoặc data URL
   */
  window.resolveImageSource = async function (rawUrl) {
    if (!rawUrl) return '';
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('idb:')) {
      const blob = await getAudioBlob(trimmed);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    }
    if (/^https?:\/\//i.test(trimmed)) {
      const cached = await getAudioBlob(trimmed);
      if (cached) return URL.createObjectURL(cached);
      return trimmed;
    }
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      return trimmed;
    }
    return './' + trimmed;
  };

  // 5. ================= Tự động gắn UI Upload Nhạc & Ảnh cho tất cả các trang Tạo Link =================
  function initGeneratorUI() {
    // 1. Tìm thẻ select nhạc trong form
    const musicSelect = document.getElementById('music') || 
                        document.getElementById('input-music') || 
                        document.getElementById('musicSelect') || 
                        document.getElementById('musicInput') || 
                        document.getElementById('musicSelector') || 
                        document.getElementById('bgMusicSelect') || 
                        document.querySelector('select[name="music"]');

    if (musicSelect && !document.getElementById('lkl-custom-music-wrap')) {
      // Thêm option upload nhạc từ thiết bị nếu chưa có
      let customOpt = null;
      for (let i = 0; i < musicSelect.options.length; i++) {
        if (musicSelect.options[i].value === 'custom_upload' || musicSelect.options[i].value === 'upload') {
          customOpt = musicSelect.options[i];
          break;
        }
      }
      if (!customOpt) {
        customOpt = document.createElement('option');
        customOpt.value = 'custom_upload';
        customOpt.textContent = '📁 Tải file nhạc từ thiết bị (.mp3)...';
        musicSelect.appendChild(customOpt);
      }

      // Tạo box upload nhạc tiện lợi
      const wrap = document.createElement('div');
      wrap.id = 'lkl-custom-music-wrap';
      wrap.style.cssText = 'display:none; margin-top:12px; padding:14px; background:rgba(255,240,243,0.92); border:1.8px dashed #ff4d6d; border-radius:14px; text-align:center; animation:fadeIn 0.3s ease; box-shadow:0 4px 12px rgba(255,77,109,0.1);';
      wrap.innerHTML = `
        <label for="lkl-music-file" style="display:inline-block; padding:10px 18px; background:linear-gradient(45deg,#ff4d6d,#ff758f); color:#fff; border-radius:12px; font-weight:700; font-size:13.5px; cursor:pointer; box-shadow:0 4px 10px rgba(255,77,109,0.3); transition:0.2s;">
          🎵 Chọn bài hát từ máy (.mp3, .m4a, .wav)
        </label>
        <input type="file" id="lkl-music-file" accept="audio/*" style="display:none;">
        <div id="lkl-audio-status" style="margin-top:9px; font-size:12.5px; color:#4a5568; font-weight:500;">Chưa chọn bài hát từ thiết bị.</div>
        <div style="display:flex; justify-content:center; gap:8px; margin-top:10px;">
          <button type="button" id="lkl-btn-preview" style="display:none; padding:7px 16px; background:#fff; color:#ff4d6d; border:1.5px solid #ff4d6d; border-radius:10px; font-size:12.5px; font-weight:700; cursor:pointer; transition:0.2s;">
            ▶️ Nghe thử bài hát
          </button>
        </div>
        <audio id="lkl-preview-audio" style="display:none;"></audio>
      `;

      musicSelect.parentNode.insertBefore(wrap, musicSelect.nextSibling);

      const fileInput = document.getElementById('lkl-music-file');
      const statusEl = document.getElementById('lkl-audio-status');
      const previewBtn = document.getElementById('lkl-btn-preview');
      const previewAudio = document.getElementById('lkl-preview-audio');

      // Ẩn hiện box khi đổi lựa chọn
      musicSelect.addEventListener('change', () => {
        if (musicSelect.value === 'custom_upload' || musicSelect.value === 'upload' || (customOpt && musicSelect.value === customOpt.value)) {
          wrap.style.display = 'block';
        } else {
          wrap.style.display = 'none';
          if (previewAudio) {
            previewAudio.pause();
            previewBtn.textContent = '▶️ Nghe thử bài hát';
          }
        }
      });

      if (musicSelect.value === 'custom_upload' || musicSelect.value === 'upload') {
        wrap.style.display = 'block';
      }

      // Xử lý khi chọn file nhạc từ máy
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        window.handleAudioFileSelection(file, {
          onStatus: (info) => {
            if (info.status === 'loading') {
              statusEl.innerHTML = `<span style="color:#2563eb; font-weight:600;"><span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> ${info.message}</span>`;
            } else if (info.status === 'success' || info.status === 'local') {
              statusEl.innerHTML = `<span style="color:#16a34a; font-weight:700;">${info.message}</span>`;
              previewBtn.style.display = 'inline-block';
            } else {
              statusEl.innerHTML = `<span style="color:#e11d48; font-weight:600;">${info.message}</span>`;
            }
          },
          onPreviewReady: (blobUrl) => {
            if (previewAudio) previewAudio.src = blobUrl;
            previewBtn.style.display = 'inline-block';
          }
        });
      });

      // Bật/tắt nghe thử
      previewBtn.addEventListener('click', () => {
        if (!previewAudio.src) return;
        if (previewAudio.paused) {
          previewAudio.play().then(() => {
            previewBtn.textContent = '⏸️ Tạm dừng';
          }).catch(err => {
            console.log('Lỗi phát preview:', err);
          });
        } else {
          previewAudio.pause();
          previewBtn.textContent = '▶️ Nghe thử bài hát';
        }
      });
      previewAudio.addEventListener('ended', () => {
        previewBtn.textContent = '▶️ Nghe thử bài hát';
      });

      // Cập nhật giá trị option khi upload hoàn tất
      window.updateCustomAudioOption = function(url) {
        const targetUrl = url || window.uploadedAudioUrl || '';
        if (customOpt && targetUrl) {
          customOpt.value = targetUrl;
          musicSelect.value = targetUrl;
        }
      };
    }

    // 2. Tự động đồng bộ trạng thái chờ khi bấm "Tạo Link"
    const createBtn = document.querySelector('.btn-create') || 
                      document.querySelector('.generate-btn') || 
                      document.querySelector('.btn-generate') || 
                      document.getElementById('btn-go') || 
                      document.getElementById('createLink') || 
                      document.getElementById('createLinkBtn') || 
                      document.getElementById('generate-link') || 
                      document.getElementById('generate') || 
                      document.getElementById('createBtn') || 
                      document.querySelector('button[type="submit"]');

    if (createBtn && (!createBtn.dataset || !createBtn.dataset.syncHooked)) {
      if (createBtn.dataset) createBtn.dataset.syncHooked = 'true';
      const origOnclick = createBtn.onclick;

      createBtn.addEventListener('click', async (e) => {
        if (window.isUploadingAudio || window.isUploadingPhoto) {
          e.preventDefault();
          e.stopImmediatePropagation();

          const origText = createBtn.innerHTML;
          createBtn.disabled = true;
          createBtn.innerHTML = '⏳ Đang đồng bộ ảnh & bài hát lên máy chủ... (vui lòng đợi vài giây)';

          try {
            await Promise.all([
              window.waitForAudioUpload ? window.waitForAudioUpload() : Promise.resolve(),
              window.waitForPhotoUpload ? window.waitForPhotoUpload() : Promise.resolve()
            ]);
          } catch(err) {}

          createBtn.disabled = false;
          createBtn.innerHTML = origText;

          // Đảm bảo musicSelect mang giá trị URL vừa tải lên
          if (musicSelect && window.uploadedAudioUrl) {
            window.updateCustomAudioOption(window.uploadedAudioUrl);
          }

          // Sau khi upload xong, tiếp tục tạo link bình thường
          if (typeof window.generateLink === 'function') {
            window.generateLink();
          } else if (typeof window.createLink === 'function') {
            window.createLink();
          } else if (typeof origOnclick === 'function') {
            origOnclick.call(createBtn, e);
          } else if (createBtn.form) {
            if (createBtn.form.requestSubmit) {
              createBtn.form.requestSubmit();
            } else {
              createBtn.form.submit();
            }
          } else {
            createBtn.click();
          }
        } else if (musicSelect && (musicSelect.value === 'custom_upload' || musicSelect.value === 'upload') && window.uploadedAudioUrl) {
          window.updateCustomAudioOption(window.uploadedAudioUrl);
        }
      }, true);
    }

    // 3. Tự động nâng cấp trình tải ảnh lên đám mây (Canvas compress + Catbox/Litterbox)
    const imgInput = document.getElementById('upload-imgbb') || 
                     document.querySelector('input[type="file"][accept*="image"]');

    if (imgInput && (!imgInput.dataset || !imgInput.dataset.enhanced)) {
      if (imgInput.dataset) imgInput.dataset.enhanced = 'true';
      imgInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Chặn listener cũ (vốn dùng api.imgbb.com với key hết hạn)
        e.stopImmediatePropagation();

        const imagesTextarea = document.getElementById('images') || 
                               document.getElementById('input-images') || 
                               document.getElementById('imageTextarea') || 
                               document.querySelector('textarea#image-links') || 
                               document.querySelector('textarea');
        if (!imagesTextarea) return;

        for (const file of files) {
          const currentCount = imagesTextarea.value.trim().split(/[\n,]+/).filter(Boolean).length;
          if (currentCount >= 5) {
            alert('Chỉ được upload tối đa 5 ảnh.');
            break;
          }

          try {
            const uploadedUrl = await window.uploadImageFile(file);
            if (uploadedUrl) {
              const sep = imagesTextarea.id === 'images' && !imagesTextarea.value.includes('\n') && imagesTextarea.value.includes(',') ? ', ' : '\n';
              imagesTextarea.value += (imagesTextarea.value ? sep : '') + uploadedUrl;
              if (typeof window.updateThumbs === 'function') {
                window.updateThumbs();
              }
              if (typeof window.updatePreview === 'function') {
                window.updatePreview();
              }
            }
          } catch (err) {
            console.error('Lỗi upload ảnh:', err);
          }
        }
        imgInput.value = '';
      }, true);
    }

    // 4. Tự động bảo vệ chống lỗi HTTP 414 URI Too Long trên toàn bộ form
    function sanitizePageLinks() {
      const selectors = [
        '#output-link', '#finalLink', '.created-link-input', '#generatedUrl',
        '#link-output', '#outputLink', 'input[id*="link"]', 'input[id*="output"]'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          let val = (el.value || '').trim();
          if (val && val.length > 1500) {
            if (val.includes('?d=')) {
              el.value = val.replace('?d=', '#d=');
            } else if (val.includes('?id=')) {
              el.value = val.replace('?id=', '#id=');
            }
          }
          let txt = (el.textContent || '').trim();
          if (txt && txt.length > 1500) {
            if (txt.includes('?d=')) {
              el.textContent = txt.replace('?d=', '#d=');
            } else if (txt.includes('?id=')) {
              el.textContent = txt.replace('?id=', '#id=');
            }
          }
        });
      });

      const btnSelectors = [
        '#btn-view', '#viewBtn', '#previewBtn', 'a[id*="view"]', 'a[id*="preview"]'
      ];
      btnSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(btn => {
          let href = (btn.getAttribute('href') || '').trim();
          if (href && href.length > 1500) {
            if (href.includes('?d=')) {
              btn.setAttribute('href', href.replace('?d=', '#d='));
            } else if (href.includes('?id=')) {
              btn.setAttribute('href', href.replace('?id=', '#id='));
            }
          }
        });
      });
    }

    if (typeof window.open === 'function' && !window.__lklOpenHooked) {
      window.__lklOpenHooked = true;
      const origOpen = window.open;
      window.open = function(url, target, features) {
        if (typeof url === 'string' && url.length > 1500) {
          if (url.includes('?d=')) url = url.replace('?d=', '#d=');
          else if (url.includes('?id=')) url = url.replace('?id=', '#id=');
        }
        return origOpen.call(window, url, target, features);
      };
    }

    setInterval(sanitizePageLinks, 300);
  }

  // Tự động kích hoạt khi DOM tải xong
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeneratorUI);
  } else {
    initGeneratorUI();
  }

})(typeof window !== 'undefined' ? window : this);

