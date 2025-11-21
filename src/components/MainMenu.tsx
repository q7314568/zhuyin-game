import React from 'react';

interface MainMenuProps {
    onStart: (difficulty: number, enableTimer: boolean) => void;
    onLibrary: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, onLibrary }) => {
    const [enableTimer, setEnableTimer] = React.useState(true);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-blue-50 p-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-blue-600">注音練習遊戲</h1>

            <div className="mb-6 flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                <input
                    type="checkbox"
                    id="timerToggle"
                    checked={enableTimer}
                    onChange={(e) => setEnableTimer(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="timerToggle" className="ml-3 text-lg text-gray-700 font-medium cursor-pointer select-none">開啟計時 (Timer)</label>
            </div>

            <div className="space-y-3 md:space-y-4 w-full flex flex-col items-center">
                <button
                    onClick={() => onStart(1, enableTimer)}
                    className="w-full max-w-xs sm:w-64 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition text-lg md:text-xl font-semibold"
                >
                    簡單 (5 顆愛心)
                </button>
                <button
                    onClick={() => onStart(2, enableTimer)}
                    className="w-full max-w-xs sm:w-64 py-3 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition text-lg md:text-xl font-semibold"
                >
                    中等 (3 顆愛心)
                </button>
                <button
                    onClick={() => onStart(3, enableTimer)}
                    className="w-full max-w-xs sm:w-64 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition text-lg md:text-xl font-semibold"
                >
                    困難 (1 顆愛心)
                </button>

                <div className="h-2"></div>

                <button
                    onClick={onLibrary}
                    className="w-full max-w-xs sm:w-64 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition text-lg md:text-xl font-semibold"
                >
                    注音庫
                </button>
            </div>
        </div>
    );
};

export default MainMenu;
