import { useSoundHunterGame } from './useSoundHunterGame';

interface SoundHunterGameProps {
    onBack: () => void;
}

export const SoundHunterGame = ({ onBack }: SoundHunterGameProps) => {
    const {
        containerRef,
        score,
        combo,
        targetSymbol,
        showHint,
        isCannonJammed,
        ammoType,
        handleReplayAudio
    } = useSoundHunterGame({ onBack });

    return (
        <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-gray-900 text-white relative">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white z-10"
            >
                Back
            </button>

            {/* HUD (抬頭顯示器) */}
            <div className="absolute top-4 right-4 flex flex-col items-end z-10">
                <div className="text-2xl font-bold text-yellow-400">Score: {score}</div>
                <div className="text-xl text-blue-300">Combo: {combo}</div>
                <div className={`mt-2 px-3 py-1 rounded-full text-lg font-bold ${ammoType === 'cannon' ? 'bg-yellow-600 text-white' : 'bg-cyan-600 text-white'}`}>
                    {ammoType === 'cannon' ? '💣 砲彈 (Cannon)' : '💨 空氣彈 (Air)'}
                </div>
            </div>

            {/* 重播按鈕 */}
            <button
                onClick={handleReplayAudio}
                className="absolute bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-110 active:scale-95"
                title="Replay Audio"
            >
                🔊
            </button>

            {/* 視覺提示 (鬼影) */}
            {showHint && targetSymbol && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl font-bold text-white opacity-20 pointer-events-none animate-pulse z-0">
                    {targetSymbol}
                </div>
            )}

            {/* 卡彈指示器 */}
            {isCannonJammed && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-red-500 font-bold text-xl animate-bounce z-10">
                    卡彈中... (Jammed!)
                </div>
            )}

            <div ref={containerRef} className="border-4 border-white rounded-lg overflow-hidden shadow-2xl" />

            <div className="mt-2 text-gray-400 text-sm">
                聽音辨位：請射擊聽到的注音符號！ | ↑↓ 切換子彈
            </div>
        </div>
    );
};
