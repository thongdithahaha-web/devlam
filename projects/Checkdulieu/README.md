# 🔍 Kiểm Tra Trùng Lặp Dữ Liệu

Ứng dụng web giúp kiểm tra và phát hiện các dòng trùng lặp trong tài liệu văn bản. Hỗ trợ các định dạng phổ biến: `.txt`, `.docx`, `.xlsx`, `.pdf`.

## 🚀 Demo
https://panbap.github.io/Checkdulieu/

## 📁 Hỗ Trợ Định Dạng File
- 📄 TXT
- 📝 DOCX
- 📊 XLSX
- 📕 PDF

## 🛠️ Tính Năng
- Kéo và thả hoặc chọn file để kiểm tra.
- Phân tích nội dung và phát hiện các dòng dữ liệu bị trùng lặp.
- Tải xuống kết quả xử lý sau khi kiểm tra.
- Hỗ trợ nhiều định dạng phổ biến.
- Chạy hoàn toàn trên trình duyệt (client-side), không cần backend.

## 📦 Công Nghệ Sử Dụng
- HTML/CSS/JavaScript thuần
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) – Đọc file DOCX
- [PDF.js](https://mozilla.github.io/pdf.js/) – Đọc file PDF
- [SheetJS (xlsx)](https://sheetjs.com/) – Xử lý file Excel
- Font Awesome – Biểu tượng đẹp mắt

## ▶️ Cách Sử Dụng
1. Clone repo về máy:
    ```bash
    git clone https://github.com/tenban/check-duplicate.git
    cd check-duplicate
    ```
2. Mở file `index.html` bằng trình duyệt (khuyên dùng Chrome hoặc Firefox).
3. Kéo thả hoặc chọn một tệp `.txt`, `.docx`, `.xlsx`, hoặc `.pdf`.
4. Nhấn **"Kiểm tra"** để phân tích nội dung và phát hiện dòng trùng lặp.
5. Nếu có kết quả, nút **"Tải file đã xử lý"** sẽ hiện ra để bạn tải xuống.

## 📷 Ảnh Màn Hình
<!-- Chèn ảnh minh họa nếu có -->
![Drag and Drop](drag-drop-example.png)

## 📄 Cấu Trúc Dự Án
```text
check-duplicate/
├── index.html # Giao diện chính
├── styles.css # Tệp CSS tuỳ chỉnh
├── script.js # Logic xử lý và kiểm tra trùng lặp
└── README.md # Tệp hướng dẫn sử dụng
```

## ✅ TODO
- [ ] Hỗ trợ kiểm tra theo cụm từ/ký tự thay vì dòng.
- [ ] Giao diện tiếng Anh.
- [ ] Chức năng loại trừ dòng trùng.

## 📃 Giấy Phép
Dự án được phát hành dưới giấy phép [MIT](LICENSE).

---

> 🧠 Được phát triển để phục vụ kiểm tra dữ liệu lặp trong tài liệu văn phòng một cách nhanh chóng và tiện lợi.
