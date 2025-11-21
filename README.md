# 注音練習遊戲 (Zhuyin Practice Game)

這是一個使用 **Tauri** + **React** + **Rust** 開發的注音符號練習應用程式。旨在幫助使用者透過遊戲化的方式熟悉注音符號的發音與辨識。

## ✨ 功能特色

*   **多種難度選擇**：
    *   🟢 **簡單**：5 顆愛心
    *   🟡 **中等**：3 顆愛心
    *   🔴 **困難**：1 顆愛心
*   **聽音辨位**：隨機播放注音符號讀音，玩家需從選項中選出正確的符號。
*   **注音庫**：內建完整注音符號列表，可點擊查看並聆聽個別發音。
*   **計時挑戰**：可自由開啟或關閉倒數計時功能，增加遊戲刺激感。
*   **本地音效**：使用 Rust 後端處理音效播放，確保流暢體驗。

## 🛠️ 技術棧

*   **前端**：React, TypeScript, TailwindCSS, Vite
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
    *   `components/`: 遊戲組件 (主選單、遊戲畫面、注音庫等)
    *   `utils/`: 工具函式 (注音資料、音效控制)
*   `src-tauri/`: Rust 後端程式碼
    *   `src/lib.rs`: 主要後端邏輯與 Tauri 指令
    *   `assets/audio/`: 注音音效檔案

## 📝 授權

MIT License
