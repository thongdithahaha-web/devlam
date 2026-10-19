const https = require('https');

module.exports = async (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    if (!body || !body.base64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu file tải lên (base64).' });
    }

    const { filename, base64 } = body;
    const base64Content = base64.includes(',') ? base64.split(',')[1] : base64;
    const fileBuffer = Buffer.from(base64Content, 'base64');

    const safeFilename = filename || (base64.includes('audio') ? 'music.mp3' : 'image.jpg');
    const isAudio = safeFilename.endsWith('.mp3') || safeFilename.endsWith('.m4a') || safeFilename.endsWith('.wav') || safeFilename.endsWith('.ogg') || (base64.includes('audio'));
    const contentType = isAudio ? 'audio/mpeg' : 'image/jpeg';

    // Helper: Upload to Catbox
    const uploadToCatbox = () => new Promise((resolve, reject) => {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const chunks = [
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${safeFilename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ];
      const postBody = Buffer.concat(chunks);

      const catboxReq = https.request('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': postBody.length,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        timeout: 20000
      }, catboxRes => {
        let data = '';
        catboxRes.on('data', chunk => data += chunk);
        catboxRes.on('end', () => {
          if (catboxRes.statusCode === 200 && data.startsWith('http')) {
            resolve(data.trim());
          } else {
            reject(new Error('Lỗi Catbox: ' + data));
          }
        });
      });

      catboxReq.on('timeout', () => {
        catboxReq.destroy();
        reject(new Error('Catbox timeout'));
      });
      catboxReq.on('error', err => reject(err));
      catboxReq.write(postBody);
      catboxReq.end();
    });

    // Helper: Upload to Litterbox (Catbox temp storage fallback)
    const uploadToLitterbox = () => new Promise((resolve, reject) => {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const chunks = [
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="time"\r\n\r\n72h\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${safeFilename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ];
      const postBody = Buffer.concat(chunks);

      const req = https.request('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': postBody.length,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        timeout: 20000
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 && data.startsWith('http')) {
            resolve(data.trim());
          } else {
            reject(new Error('Lỗi Litterbox: ' + data));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Litterbox timeout'));
      });
      req.on('error', err => reject(err));
      req.write(postBody);
      req.end();
    });

    let uploadedUrl = null;
    try {
      uploadedUrl = await uploadToCatbox();
    } catch (catboxErr) {
      console.warn('Catbox upload failed, trying Litterbox fallback:', catboxErr.message);
      try {
        uploadedUrl = await uploadToLitterbox();
      } catch (litterboxErr) {
        throw new Error('Cả Catbox và Litterbox đều không phản hồi: ' + litterboxErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      url: uploadedUrl
    });
  } catch (error) {
    console.error('Lỗi tải file lên:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xử lý tải lên đám mây'
    });
  }
};
