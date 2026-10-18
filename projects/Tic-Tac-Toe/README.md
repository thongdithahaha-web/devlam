# 🎮 Tic Tac Toe AI

Trò chơi **Caro (Tic-Tac-Toe)** cổ điển kết hợp với **Trí tuệ nhân tạo (AI)**. Người chơi có thể đấu với AI thông minh sử dụng thuật toán **Minimax**.  
Giao diện đơn giản, dễ chơi, có thống kê trận đấu và hỗ trợ nhập tên người chơi.

![screenshot](https://raw.githubusercontent.com/devlekimlam/js/main/icon/TicTacToe-preview.png)

---

## 🚀 Demo

🔗 Truy cập demo trực tuyến:  
👉 [devlekimlam.github.io/Tic-Tac-Toe](https://devlekimlam.github.io/Tic-Tac-Toe)

Hoặc tải về và mở `index.html` bằng trình duyệt.

---

## 📦 Tính năng nổi bật

- ✅ Giao diện trực quan, dễ sử dụng  
- ✅ Chơi với AI thông minh (thuật toán **Minimax**)  
- ✅ Nhập tên người chơi trước khi bắt đầu  
- ✅ Thống kê số **trận**, **thắng**, **hòa**, **thua**  
- ✅ Nút **Reset** để chơi lại nhanh chóng  
- ✅ Giao diện **responsive** – chơi tốt trên điện thoại  

---

## 🛠️ Công nghệ sử dụng
```text
| Công nghệ     | Mô tả                                      |
|--------------|---------------------------------------------|
| `HTML5`       | Tạo cấu trúc trang                         |
| `CSS3`        | Thiết kế giao diện người dùng              |
| `JavaScript`  | Xử lý logic game & trí tuệ nhân tạo        |
| `Minimax`     | Thuật toán giúp AI tìm nước đi tối ưu      |
| `jsDelivr`    | Load `AITicTacToe.js` nhanh từ GitHub CDN |
```
---

## 📂 Cấu trúc dự án
```text
Tic-Tac-Toe/
├── index.html              # Giao diện chính
├── AITicTacToe.js          # Logic AI và trò chơi
└── README.md               # Tài liệu dự án
```
---

## ⚙️ Cài đặt & cách chơi

> 1. Cài đặt
bash
Copy
Edit
Clone repository
git clone https://github.com/devlekimlam/js.git

Di chuyển vào thư mục game
cd js/game

# Mở file trong trình duyệt

macOS:
open index.html

Windows:
start index.html

> 2. Cách hoạt động
Người chơi là X, AI là O

AI sử dụng thuật toán minimax() để tìm nước đi tối ưu

Trò chơi cập nhật trạng thái sau mỗi lượt đi

Khi kết thúc, hệ thống hiển thị kết quả:

✅ Thắng / ❌ Thua / 🤝 Hòa

Không cần backend – chạy hoàn toàn trên trình duyệt

# 📜 Giấy phép
Dự án được phát hành dưới giấy phép MIT License.

> 🧠 Dự án cá nhân nhằm thực hành AI cơ bản trong game mini.
