import React from 'react';
import { ZHUYIN_SYMBOLS } from '../utils/zhuyin';
import { playZhuyin } from '../utils/audio';

interface ZhuyinLibraryProps {
    onBack: () => void;
}

const ZhuyinLibrary: React.FC<ZhuyinLibraryProps> = ({ onBack }) => {
    const handlePlay = (symbol: string) => {
        playZhuyin(symbol);
    };

    return (
        <div className="flex flex-col items-center min-h-screen w-full bg-blue-50 p-4">
            <div className="w-full max-w-4xl flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                >
                    返回選單
                </button>
                <h1 className="text-3xl font-bold text-blue-600">注音庫</h1>
                <div className="w-24"></div> {/* Spacer for centering */}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 p-4 bg-white rounded-xl shadow-lg w-full max-w-4xl">
                {ZHUYIN_SYMBOLS.map((symbol) => (
                    <button
                        key={symbol}
                        onClick={() => handlePlay(symbol)}
                        className="aspect-square flex items-center justify-center text-3xl font-bold bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 hover:scale-105 transition-all duration-200 shadow-sm border-2 border-blue-200"
                    >
                        {symbol}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ZhuyinLibrary;
