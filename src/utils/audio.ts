import { invoke } from '@tauri-apps/api/core';
import { AppConfig } from '../config';

export const playZhuyin = async (symbol: string, onEnd?: () => void) => {
    if (AppConfig.AUDIO_SOURCE === 'backend') {
        try {
            await invoke('play_audio', { symbol });
            // Since backend audio is "fire and forget" in our current implementation, 
            // we simulate onEnd after a reasonable duration or immediately.
            // Ideally, the backend should emit an event when audio finishes, but for now:
            if (onEnd) setTimeout(onEnd, 800); // Approximate duration
        } catch (error) {
            console.error("Failed to play backend audio:", error);
            // Fallback to frontend if backend fails? Or just error.
            // Let's fallback for robustness
            console.log("Falling back to frontend audio");
            playFrontendAudio(symbol, onEnd);
        }
    } else {
        playFrontendAudio(symbol, onEnd);
    }
};

const playFrontendAudio = (symbol: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(symbol);
        utterance.lang = 'zh-TW';
        utterance.rate = 0.8; // Slightly slower for clarity
        if (onEnd) {
            utterance.onend = onEnd;
        }
        window.speechSynthesis.speak(utterance);
    } else {
        console.error("Speech Synthesis not supported");
        if (onEnd) onEnd();
    }
};

export const stopAudio = () => {
    if (AppConfig.AUDIO_SOURCE === 'backend') {
        invoke('stop_audio_backend').catch(err => console.error("Failed to stop backend audio:", err));
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

export const playSoundEffect = (type: 'correct' | 'wrong' | 'win' | 'lose') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
        case 'correct':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'wrong':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'win':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(600, now + 0.1);
            osc.frequency.setValueAtTime(800, now + 0.2);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
            break;
        case 'lose':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.5);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
    }
};
