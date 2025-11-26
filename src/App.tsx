import { useState } from "react";
import MainMenu from "./features/menu/MainMenu";
import ListeningGame from "./features/listening/ListeningGame";
import GameOver from "./components/GameOver";
import ZhuyinLibrary from "./features/library/ZhuyinLibrary";
import { SoundHunterGame } from "./features/sound-hunter/SoundHunterGame";
import { GameState } from "./types";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [lives, setLives] = useState(5);
  const [difficulty, setDifficulty] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);

  // 開始遊戲 (聽音練習)
  const handleStart = (selectedDifficulty: number, timerEnabled: boolean) => {
    let initialLives = 5;
    if (selectedDifficulty === 2) initialLives = 3;
    if (selectedDifficulty === 3) initialLives = 1;

    setLives(initialLives);
    setDifficulty(selectedDifficulty);
    setIsTimerEnabled(timerEnabled);
    setGameState('playing');
  };

  // 遊戲結束處理
  const handleGameOver = (success: boolean, score: number) => {
    setIsSuccess(success);
    setFinalScore(score);
    setGameState('gameover');
  };

  // 返回主選單
  const handleRestart = () => {
    setGameState('menu');
  };

  // 進入注音庫
  const handleLibrary = () => {
    setGameState('library');
  };

  // 進入注音獵人遊戲
  const handleSoundHunter = () => {
    setGameState('soundHunter');
  };

  return (
    <div className="w-full min-h-screen">
      {/* 根據遊戲狀態渲染對應的組件 */}
      {gameState === 'menu' && <MainMenu onStart={handleStart} onLibrary={handleLibrary} onSoundHunter={handleSoundHunter} />}
      {gameState === 'playing' && <ListeningGame lives={lives} difficulty={difficulty} onGameOver={handleGameOver} isTimerEnabled={isTimerEnabled} />}
      {gameState === 'gameover' && <GameOver success={isSuccess} score={finalScore} onRestart={handleRestart} />}
      {gameState === 'library' && <ZhuyinLibrary onBack={handleRestart} />}
      {gameState === 'soundHunter' && <SoundHunterGame onBack={handleRestart} />}
    </div>
  );
}

export default App;
