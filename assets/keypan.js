/**
* ======================================
* File: keypan.js
* Description: Handles main user interface logic & Vietnamese Text Compression
* Author: Devpan
* Created: 2026-01-01
* ======================================
*/

// =============================================================================
// TỪ ĐIỂN NÉN TIẾNG VIỆT - CHỦ ĐỀ YÊU THƯƠNG, HÀNG NGÀY & LỜI CHÚC (KEYPANS)
// =============================================================================

// Danh sách từ ngắn phổ biến (Chỉ nén từ >= 4 ký tự)
const SHORT_WORDS = [
    "chúng", "những", "người", "không", "được", "trong", "nhưng", "cũng",
    "luôn", "nghĩ", "thích", "cười", "khóc", "buồn", "xinh", "ngoan",
    "mong", "thêm", "trên", "dưới", "chính", "thành", "nhiều", "nhanh",
    "chậm", "chọn", "chạy", "đứng", "ngồi", "ngang", "ngoài", "hoặc",
    "khác", "bằng", "muốn", "thấy", "biết", "ngày", "tháng", "mình",
    "nghe", "nhìn", "quay", "giúp", "dành", "chút", "chuyện", "thời",
    "gian", "việc", "trước", "chồng", "ngược", "quản", "khiến", "hoàn",
    "nguyện", "tương", "nghĩa", "chiều", "ngọt", "thương", "chạm",
    "chuẩn", "chắc", "đúng", "rảnh", "xong", "chưa", "đang", "tiếp",
    "dừng", "muộn", "phải", "giăng", "bỗng",
    
    "tớ mới nhận ra", "thu nhỏ", "nói thế", "chân tình",
    "người ta", "chưa chắc", "vắng vẻ", "lạ thường", "chỉ cần", "nghĩ đến cậu",
    "chạm phải", "của cậu", "thực ra lại", "vừa bằng đúng", "một người", "lòng tớ",
    "mọi giông bão", "ngoài kia", "cậu giống như", "tia nắng", "không ồn ào", "làm tan chảy",
    "nhưng từ", "lọt qua", "tuyệt vời", "kết quả", "sau này", "có cậu", "chẳng sợ", 
    "cậu có", "cùng tớ", "giăng đầy","cánh cửa", "lạnh lẽo", "tớ từng",
    "so sánh", "cậu là", "đi qua","đi cùng", "chỉ sợ", "nhận về",
    "đặc biệt", "là một", "sinh ra","một lý do", "để nói", "bạn rằng",
    "đối với", "của bạn", "có thể","lại một", "gửi đến bạn", "tất cả",
    "bình thường", "kịp nói", "bạn sẽ nhận","món quà", "hơn hết", "bạn có thể",
    "đã qua", "bạn có", "mà có lẽ","tận hưởng", "theo cách", "mà bạn",
    "yêu quý", "cảm nhận","thật sự", "hãy cho phép", "bản thân",
    "nghỉ ngơi", "quyết định", "không chỉ là","mà còn là", "để mình", "nhìn lại",
    "mình muốn", "mong muốn", "khiến mình vui","nhiều người", "hoàn hảo", "Happy Birthday",
    "khỏe mạnh", "hiện thực", "bao nhiêu năm nữa","có thêm", "thành công", "cơ hội",
    "đối xử", "thật tốt", "tốt đẹp","tin rằng", "sau đó", "thật đẹp",
    "như thế nào", "hiện diện", "hài lòng","nhẹ nhàng", "nào đó", "xứng đáng",
    "đôi khi", "vẫn thường", "cảm xúc","một khoảng", "nhận ra", "theo đuổi",
    "điều gì xảy ra", "bạn cảm", "đủ tốt","cố gắng", "bất ngờ",
    "dự định", "con đường", "năng lượng","tôn trọng", "nói rằng", "quãng đường",
    "có một kỳ nghỉ lễ", "thư giãn", "cho bạn","nhộn nhịp", "mang đến", "cảm giác",
    "suôn sẻ", "mục tiêu", "cho cận","làm cho", "phong độ", "cảm hứng",
];

// Danh sách từ & cụm câu yêu thương, thả thính, chúc mừng (Chỉ giữ cụm/từ >= 4 ký tự)
const LOVE_WORDS = [
    // --- Nhóm từ quà tặng & gửi gắm ---
    "tặng em nè", "tặng anh nè", "gửi tặng em", "gửi tặng anh",
    "dành tặng em", "dành tặng anh", "món quà tặng em", "món quà tặng anh",
    "gửi em yêu", "gửi anh yêu", "gửi đến em", "gửi đến anh",
    "gửi em", "gửi anh", "tặng em", "tặng anh", "quà tặng",

    // --- Các cụm biến thể với "ANH MUỐN" / "EM MUỐN" ---
    "anh muốn ở bên em mãi mãi", "em muốn ở bên anh mãi mãi",
    "anh muốn ở bên em", "em muốn ở bên anh",
    "anh muốn chăm sóc em", "em muốn chăm sóc anh",
    "anh muốn ôm em thật chặt", "em muốn ôm anh thật chặt",
    "anh muốn nắm tay em", "em muốn nắm tay anh",
    "anh muốn nói là anh yêu em", "em muốn nói là em yêu anh",
    "anh muốn thấy nụ cười của em", "em muốn thấy nụ cười của anh",
    "anh muốn gặp em quá", "em muốn gặp anh quá",
    "anh muốn bên em trọn đời", "em muốn bên anh trọn đời",
    "anh muốn cùng em đi khắp nơi", "em muốn cùng anh đi khắp nơi",
    "anh muốn em", "em muốn anh", "em muốn ở", "anh muốn ở",
    "anh muốn", "em muốn",

    // --- Các câu dài 4 đến 5 từ phổ biến ---
    "anh yêu em nhiều lắm", "em yêu anh nhiều lắm",
    "anh nhớ em nhiều lắm", "em nhớ anh nhiều lắm",
    "mãi mãi ở bên nhau", "bên nhau cho đến già",
    "anh sẽ luôn bên em", "em sẽ luôn bên anh", 
    "cảm ơn vì tất cả", "người quan trọng nhất đời",
    "anh yêu em rất nhiều", "em yêu anh rất nhiều", 
    "anh nhớ em phát điên", "em nhớ anh phát điên",
    "cho dù có thế nào", "luôn luôn ở bên nhau", 
    "trọn đời trọn kiếp này", "yêu em hơn chính mình",
    "yêu anh hơn chính mình", "hãy luôn hạnh phúc nhé", 
    "chúc em buổi sáng vui", "chúc anh buổi sáng vui",
    "chúc em ngủ thật ngon", "chúc anh ngủ thật ngon", 
    "cùng nhau đi khắp nơi", "cùng nhau đi đến cùng",
    "mãi mãi không chia lìa", "hãy ở bên anh nhé", 
    "hãy ở bên em nhé", "anh chỉ cần em thôi",
    "em chỉ cần anh thôi", "người anh thương duy nhất", 
    "người em thương duy nhất",

    // --- Xưng hô & Cụm xưng hô ---
    "anh yêu", "em yêu", "vợ yêu", "chồng yêu", "bé yêu", "cục cưng",
    "bảo bối", "người yêu", "người thương", "người tình", "nửa kia",
    "một nửa", "tri kỷ", "bạn đời", "vợ chồng", "đôi lứa", "đôi uyên ương",
    "anh nhớ em", "em nhớ anh", "anh yêu em", "em yêu anh",
    "anh thương em", "em thương anh", "anh cần em", "em cần anh",

    // --- Tình cảm, cảm xúc ---
    "tình yêu", "tình cảm", "tình thương", "tình nghĩa", "tình thân",
    "tình bạn", "tình đầu", "mối tình", "mối quan hệ", "yêu thương",
    "thương yêu", "yêu dấu", "thương nhớ", "nhớ nhung", "nhung nhớ",
    "nhớ thương", "trân trọng", "trân quý", "quý mến", "mến thương",
    "quan tâm", "chăm sóc", "săn sóc", "che chở", "bảo vệ", "vỗ về",
    "an ủi", "động viên", "khích lệ", "sẻ chia", "chia sẻ", "thấu hiểu",
    "thông cảm", "cảm thông", "đồng cảm", "bao dung", "tha thứ",
    "khoan dung", "hy sinh", "nhường nhịn", "chiều chuộng", "nuông chiều",

    // --- Hạnh phúc, ngọt ngào ---
    "hạnh phúc", "niềm vui", "niềm hạnh phúc", "niềm tin", "niềm hy vọng",
    "ngọt ngào", "dịu dàng", "êm đềm", "bình yên", "yên bình", "ấm áp",
    "ấm êm", "ấm cúng", "tươi vui", "vui vẻ", "tràn đầy", "đong đầy",
    "đầy ắp", "viên mãn", "trọn vẹn", "mặn nồng", "nồng nàn", "nồng ấm",
    "đằm thắm", "thắm thiết", "keo sơn", "gắn bó", "gắn kết", "đồng hành",
    "bên nhau", "cạnh nhau", "có nhau", "của nhau", "với nhau",
    "cùng nhau", "tay trong tay", "nắm tay", "cầm tay", "ôm chặt",
    "ôm lấy", "vòng tay", "cái ôm", "nụ hôn", "nụ cười", "ánh mắt",
    "trái tim", "con tim", "tâm hồn", "trong tim", "từng ngày",

    // --- Lãng mạn, say đắm ---
    "lãng mạn", "say đắm", "đắm say", "si mê", "mê đắm", "cuồng nhiệt",
    "rung động", "rung rinh", "xao xuyến", "bồi hồi", "bâng khuâng",
    "thổn thức", "nao nao", "háo hức", "mong chờ", "mong nhớ", "ngóng chờ",
    "chờ đợi", "đợi chờ", "hẹn hò", "tỏ tình", "cầu hôn", "đính hôn",
    "kết hôn", "lễ cưới", "đám cưới", "tuần trăng mật", "nhẫn cưới",
    "nhẫn đính hôn", "hoa hồng", "bó hoa", "ánh trăng", "ánh sao",
    "bầu trời", "vì sao", "ngôi sao", "tiếng yêu", "lời yêu", "lời hứa",
    "lời thề", "lời nguyện", "lời chúc", "lời tỏ tình", "lời cảm ơn",

    // --- Chung thủy, bền lâu ---
    "chân thành", "chân thật", "thật lòng", "hết lòng", "dốc lòng",
    "một lòng", "trọn lòng", "trọn đời", "trọn kiếp", "suốt đời",
    "cả đời", "cả đời này", "mãi mãi", "mãi yêu", "mãi bên nhau",
    "vĩnh cửu", "vĩnh hằng", "bất diệt", "thủy chung", "son sắt",
    "chung thủy", "chung thuỷ", "bền chặt", "bền lâu", "bền vững",
    "lâu dài", "dài lâu", "đến mãi mãi", "đến bạc đầu", "đầu bạc răng long",
    "trăm năm", "bách niên giai lão", "trăm năm hạnh phúc",

    // --- Giận hờn, nhớ mong ---
    "hờn dỗi", "giận dỗi", "ghen tuông", "ghen tị", "nũng nịu", "làm nũng",
    "trách móc", "xin lỗi", "làm hòa", "làm lành", "hòa thuận", "hiểu lầm",
    "nhớ quá", "nhớ lắm", "nhớ nhiều", "nhớ em", "nhớ anh", "nhớ người",
    "thương lắm", "yêu lắm", "yêu nhiều", "yêu quá", "yêu mãi",
    "rất yêu", "rất nhớ", "rất thương", "thật nhiều", "nhiều lắm",

    // --- Lời chúc, giao tiếp ---
    "chúc mừng", "chúc ngủ ngon", "ngủ ngon", "chúc bạn", "chúc em",
    "chúc anh", "chúc con", "chúc mẹ", "chúc cha", "mong rằng",
    "hy vọng", "ước mơ", "ước nguyện", "điều ước", "may mắn",
    "bình an", "sức khỏe", "mạnh khỏe", "an lành", "vạn sự", "như ý",
    "cảm ơn", "cảm ơn em", "cảm ơn anh", "biết ơn", "tri ân",
    "xin chào", "tạm biệt", "hẹn gặp lại", "gặp lại", "chào buổi sáng",
    "chào buổi tối", "buổi sáng", "buổi tối", "ngày mai", "hôm nay",

    // --- Chat hàng ngày ---
    "đang làm gì đấy", "đang làm gì thế", "ăn cơm chưa", "đi đâu đấy",
    "có rảnh không", "đợi tí nhé", "xong chưa vậy", "về đến nhà chưa",
    "nhớ giữ sức khỏe", "uống nước nhiều vào", "ngủ sớm đi nhé",
    "mệt lắm không", "để anh lo", "để em lo", "đừng lo lắng",
    "không sao đâu", "cố lên nhé", "tốt lắm rồi", "vui lên nào",
    "dạ vâng", "được rồi", "thế nhé", "hẹn gặp sau",

    // --- Thả thính & Ngọt ngào ---
    "ngã vào lòng anh", "ngã vào lòng em", "đánh rơi nhịp tim",
    "cho anh xin số", "cho em xin số", "uống nhầm ánh mắt",
    "say nhầm nụ cười", "thả tim cho em", "thả tim cho anh",
    "bị thích em rồi", "bị thích anh rồi", "chốt đơn luôn nhé",
    "cần gì nến và hoa", "chính em là quà", "thắp sáng cả ngày",
    "bên em bình yên", "về chung nhà", "thế giới của anh",
    "ngập tràn hạnh phúc", "món quà tuyệt vời", "bền chặt ngọt ngào",
    "buổi sáng tốt lành", "gặp những giấc mơ", "làm thế giới rực rỡ",
    "luôn có anh bên cạnh", "một phần không thể thiếu", "không thể thiếu",
    "lung linh", "vấn vương", "rạng rỡ", "thao thức", "ngất ngây",
    "tính đường vào tim", "vũ trụ muôn vàn", "ngôi sao sáng nhất",
    "thời tiết đẹp nhất", "ít đường ngọt ngào", "ngập tràn niềm vui",

    // --- Gia đình, tình thân ---
    "gia đình", "mái ấm", "tổ ấm", "ông bà", "cha mẹ", "ba mẹ",
    "bố mẹ", "con cái", "anh chị", "anh em", "chị em", "anh chị em",
    "họ hàng", "người thân", "thân thương", "thân yêu", "thân thiết",
    "kính yêu", "kính trọng", "hiếu thảo", "biết ơn cha mẹ", "công ơn",
    "ơn nghĩa", "nghĩa tình", "tình mẹ", "tình cha", "tình mẫu tử",
    "tình phụ tử", "tình anh em", "tình đồng đội", "tình làng nghĩa xóm",

    // --- Cụm nối thường gặp ---
    "bởi vì", "vì anh", "vì em", "vì yêu", "vì thương", "cho anh",
    "cho em", "của anh", "của em", "với anh", "với em", "bên anh",
    "bên em", "ở bên", "ở lại", "đừng bỏ", "đừng rời", "không rời",
    "không bao giờ", "không thể", "không muốn", "không quên",
    "sẽ luôn", "luôn luôn", "luôn bên", "luôn nhớ", "luôn yêu",
    "luôn thương", "mỗi ngày", "mỗi khi", "mỗi giây", "mỗi phút",
    "từng phút", "từng giây", "từng khoảnh khắc", "khoảnh khắc",
    "kỷ niệm", "ký ức", "hồi ức", "giấc mơ", "giấc mộng", "cơn mơ",
    "chân trời", "thế giới", "cuộc đời", "cuộc sống", "cuộc tình",
    "tương lai", "quá khứ", "hiện tại", "định mệnh", "duyên số",
    "duyên phận", "nhân duyên", "kiếp này", "kiếp sau", "kiếp trước",

    // --- Lời chúc các dịp đặc biệt ---
    "chúc mừng năm mới", "an khang thịnh vượng", "vạn sự như ý",
    "tấn tài tấn lộc", "phát tài phát lộc", "sức khỏe dồi dào",
    "thi tốt nhé", "mã đáo thành công", "buôn may bán đắt",
    "khai trương hồng phát", "vạn sự bình an", "thuận buồm xuôi gió",
    "người lái đò", "bến bờ tri thức", "tri ân thầy cô", "công ơn thầy cô",
    "dìu dắt", "chắp cánh ước mơ", "tâm huyết", "nghĩa thầy trò", "ơn thầy cô",
    "ngọn lửa nhiệt huyết", "tận tụy", "người thầy", "người cô", "mái trường",
    "chúc mừng sinh nhật", "sinh nhật vui vẻ", "đón tuổi mới", "tuổi mới rạng rỡ",
    "tuổi mới thành công", "điều ước thành hiện thực", "chỗ dựa ấm áp",
    "thêm tuổi mới", "rạng rỡ tuổi mới", "đón tuổi mới vui vẻ",
    "ngày phụ nữ", "phụ nữ là để yêu thương", "một nửa thế giới", "quà 8/3",
    "quà 20/10", "xinh đẹp như hoa", "rạng rỡ như nắng", "ngày đặc biệt",
    "người phụ nữ tuyệt vời", "tôn vinh phái đẹp", "tỏa sáng",

     // --- Cụm từ mở rộng & Bổ sung ngữ cảnh ---
    "chúng ta", "chúng mình", "chúng tôi", "của mình", "cho mình",
    "yêu mình", "những ngày", "những người", "những điều", "nhưng mà",
    "dễ thương", "đáng yêu", "xinh đẹp", "đẹp đẽ", "đẹp nhất", "tốt nhất",
    "quan trọng", "bao giờ", "trở lại", "học cách", "tình yêu của anh",
    "không biết", "anh tự hỏi", "có em", "vì đã đến", "mang theo", "yêu em", "yêu anh",
    "rực rỡ", "mệt mỏi", "cần phải", "tỏ ra mạnh mẽ", "chỉ cần là", "gập gềnh",
    "cùng em", "cùng anh", "là em", "có thế nào", "anh vẫn", "em vẫn", "mãi yêu anh", "mãi yêu em",
    "dù chặng đường", "tự nhiên", "đến thế", "sinh nhật", "con gái", "trở nên", "xuất hiện",
    "làm tan biến", "tuổi mới", "bước sang", "chặng đường phía", "có ra sao", "em hãy nhớ", "anh ở đây",
    "sẵn sàng", "trải qua", "đáng nhớ", "sinh nhật thật", "đáng nhớ nhất",
    "ta thường", "chuyến đi", "còn anh", "còn em", "đơn giản", "mỗi sáng",
    "từng góc phố", "quen thuộc", "của riêng hai đứa", "qua tất cả", "ngắm em", "anh lại tự hỏi",
    "một phần", "Em đến", "một cơn gió", "mùa thu", "bé nhỏ", "bừng sáng",
    "mạnh mẽ", "một ai đó", "đến lạ", "tặng em một bó hoa", "một bó hoa",
    "hà nội", "sài gòn", "thu sang", "sang thu", "con phố", "từng con phố",
    "thoang thoảng", "trôi qua", "góc phố ấy", "cái lạnh", "nhè nhẹ", "miễn là",
    "rộng lớn", "muôn vàn", "tìm kiếm", "chỉ ước", "chỉ ước một", "dừng chân",
    "mắt em", "vào mắt em", "bắt đầu", "bắt đầu một", "lối đi",
    "anh chỉ", "mỗi lần", "vô tình", "mọi ồn ào", "xung quanh",
    "dường như", "dừng lại", "hành trình", "đi tìm", "của mỗi",
    "một chặng đường dài", "chỉ cần em", "dùng cả", "để làm",
    "có phải", "vẫn hay nói", "trái đất", "thuộc về", "thuộc về nhau", "gật đầu",
    "giữa hơn", "sẽ tìm", "anh chẳng", "tin vào", "tin vào sự", "ngẫu nhiên", 
    "yêu mình em", "yêu mình anh",

];

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const WORD_TO_CODE = new Map();
const CODE_TO_WORD = new Map();

(function buildDictionary() {
    const norm = w => w.normalize("NFC").toLowerCase().trim();
    const seen = new Set();

    // 1. Nén SHORT_WORDS (Bắt đầu bằng dấu _)
    let shortIndex = 0;
    for (const raw of SHORT_WORDS) {
        const word = norm(raw);
        if (seen.has(word) || word.length < 4) continue;

        if (shortIndex >= 676) break;
        const code = "_" + ALPHABET[Math.floor(shortIndex / 26)] + ALPHABET[shortIndex % 26];

        seen.add(word);
        shortIndex++;
        WORD_TO_CODE.set(word, code);
        CODE_TO_WORD.set(code, word);
    }

    // 2. Nén LOVE_WORDS (Bắt đầu bằng dấu *)
    let loveIndex = 0;
    for (const raw of LOVE_WORDS) {
        const word = norm(raw);
        if (seen.has(word) || word.length < 4) continue;

        if (loveIndex >= 676) break;
        const code = "*" + ALPHABET[Math.floor(loveIndex / 26)] + ALPHABET[loveIndex % 26];

        seen.add(word);
        loveIndex++;
        WORD_TO_CODE.set(word, code);
        CODE_TO_WORD.set(code, word);
    }
})();

// Sắp xếp các cụm từ theo độ dài giảm dần để ưu tiên nén câu dài
const COMPRESS_REGEX = new RegExp(
    "(?<![\\p{L}\\p{N}_])(?:" +
    [...WORD_TO_CODE.keys()]
        .sort((a, b) => b.length - a.length)
        .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|") +
    ")(?![\\p{L}\\p{N}_])",
    "giu"
);

function capCode(match, code) {
    const prefix = code[0];
    const isUpper = match === match.toUpperCase();

    if (isUpper) {
        return prefix + code[1].toUpperCase() + code[2].toUpperCase();
    }
    // Chữ cái đầu viết hoa (Title Case)
    return prefix + code[1].toUpperCase() + code[2].toLowerCase();
}

/**
 * Nén văn bản Tiếng Việt dựa trên từ điển Keypans
 * @param {string} text 
 * @returns {string}
 */
function compressWithDictionary(text) {
    if (!text) return "";
    return text
        .normalize("NFC")
        .replace(/[*_]/g, c => c + c) // Escape các ký tự đặc biệt * và _ sẵn có trong chuỗi gốc
        .replace(COMPRESS_REGEX, (match) => {
            const code = WORD_TO_CODE.get(match.toLowerCase());
            if (!code) return match;
            return match[0] !== match[0].toLowerCase() ? capCode(match, code) : code;
        });
}

/**
 * Giải nén văn bản về lại Tiếng Việt nguyên bản
 * @param {string} text 
 * @returns {string}
 */
function decompressWithDictionary(text) {
    if (!text) return "";
    return text.replace(/\*\*|__|(_|\*)[a-zA-Z]{2}/g, (token) => {
        if (token === "**") return "*";
        if (token === "__") return "_";

        const prefix = token[0];
        const chars = token.slice(1);
        const key = prefix + chars.toLowerCase();
        const word = CODE_TO_WORD.get(key);

        if (!word) return token;

        const c1Upper = chars[0] !== chars[0].toLowerCase();
        const c2Upper = chars[1] !== chars[1].toLowerCase();

        if (c1Upper && c2Upper) {
            return word.toUpperCase();
        } else if (c1Upper) {
            return word[0].toUpperCase() + word.slice(1);
        }
        return word;
    });
}

// Xuất Module hỗ trợ cả Node.js và Browser
if (typeof module !== "undefined" && module.exports) {
    module.exports = { compressWithDictionary, decompressWithDictionary, WORD_TO_CODE, CODE_TO_WORD };
} else if (typeof window !== "undefined") {
    window.Keypans = { compressWithDictionary, decompressWithDictionary, WORD_TO_CODE, CODE_TO_WORD };
}