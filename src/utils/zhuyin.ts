export const ZHUYIN_SYMBOLS = [
    "ㄅ", "ㄆ", "ㄇ", "ㄈ", "ㄉ", "ㄊ", "ㄋ", "ㄌ", "ㄍ", "ㄎ", "ㄏ",
    "ㄐ", "ㄑ", "ㄒ", "ㄓ", "ㄔ", "ㄕ", "ㄖ", "ㄗ", "ㄘ", "ㄙ",
    "ㄧ", "ㄨ", "ㄩ", "ㄚ", "ㄛ", "ㄜ", "ㄝ", "ㄞ", "ㄟ", "ㄠ", "ㄡ",
    "ㄢ", "ㄣ", "ㄤ", "ㄥ", "ㄦ"
];

export const getRandomSymbol = () => {
    const index = Math.floor(Math.random() * ZHUYIN_SYMBOLS.length);
    return ZHUYIN_SYMBOLS[index];
};

export const generateOptions = (correct: string, count: number = 3) => {
    const options = new Set<string>();
    options.add(correct);
    while (options.size < count) {
        options.add(getRandomSymbol());
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
};
