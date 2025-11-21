import { useState } from "react";
import MainMenu from "./components/MainMenu";
import GameScreen from "./components/GameScreen";
import GameOver from "./components/GameOver";
import ZhuyinLibrary from "./components/ZhuyinLibrary";
import "./App.css";

type GameState = 'menu' | 'playing' | 'gameover' | 'library';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [lives, setLives] = useState(5);
  const [difficulty, setDifficulty] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);

  const handleStart = (selectedDifficulty: number, timerEnabled: boolean) => {
    let initialLives = 5;
    if (selectedDifficulty === 2) initialLives = 3;
    if (selectedDifficulty === 3) initialLives = 1;

    setLives(initialLives);
    setDifficulty(selectedDifficulty);
    setIsTimerEnabled(timerEnabled);
    setGameState('playing');
  };

  const handleGameOver = (success: boolean, score: number) => {
    setIsSuccess(success);
    setFinalScore(score);
    setGameState('gameover');
  };

  const handleRestart = () => {
    setGameState('menu');
  };

  const handleLibrary = () => {
    setGameState('library');
  };

  return (
    <div className="w-full min-h-screen">
      {gameState === 'menu' && <MainMenu onStart={handleStart} onLibrary={handleLibrary} />}
      {gameState === 'playing' && <GameScreen lives={lives} difficulty={difficulty} onGameOver={handleGameOver} isTimerEnabled={isTimerEnabled} />}
      {gameState === 'gameover' && <GameOver success={isSuccess} score={finalScore} onRestart={handleRestart} />}
      {gameState === 'library' && <ZhuyinLibrary onBack={handleRestart} />}
    </div>
  );
}

export default App;
