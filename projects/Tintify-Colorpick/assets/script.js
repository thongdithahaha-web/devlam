const tabGradient = document.getElementById("tabGradient");
const tabColor = document.getElementById("tabColor");
const sectionGradient = document.getElementById("sectionGradient");
const sectionColor = document.getElementById("sectionColor");

tabGradient.addEventListener("click", () => {
  tabGradient.classList.add("active");
  tabColor.classList.remove("active");
  sectionGradient.classList.add("active");
  sectionColor.classList.remove("active");
  document.body.style.background = currentGradient;
});

tabColor.addEventListener("click", () => {
  tabColor.classList.add("active");
  tabGradient.classList.remove("active");
  sectionColor.classList.add("active");
  sectionGradient.classList.remove("active");
  document.body.style.background = currentColor;
});
const colorBtn = document.getElementById("colorBtn");
const colorCode = document.getElementById("colorCode");
const colorCopyCode = document.getElementById("colorCopyCode");
const colorText = document.getElementById("colorText");
const colorPicker = document.getElementById("colorPicker");

let currentColor = "#4e5d76";

function updateColor(color) {
  currentColor = color;
  document.body.style.background = color;
  colorCode.textContent = `background: ${color};`;
  colorBtn.style.backgroundColor = color;
  colorText.textContent = color;
  colorPicker.value = color;
  colorCopyCode.style.background = color;
}

colorBtn.addEventListener("click", (e) => {
  if (e.target.id === "colorPicker") return;
  const newColor = randomHex();
  updateColor(newColor);
});

colorPicker.addEventListener("input", (e) => {
  updateColor(e.target.value);
});

function randomHex() {
  const chars = "0123456789abcdef";
  let color = "";
  for (let i = 0; i < 6; i++) {
    color += chars[Math.floor(Math.random() * 16)];
  }
  return `#${color}`;
}

// colorCopyCode.querySelector(".copyBtn").addEventListener("click", () => {
//     navigator.clipboard.writeText(colorCode.textContent).then(() => {
//         alert("Copied to clipboard");
//     });
// });

const gradBtn1 = document.getElementById("gradBtn1");
const gradBtn2 = document.getElementById("gradBtn2");
const gradText1 = document.getElementById("gradText1");
const gradText2 = document.getElementById("gradText2");
const gradPicker1 = document.getElementById("gradPicker1");
const gradPicker2 = document.getElementById("gradPicker2");

let color1 = "#082a3d";
let color2 = "#4e5d76";

function updateGradient() {
  currentGradient = `linear-gradient(to right, ${color1}, ${color2})`;
  document.body.style.background = currentGradient;
  gradColorCode.textContent = `background: ${currentGradient};`;
  gradBtn1.style.backgroundColor = color1;
  gradBtn2.style.backgroundColor = color2;
  gradText1.textContent = color1;
  gradText2.textContent = color2;
  gradCopyCode.style.background = currentGradient;
}

gradBtn1.addEventListener("click", (e) => {
  if (e.target === gradPicker1) return;
  color1 = randomHex();
  gradPicker1.value = color1;
  updateGradient();
});

gradBtn2.addEventListener("click", (e) => {
  if (e.target === gradPicker2) return;
  color2 = randomHex();
  gradPicker2.value = color2;
  updateGradient();
});

gradPicker1.addEventListener("input", (e) => {
  color1 = e.target.value;
  updateGradient();
});

gradPicker2.addEventListener("input", (e) => {
  color2 = e.target.value;
  updateGradient();
});

let currentGradient = `linear-gradient(to right, ${color1}, ${color2})`;

function randomHex() {
  const chars = "0123456789abcdef";
  let color = "";
  for (let i = 0; i < 6; i++) {
    color += chars[Math.floor(Math.random() * 16)];
  }
  return `#${color}`;
}

function updateGradient() {
  currentGradient = `linear-gradient(to right, ${color1}, ${color2})`;
  document.body.style.background = currentGradient;
  gradColorCode.textContent = `background: ${currentGradient};`;
  gradBtn1.style.backgroundColor = color1;
  gradBtn2.style.backgroundColor = color2;
  gradText1.textContent = color1;
  gradText2.textContent = color2;
  gradCopyCode.style.background = currentGradient;
}

// Copy Gradient CSS
// gradCopyCode.querySelector(".copyBtn").addEventListener("click", () => {
//     navigator.clipboard.writeText(gradColorCode.textContent).then(() => {
//         alert("Copied to clipboard");
//     });
// });

document.querySelectorAll(".copyBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const parent = btn.closest(".copy_code");
    const code = parent.querySelector("p");
    const text = code ? code.innerText.trim() : "";

    if (text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          const toast = document.getElementById("toast");
          toast.textContent = "Copied to clipboard: " + text;
          toast.classList.add("show");

          setTimeout(() => {
            toast.classList.remove("show");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    }
  });
});
