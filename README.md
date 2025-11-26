# 注音練習遊戲 (Zhuyin Practice Game)

這是一個使用 **Tauri** + **React** + **Rust** 開發的注音符號練習應用程式。旨在幫助使用者透過遊戲化的方式熟悉注音符號的發音與辨識。

## ✨ 功能特色

*   **聲音獵人 (Sound Hunter)**：全新遊戲模式！
    *   🎮 **物理射擊**：操控大砲發射砲彈或空氣彈，擊落帶有注音符號的氣球。
    *   ⌨️🖱️ **雙重操作**：支援鍵盤 (左右鍵) 或滑鼠瞄準，空白鍵射擊。
    *   🔥 **Combo Fever**：連續答對觸發 Fever Mode，分數加倍！
    *   😲 **動態表情**：氣球會根據遊戲狀況做出驚訝、暈眩等表情。
    *   💨 **空氣彈機制**：使用空氣彈推開干擾氣球，策略性解題。
*   **多種難度選擇**：
    *   🟢 **簡單**：5 顆愛心
    *   🟡 **中等**：3 顆愛心
    *   🔴 **困難**：1 顆愛心
*   **聽音辨位**：隨機播放注音符號讀音，玩家需從選項中選出正確的符號。
*   **注音庫**：內建完整注音符號列表，可點擊查看並聆聽個別發音。
*   **計時挑戰**：可自由開啟或關閉倒數計時功能，增加遊戲刺激感。
*   **本地音效**：使用 Rust 後端處理音效播放，確保流暢體驗。

## 🛠️ 技術棧

*   **前端**：React, TypeScript, TailwindCSS, Vite, **Pixi.js** (遊戲引擎)
*   **後端**：Rust (Tauri)
*   **音效處理**：Rodio (Rust Crate)

## 🚀 開始使用

### 前置需求

確保您的電腦已安裝以下工具：
*   [Node.js](https://nodejs.org/) (建議使用 LTS 版本)
*   [Rust](https://www.rust-lang.org/)

### 安裝依賴

```bash
npm install
```

### 開發模式

啟動前端與 Tauri 後端進行開發：

```bash
npm run tauri dev
```

### 建置發布

打包應用程式：

```bash
npm run tauri build
```

## 📂 專案結構

*   `src/`: React 前端程式碼
    *   `features/`: 功能模組 (Sound Hunter, Zhuyin Library 等)
    *   `services/`: 服務層 (Audio Service 等)
    *   `components/`: 共用組件
    *   `utils/`: 工具函式
*   `src-tauri/`: Rust 後端程式碼
    *   `src/lib.rs`: 主要後端邏輯與 Tauri 指令
    *   `assets/audio/`: 注音音效檔案

## 📝 授權

MIT License
