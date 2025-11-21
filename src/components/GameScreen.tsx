import React, { useState, useEffect } from 'react';
import { getRandomSymbol, generateOptions } from '../utils/zhuyin';
import { playZhuyin, playSoundEffect, stopAudio } from '../utils/audio';

interface GameScreenProps {
    lives: number;
    difficulty: number;
    onGameOver: (success: boolean, score: number) => void;
    isTimerEnabled: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ lives: initialLives, difficulty, onGameOver, isTimerEnabled }) => {
    const [lives, setLives] = useState(initialLives);
    const [score, setScore] = useState(0);
    const [target, setTarget] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const getTimeLimit = (diff: number) => {
        switch (diff) {
            case 1: return 20;
            case 2: return 10;
            case 3: return 5;
            default: return 20;
        }
    };

    const nextRound = () => {
        const newTarget = getRandomSymbol();
        setTarget(newTarget);
        const optionsCount = Math.floor(Math.random() * 6) + 5; // Random between 5 and 10
        setOptions(generateOptions(newTarget, optionsCount));
        setFeedback(null);
        setTimeLeft(getTimeLimit(difficulty));
        setIsPlaying(true);
        playZhuyin(newTarget, () => setIsPlaying(false));
    };

    useEffect(() => {
        nextRound();
        return () => {
            stopAudio(); // Stop any playing audio on unmount
        };
    }, []);

    useEffect(() => {
        if (!isTimerEnabled) return; // Don't run timer if disabled
        if (feedback !== null) return; // Stop timer if answered
        if (!target) return; // Don't start timer if game hasn't started (target is empty)

        if (timeLeft <= 0) {
            handleTimeOut();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, feedback, target, isTimerEnabled]);

    const handleTimeOut = () => {
        setFeedback('wrong');
        playSoundEffect('wrong');
        const newLives = lives - 1;
        setLives(newLives);

        setTimeout(() => {
            if (newLives <= 0) {
                playSoundEffect('lose');
                onGameOver(false, score);
            } else {
                nextRound();
            }
        }, 1000);
    };

    const handleAnswer = (answer: string) => {
        if (feedback) return; // Prevent double clicking

        if (answer === target) {
            setFeedback('correct');
            playSoundEffect('correct');
            const newScore = score + 1;
            setScore(newScore);

            // Removed reinforcement audio to prevent repetition complaint

            setTimeout(() => {
                if (newScore >= 10) {
                    playSoundEffect('win');
                    onGameOver(true, newScore);
                } else {
                    nextRound();
                }
            }, 1000);
        } else {
            setFeedback('wrong');
            playSoundEffect('wrong');
            const newLives = lives - 1;
            setLives(newLives);

            setTimeout(() => {
                if (newLives <= 0) {
                    playSoundEffect('lose');
                    onGameOver(false, score);
                } else {
                    setFeedback(null);
                }
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-yellow-50 p-4">
            <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-md mb-4 md:mb-8 gap-2 md:gap-0">
                <div className="text-lg md:text-xl font-bold text-red-500">愛心: {'❤️'.repeat(lives)}</div>
                <div className="text-lg md:text-xl font-bold text-purple-600">時間: {isTimerEnabled ? `${timeLeft}s` : '∞'}</div>
                <div className="text-lg md:text-xl font-bold text-blue-500">得分: {score}/10</div>
            </div>

            <div className="mb-4 md:mb-8 flex flex-col items-center">
                <button
                    onClick={() => {
                        setIsPlaying(true);
                        playZhuyin(target, () => setIsPlaying(false));
                    }}
                    disabled={isPlaying}
                    className={`mb-4 p-3 md:p-4 bg-white rounded-full shadow-lg transition ${isPlaying
                        ? 'opacity-50 cursor-not-allowed scale-95 ring-2 ring-blue-300'
                        : 'hover:bg-gray-100 hover:scale-105'
                        }`}
                >
                    {isPlaying ? '🔊 播放中...' : '🔊 聽聲音'}
                </button>
                <div className="text-5xl md:text-6xl font-bold text-gray-800 h-20 md:h-24 flex items-center justify-center">
                    ❓
                </div>
            </div>

            {feedback === 'correct' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
                    <div className="text-8xl md:text-9xl text-green-500 animate-bounce">⭕</div>
                </div>
            )}

            {feedback === 'wrong' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
                    <div className="text-8xl md:text-9xl text-red-500 animate-pulse">❌</div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 w-full max-w-md">
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="p-4 md:p-6 bg-white text-3xl md:text-4xl font-bold rounded-xl shadow-md hover:bg-blue-50 transition transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-blue-200"
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GameScreen;
