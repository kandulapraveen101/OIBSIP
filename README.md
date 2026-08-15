# CalcNova — Modern Browser-Based Calculator

A sleek, responsive, feature-rich web calculator built using **HTML5, Vanilla CSS3 (Grid layout & Glassmorphism design system)**, and **Vanilla JavaScript**.

![CalcNova Banner](https://img.shields.io/badge/Tech%20Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-blue)
![Eval Check](https://img.shields.io/badge/Security-No%20eval%28%29-brightgreen)
![Layout](https://img.shields.io/badge/Layout-CSS%20Grid-purple)

---

## 🚀 Features

- 📱 **Dual-Line Screen Display**: Displays both the live typed mathematical expression and the main evaluation output.
- 🧮 **Custom Expression Engine (No `eval()`)**:
  - Implements standard algebraic operator precedence (multiplication `×` and division `÷` evaluated before addition `+` and subtraction `−`).
  - Supports **operator chaining** (e.g., `5 + 3 × 2 = 11`).
  - Prevents floating-point precision quirks (e.g., `0.1 + 0.2` formats cleanly to `0.3`).
- ⚠️ **Divide-by-Zero Guard**: Detects division by zero (`X ÷ 0`) and displays a non-intrusive warning callout banner (*"Cannot divide by zero"*) instead of crashing or returning `Infinity`.
- 🎨 **Modern Glassmorphism & Dual Themes**:
  - **Dark Luxury Glass Theme** (default) with luminous glowing ambient background orbs.
  - **Light Ceramic Glass Theme** for clean daytime use.
- 🎹 **Full Keyboard Support**: Use physical keyboard keys to operate numbers, operators, backspace, clear, and equals.
- 📜 **Calculation History Side Drawer**: Automatically logs completed calculations to `localStorage` with a click-to-recall feature.
- 🔊 **Subtle Audio Click Synthesizer**: Interactive Web Audio API click tone generator with mute toggle.
- 📱 **Fully Responsive**: Designed with CSS Grid for clean keypad alignment across mobile, tablet, and desktop screens.

---

## 🛠️ Tech Stack

- **HTML5**: Semantic layout with accessibility labels (`aria-live`, `aria-label`, `role="alert"`).
- **CSS3**: CSS Custom Properties (variables), CSS Grid (`repeat(4, 1fr)`), Flexbox, CSS Keyframe Animations, Glassmorphism (`backdrop-filter`).
- **JavaScript (Vanilla ES6+)**:
  - Dynamic event listeners via `addEventListener` (zero inline `onclick` attributes).
  - Custom tokenizing and operator precedence evaluator algorithm.
  - `localStorage` API for history retention.
  - Web Audio API for feedback sounds.

---

## 📂 File Structure

```text
WebDev-L2-Calculator/
├── index.html        # Main semantic markup and calculator display container
├── style.css         # Keypad grid layout, glassmorphism tokens, themes, & keyframes
├── script.js        # Custom mathematical evaluator, event handlers, & state logic
└── README.md         # Documentation
```

---

## ⌨️ Keyboard Shortcuts Reference

| Input Action | Keyboard Key(s) |
| :--- | :--- |
| **Digits (0–9)** | `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9` |
| **Decimal Point** | `.` |
| **Addition (+)** | `+` |
| **Subtraction (−)** | `-` |
| **Multiplication (×)** | `*` |
| **Division (÷)** | `/` |
| **Evaluate (=)** | `Enter` or `=` |
| **Backspace / Delete** | `Backspace` |
| **Clear All (AC)** | `Escape` or `C` |
| **Percentage (%)** | `%` |

---

## 💻 How to Run Locally

1. Clone or download this project repository.
2. Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari).
3. Alternatively, serve via a simple local HTTP server:
   ```bash
   # Using Python:
   python -m http.server 8080

   # Or using Node npx http-server:
   npx http-server .
   ```
4. Navigate to `http://localhost:8080` in your web browser.

---

## 📜 License

This project is created for educational and portfolio demonstration purposes. Open source under the MIT License.
