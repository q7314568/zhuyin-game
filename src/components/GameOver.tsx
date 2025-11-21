import React from 'react';

interface GameOverProps {
    success: boolean;
    score: number;
    onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ success, score, onRestart }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-100 p-4">
            <h1 className={`text-3xl md:text-5xl font-bold mb-4 ${success ? 'text-green-600' : 'text-red-600'}`}>
                {success ? '闖關成功！' : '闖關失敗'}
            </h1>
            <p className="text-xl md:text-2xl mb-6 md:mb-8 text-gray-700">
                你的得分: {score} / 10
            </p>
            <button
                onClick={onRestart}
                className="w-full max-w-xs sm:w-auto px-8 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition text-lg md:text-xl font-semibold"
            >
                再玩一次
            </button>
        </div>
    );
};

export default GameOver;
