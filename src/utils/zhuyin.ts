// 完整的注音符號列表 (共 37 個)
export const ZHUYIN_SYMBOLS = [
    "ㄅ", "ㄆ", "ㄇ", "ㄈ", "ㄉ", "ㄊ", "ㄋ", "ㄌ", "ㄍ", "ㄎ", "ㄏ",
    "ㄐ", "ㄑ", "ㄒ", "ㄓ", "ㄔ", "ㄕ", "ㄖ", "ㄗ", "ㄘ", "ㄙ",
    "ㄧ", "ㄨ", "ㄩ", "ㄚ", "ㄛ", "ㄜ", "ㄝ", "ㄞ", "ㄟ", "ㄠ", "ㄡ",
    "ㄢ", "ㄣ", "ㄤ", "ㄥ", "ㄦ"
];

// 隨機取得一個注音符號
export const getRandomSymbol = () => {
    const index = Math.floor(Math.random() * ZHUYIN_SYMBOLS.length);
    return ZHUYIN_SYMBOLS[index];
};

// 產生選項 (包含正確答案與隨機干擾項)
export const generateOptions = (correct: string, count: number = 3) => {
    const options = new Set<string>();
    options.add(correct);
    while (options.size < count) {
        options.add(getRandomSymbol());
    }
    // 打亂選項順序
    return Array.from(options).sort(() => Math.random() - 0.5);
};

// 判斷是否為聲母 (Initials)
export const isInitial = (symbol: string): boolean => {
    const initials = [
        "ㄅ", "ㄆ", "ㄇ", "ㄈ", "ㄉ", "ㄊ", "ㄋ", "ㄌ", "ㄍ", "ㄎ", "ㄏ",
        "ㄐ", "ㄑ", "ㄒ", "ㄓ", "ㄔ", "ㄕ", "ㄖ", "ㄗ", "ㄘ", "ㄙ"
    ];
    return initials.includes(symbol);
};

// 取得符號對應顏色
// 聲母 (ㄅㄆㄇ): 冷色系（藍、紫）
// 韻母 (ㄚㄛㄜ): 暖色系（紅、橘）
export const getSymbolColor = (symbol: string): number => {
    if (isInitial(symbol)) {
        // 冷色系：隨機藍/紫
        const coolColors = [0x4169E1, 0x1E90FF, 0x00BFFF, 0x8A2BE2, 0x9370DB];
        return coolColors[Math.floor(Math.random() * coolColors.length)];
    } else {
        // 暖色系：隨機紅/橘
        const warmColors = [0xFF4500, 0xFF6347, 0xFF8C00, 0xFFA500, 0xFF7F50];
        return warmColors[Math.floor(Math.random() * warmColors.length)];
    }
};
