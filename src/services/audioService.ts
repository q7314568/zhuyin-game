import { invoke } from '@tauri-apps/api/core';
import { AppConfig } from '../config';

// 播放注音符號音效
export const playZhuyin = async (symbol: string, onEnd?: () => void) => {
    if (AppConfig.AUDIO_SOURCE === 'backend') {
        try {
            // 呼叫後端播放音效，並取得音效長度
            const duration = await invoke<number>('play_audio', { symbol });
            // 使用後端回傳的長度來觸發 onEnd 回調
            if (onEnd) setTimeout(onEnd, duration);
        } catch (error) {
            console.error("Failed to play backend audio:", error);
            // 如果後端失敗，降級使用前端語音合成
            console.log("Falling back to frontend audio");
            playFrontendAudio(symbol, onEnd);
        }
    } else {
        playFrontendAudio(symbol, onEnd);
    }
};

// 使用瀏覽器內建語音合成播放 (前端備案)
const playFrontendAudio = (symbol: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(symbol);
        utterance.lang = 'zh-TW';
        utterance.rate = 0.8; // 稍微放慢語速以求清晰
        if (onEnd) {
            utterance.onend = onEnd;
        }
        window.speechSynthesis.speak(utterance);
    } else {
        console.error("Speech Synthesis not supported");
        if (onEnd) onEnd();
    }
};

// 停止所有音效
export const stopAudio = () => {
    if (AppConfig.AUDIO_SOURCE === 'backend') {
        invoke('stop_audio_backend').catch(err => console.error("Failed to stop backend audio:", err));
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

// 播放遊戲音效 (正確、錯誤、勝利、失敗、射擊)
export const playSoundEffect = (type: 'correct' | 'wrong' | 'win' | 'lose' | 'shoot') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
        case 'correct': // 正確音效：高頻正弦波上揚
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'wrong': // 錯誤音效：低頻鋸齒波下降
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'win': // 勝利音效：三連音
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
        case 'lose': // 失敗音效：悲傷的下降音
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.5);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
        case 'shoot': // 射擊音效：白噪音爆發
            // 產生白噪音
            const bufferSize = ctx.sampleRate * 0.5; // 0.5 秒
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            // 低通濾波器模擬大砲聲
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

            noise.connect(filter);
            filter.connect(gain);

            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            noise.start(now);
            noise.stop(now + 0.3);
            break;
    }
};

// 上傳自定義音檔到後端
export const uploadAudio = async (symbol: string, filePath: string) => {
    await invoke('upload_audio', { symbol, filePath: filePath });
};

// 重置所有音檔為預設
export const resetAllAudio = async () => {
    await invoke('reset_all_audio');
};
