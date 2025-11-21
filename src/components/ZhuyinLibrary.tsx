import React, { useState } from 'react';
import { open, ask, message } from '@tauri-apps/plugin-dialog';
import { ZHUYIN_SYMBOLS } from '../utils/zhuyin';
import { playZhuyin, uploadAudio, resetAllAudio } from '../utils/audio';

interface ZhuyinLibraryProps {
    onBack: () => void;
}

const ZhuyinLibrary: React.FC<ZhuyinLibraryProps> = ({ onBack }) => {
    const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handlePlay = async (symbol: string) => {
        if (playingSymbol || isUploading) return;

        setPlayingSymbol(symbol);
        await playZhuyin(symbol, () => {
            setPlayingSymbol(null);
        });
    };

    const handleUpload = async (e: React.MouseEvent, symbol: string) => {
        e.stopPropagation();
        if (playingSymbol || isUploading) return;

        try {
            setIsUploading(true);
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Audio',
                    extensions: ['mp3']
                }]
            });

            if (selected && typeof selected === 'string') {
                await uploadAudio(symbol, selected);
                await message(`已更新 ${symbol} 的音檔`, { title: '成功' });
            }
        } catch (err) {
            console.error("Upload failed:", err);
            await message("上傳失敗", { title: '錯誤', kind: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = async () => {
        if (playingSymbol || isUploading) return;

        const yes = await ask('確定要還原所有音檔嗎？', {
            title: '還原確認',
            kind: 'warning'
        });

        if (!yes) return;

        try {
            setIsUploading(true);
            await resetAllAudio();
            await message('已還原所有音檔', { title: '成功' });
        } catch (err) {
            console.error("Reset failed:", err);
            await message('還原失敗', { title: '錯誤', kind: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen w-full bg-blue-50 p-4">
            <div className="w-full max-w-4xl flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    disabled={!!playingSymbol || isUploading}
                    className={`px-4 py-2 text-white rounded-lg font-semibold transition ${playingSymbol || isUploading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gray-500 hover:bg-gray-600'
                        }`}
                >
                    返回選單
                </button>
                <h1 className="text-3xl font-bold text-blue-600">注音庫</h1>
                <button
                    onClick={handleReset}
                    disabled={!!playingSymbol || isUploading}
                    className={`px-4 py-2 text-white rounded-lg font-semibold transition ${playingSymbol || isUploading
                            ? 'bg-red-300 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                >
                    一鍵還原
                </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 p-4 bg-white rounded-xl shadow-lg w-full max-w-4xl">
                {ZHUYIN_SYMBOLS.map((symbol) => (
                    <div key={symbol} className="relative group">
                        <button
                            onClick={() => handlePlay(symbol)}
                            disabled={!!playingSymbol || isUploading}
                            className={`w-full aspect-square flex items-center justify-center text-3xl font-bold rounded-lg transition-all duration-200 border-2 
                                ${playingSymbol === symbol
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-400 scale-110 shadow-md ring-4 ring-yellow-200'
                                    : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:scale-105 shadow-sm'}
                                ${playingSymbol && playingSymbol !== symbol ? 'opacity-50' : ''}
                            `}
                        >
                            {symbol}
                        </button>
                        {/* Upload Button (visible on hover or always visible if preferred, here hover) */}
                        <button
                            onClick={(e) => handleUpload(e, symbol)}
                            disabled={!!playingSymbol || isUploading}
                            className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                            title="更換音檔"
                        >
                            ✏️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ZhuyinLibrary;
