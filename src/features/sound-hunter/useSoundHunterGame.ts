import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { ZHUYIN_SYMBOLS, getSymbolColor } from '../../utils/zhuyin';
import { getConfusingSymbols } from '../../utils/confusion';
import { playZhuyin, playSoundEffect } from '../../services/audioService';

interface GameState {
    score: number;
    combo: number;
    targetSymbol: string | null;
    showHint: boolean;
    isCannonJammed: boolean;
    ammoType: 'cannon' | 'air';
}

interface UseSoundHunterGameProps {
    onBack: () => void;
}

export const useSoundHunterGame = ({ onBack }: UseSoundHunterGameProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);

    // React State for UI
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [targetSymbol, setTargetSymbol] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [isCannonJammed, setIsCannonJammed] = useState(false);
    const [ammoType, setAmmoType] = useState<'cannon' | 'air'>('cannon');

    // Game Logic State (Refs for performance/closure access)
    const gameStateRef = useRef({
        target: null as string | null,
        isJammed: false,
        score: 0,
        combo: 0,
        ammoType: 'cannon' as 'cannon' | 'air'
    });

    // Audio Helpers
    const speakPhrase = useCallback((text: string, onEnd?: () => void) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-TW';
            utterance.rate = 0.9;
            if (onEnd) utterance.onend = onEnd;
            window.speechSynthesis.speak(utterance);
        } else {
            if (onEnd) onEnd();
        }
    }, []);

    const playPrompt = useCallback(async (symbol: string) => {
        speakPhrase("請找出", async () => {
            await playZhuyin(symbol);
        });
    }, [speakPhrase]);

    const playCorrection = useCallback(async (wrongSymbol: string) => {
        speakPhrase("這是", async () => {
            await playZhuyin(wrongSymbol, () => {
                setTimeout(() => {
                    speakPhrase("喔");
                }, 500);
            });
        });
    }, [speakPhrase]);

    const handleReplayAudio = useCallback(() => {
        if (targetSymbol) {
            playPrompt(targetSymbol);
        }
    }, [targetSymbol, playPrompt]);

    // Initialize Game
    useEffect(() => {
        if (!containerRef.current) return;

        // Entities
        const bullets: { graphics: PIXI.Graphics; velocity: { x: number; y: number }; type: 'cannon' | 'air' }[] = [];
        const targets: {
            graphics: PIXI.Container;
            symbol: string;
            vx: number;
            vy: number;
            impulseX: number;
            impulseY: number;
            textObj: PIXI.Text;
            faceState: 'normal' | 'surprised' | 'dizzy';
            faceTimer: number;
            drawFace: (state: 'normal' | 'surprised' | 'dizzy', blink?: boolean) => void;
            color: number;
        }[] = [];
        const keysPressed: { [key: string]: boolean } = {};

        const initApp = async () => {
            const app = new PIXI.Application();
            await app.init({
                width: 800,
                height: 600,
                backgroundColor: 0x1a1a2e
            });

            if (containerRef.current) {
                containerRef.current.appendChild(app.canvas);
            }
            appRef.current = app;

            // --- Graphics Setup ---
            const base = new PIXI.Graphics();
            base.roundRect(-40, -40, 80, 60, 10);
            base.fill(0x8B4513);
            base.circle(0, 0, 15);
            base.fill(0x555555);
            base.x = app.screen.width / 2;
            base.y = app.screen.height - 40;
            app.stage.addChild(base);

            const barrel = new PIXI.Graphics();
            barrel.rect(-20, -15, 100, 30);
            barrel.fill(0x708090);
            barrel.rect(70, -18, 10, 36);
            barrel.fill(0x2F4F4F);
            barrel.x = base.x;
            barrel.y = base.y - 10;
            barrel.rotation = -Math.PI / 2;
            app.stage.addChild(barrel);

            // --- Actions ---
            const shoot = () => {
                if (gameStateRef.current.isJammed) return;

                const bullet = new PIXI.Graphics();
                const type = gameStateRef.current.ammoType;

                if (type === 'cannon') {
                    bullet.circle(0, 0, 10);
                    bullet.fill(0xFFFF00);
                } else {
                    bullet.circle(0, 0, 12);
                    bullet.fill(0xE0FFFF);
                    bullet.stroke({ width: 2, color: 0xFFFFFF });
                    bullet.alpha = 0.8;
                }

                const barrelLength = 80;
                bullet.x = barrel.x + Math.cos(barrel.rotation) * barrelLength;
                bullet.y = barrel.y + Math.sin(barrel.rotation) * barrelLength;

                const speed = 12;
                const velocity = {
                    x: Math.cos(barrel.rotation) * speed,
                    y: Math.sin(barrel.rotation) * speed
                };

                app.stage.addChild(bullet);
                bullets.push({ graphics: bullet, velocity, type });

                playSoundEffect('shoot');
            };

            // --- Effects ---
            const createExplosion = (x: number, y: number, color: number) => {
                const particles: { graphics: PIXI.Graphics; vx: number; vy: number; life: number; rot: number }[] = [];
                const particleCount = 30;

                for (let i = 0; i < particleCount; i++) {
                    const p = new PIXI.Graphics();
                    const isStar = Math.random() > 0.3;
                    if (isStar) {
                        p.star(0, 0, 5, 12, 6);
                    } else {
                        p.rect(0, 0, 8, 8);
                    }

                    p.fill(color);
                    p.x = x;
                    p.y = y;
                    p.rotation = Math.random() * Math.PI * 2;

                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 8 + 3;

                    app.stage.addChild(p);
                    particles.push({
                        graphics: p,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1.0,
                        rot: (Math.random() - 0.5) * 0.2
                    });
                }

                const animateParticles = () => {
                    for (let i = particles.length - 1; i >= 0; i--) {
                        const p = particles[i];
                        p.graphics.x += p.vx;
                        p.graphics.y += p.vy;
                        p.graphics.rotation += p.rot;
                        p.life -= 0.02;
                        p.graphics.alpha = p.life;
                        p.graphics.scale.set(p.life);

                        if (p.life <= 0) {
                            app.stage.removeChild(p.graphics);
                            particles.splice(i, 1);
                        }
                    }
                    if (particles.length > 0) requestAnimationFrame(animateParticles);
                };
                animateParticles();
            };

            const createDizzyEffect = (x: number, y: number) => {
                const container = new PIXI.Container();
                container.x = x;
                container.y = y - 50;
                app.stage.addChild(container);

                const spirals: PIXI.Graphics[] = [];
                for (let i = 0; i < 3; i++) {
                    const s = new PIXI.Graphics();
                    s.arc(0, 0, 15, 0, Math.PI * 1.5);
                    s.stroke({ width: 3, color: 0xFFFFFF });
                    s.x = (i - 1) * 20;
                    container.addChild(s);
                    spirals.push(s);
                }

                let life = 1.0;
                const animate = () => {
                    life -= 0.02;
                    container.y -= 1;
                    container.alpha = life;
                    spirals.forEach((s, i) => {
                        s.rotation += 0.1 * (i % 2 === 0 ? 1 : -1);
                    });

                    if (life <= 0) {
                        app.stage.removeChild(container);
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            };

            const shakeObject = (obj: PIXI.Container) => {
                const originalX = obj.x;
                const originalScaleX = obj.scale.x;
                const originalScaleY = obj.scale.y;
                let startTime = Date.now();
                const duration = 500;

                const animateShake = () => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    if (elapsed < duration) {
                        const offset = Math.sin(elapsed * 0.1) * 5;
                        obj.x = originalX + offset;
                        const scaleOffset = Math.sin(elapsed * 0.05) * 0.1;
                        obj.scale.set(originalScaleX + scaleOffset, originalScaleY - scaleOffset);
                        requestAnimationFrame(animateShake);
                    } else {
                        obj.x = originalX;
                        obj.scale.set(originalScaleX, originalScaleY);
                    }
                };
                animateShake();
            };

            const createShockwave = (x: number, y: number) => {
                const wave = new PIXI.Graphics();
                wave.circle(0, 0, 10);
                wave.stroke({ width: 5, color: 0xFFFFFF });
                wave.alpha = 0.8;
                wave.x = x;
                wave.y = y;
                app.stage.addChild(wave);

                let scale = 1;
                const animateWave = () => {
                    scale += 0.2;
                    wave.scale.set(scale);
                    wave.alpha -= 0.05;
                    if (wave.alpha <= 0) {
                        app.stage.removeChild(wave);
                    } else {
                        requestAnimationFrame(animateWave);
                    }
                };
                animateWave();
            };

            // --- Game Logic ---
            const clearTargets = () => {
                for (const t of targets) {
                    app.stage.removeChild(t.graphics);
                }
                targets.length = 0;
            };

            const spawnRound = (target: string) => {
                console.log(`[Spawn] Spawning round for target: ${target}`);
                try {
                    clearTargets();
                    const confusing = getConfusingSymbols(target, 2);
                    console.log(`[Spawn] Confusing symbols: ${confusing.join(', ')}`);

                    const randoms: string[] = [];
                    while (randoms.length < 3) {
                        const r = ZHUYIN_SYMBOLS[Math.floor(Math.random() * ZHUYIN_SYMBOLS.length)];
                        if (r !== target && !confusing.includes(r) && !randoms.includes(r)) {
                            randoms.push(r);
                        }
                    }
                    console.log(`[Spawn] Random symbols: ${randoms.join(', ')}`);

                    // Distractors list
                    const distractors = [...confusing, ...randoms];
                    // Shuffle distractors
                    for (let i = distractors.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
                    }

                    const spawnedPositions: { x: number, y: number }[] = [];

                    // Helper to create balloon
                    const createBalloon = (symbol: string, x: number, y: number) => {
                        try {
                            const container = new PIXI.Container();
                            const color = getSymbolColor(symbol);

                            // Balloon Body
                            const gfx = new PIXI.Graphics();
                            gfx.ellipse(0, -10, 40, 50);
                            gfx.fill(color);
                            gfx.stroke({ width: 2, color: 0xFFFFFF });
                            gfx.moveTo(0, 40);
                            gfx.lineTo(0, 60);
                            gfx.stroke({ width: 1, color: 0xDDDDDD });
                            container.addChild(gfx);

                            // Face Container
                            const face = new PIXI.Container();
                            face.y = -15;
                            container.addChild(face);

                            const leftEye = new PIXI.Graphics();
                            const rightEye = new PIXI.Graphics();
                            const mouth = new PIXI.Graphics();
                            face.addChild(leftEye);
                            face.addChild(rightEye);
                            face.addChild(mouth);

                            const drawFace = (state: 'normal' | 'surprised' | 'dizzy', blink: boolean = false) => {
                                leftEye.clear();
                                rightEye.clear();
                                mouth.clear();
                                const eyeColor = 0x333333;

                                if (state === 'normal') {
                                    if (blink) {
                                        leftEye.moveTo(-15, 0).lineTo(-5, 0).stroke({ width: 3, color: eyeColor });
                                        rightEye.moveTo(5, 0).lineTo(15, 0).stroke({ width: 3, color: eyeColor });
                                    } else {
                                        leftEye.circle(-10, 0, 4).fill(eyeColor);
                                        rightEye.circle(10, 0, 4).fill(eyeColor);
                                    }
                                    mouth.arc(0, 5, 8, 0.2, Math.PI - 0.2).stroke({ width: 3, color: eyeColor });
                                } else if (state === 'surprised') {
                                    leftEye.circle(-10, 0, 6).stroke({ width: 2, color: eyeColor }).fill(0xFFFFFF);
                                    rightEye.circle(10, 0, 6).stroke({ width: 2, color: eyeColor }).fill(0xFFFFFF);
                                    leftEye.circle(-10, 0, 2).fill(eyeColor);
                                    rightEye.circle(10, 0, 2).fill(eyeColor);
                                    mouth.circle(0, 10, 6).stroke({ width: 3, color: eyeColor });
                                } else if (state === 'dizzy') {
                                    leftEye.moveTo(-14, -4).lineTo(-6, 4).moveTo(-6, -4).lineTo(-14, 4).stroke({ width: 3, color: eyeColor });
                                    rightEye.moveTo(6, -4).lineTo(14, 4).moveTo(14, -4).lineTo(6, 4).stroke({ width: 3, color: eyeColor });
                                    mouth.moveTo(-10, 10).bezierCurveTo(-5, 5, 5, 15, 10, 10).stroke({ width: 3, color: eyeColor });
                                }
                            };

                            drawFace('normal');

                            const text = new PIXI.Text({
                                text: symbol,
                                style: {
                                    fontFamily: '"KaiTi", "DFKai-SB", "Bopomofo Ruby", serif',
                                    fontSize: 40,
                                    fontWeight: 'bold',
                                    fill: 0xFFFFFF,
                                    align: 'center',
                                    stroke: { color: 0x000000, width: 4, join: 'round' }
                                }
                            });
                            text.anchor.set(0.5);
                            text.y = 20;
                            container.addChild(text);

                            container.x = x;
                            container.y = y;
                            app.stage.addChild(container);

                            targets.push({
                                graphics: container,
                                symbol: symbol,
                                vx: (Math.random() - 0.5) * 2,
                                vy: (Math.random() - 0.5) * 1,
                                impulseX: 0,
                                impulseY: 0,
                                textObj: text,
                                faceState: 'normal',
                                faceTimer: Math.random() * 200,
                                drawFace,
                                color
                            });
                            console.log(`[Spawn] Created balloon: ${symbol} at (${x}, ${y})`);
                        } catch (err) {
                            console.error(`[Spawn] Failed to create balloon for ${symbol}:`, err);
                        }
                    };

                    // Helper to find position
                    const findPosition = (existingPositions: { x: number, y: number }[]): { x: number, y: number } | null => {
                        let x = 0, y = 0, valid = false, attempts = 0;
                        while (!valid && attempts < 100) {
                            x = Math.random() * (app.screen.width - 100) + 50;
                            y = Math.random() * (app.screen.height * 0.35) + 50;
                            valid = true;
                            for (const pos of existingPositions) {
                                const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                                if (dist < 110) { valid = false; break; }
                            }
                            attempts++;
                        }
                        if (!valid) {
                            attempts = 0;
                            while (!valid && attempts < 50) {
                                x = Math.random() * (app.screen.width - 100) + 50;
                                y = Math.random() * (app.screen.height * 0.35) + 50;
                                valid = true;
                                for (const pos of existingPositions) {
                                    const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                                    if (dist < 80) { valid = false; break; }
                                }
                                attempts++;
                            }
                        }
                        return valid ? { x, y } : null;
                    };

                    // 1. Calculate Target Position FIRST
                    const targetPos = findPosition(spawnedPositions);
                    if (targetPos) {
                        spawnedPositions.push(targetPos);
                        console.log(`[Spawn] Target position found: (${targetPos.x}, ${targetPos.y})`);
                    } else {
                        const fallbackPos = { x: app.screen.width / 2, y: 100 };
                        spawnedPositions.push(fallbackPos);
                        console.warn(`[Spawn] Target position fallback used: (${fallbackPos.x}, ${fallbackPos.y})`);
                    }

                    // 2. Calculate Distractor Positions
                    const validDistractors: { symbol: string, x: number, y: number }[] = [];
                    for (const d of distractors) {
                        const pos = findPosition(spawnedPositions);
                        if (pos) {
                            spawnedPositions.push(pos);
                            validDistractors.push({ symbol: d, ...pos });
                        }
                    }

                    // 3. Render Distractors FIRST
                    validDistractors.forEach(d => createBalloon(d.symbol, d.x, d.y));

                    // 4. Render Target LAST
                    if (spawnedPositions.length > 0) {
                        console.log(`[Spawn] Rendering target: ${target}`);
                        createBalloon(target, spawnedPositions[0].x, spawnedPositions[0].y);
                    } else {
                        console.error("[Spawn] CRITICAL: Spawned positions empty, target NOT rendered!");
                    }
                } catch (e) {
                    console.error("[Spawn] Error in spawnRound:", e);
                }
            };

            const startNewRound = () => {
                const newTarget = ZHUYIN_SYMBOLS[Math.floor(Math.random() * ZHUYIN_SYMBOLS.length)];
                gameStateRef.current.target = newTarget;
                setTargetSymbol(newTarget);
                setShowHint(true);
                setTimeout(() => setShowHint(false), 1500);
                playPrompt(newTarget);
                spawnRound(newTarget);
            };

            startNewRound();

            // --- Input Listeners ---
            const handleKeyDown = (e: KeyboardEvent) => {
                keysPressed[e.code] = true;
                if (e.code === 'Space') shoot();
                if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                    const newType = gameStateRef.current.ammoType === 'cannon' ? 'air' : 'cannon';
                    gameStateRef.current.ammoType = newType;
                    setAmmoType(newType);
                }
            };
            const handleKeyUp = (e: KeyboardEvent) => keysPressed[e.code] = false;
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);

            // --- Game Loop ---
            app.ticker.add(() => {
                // Barrel Rotation
                const rotationSpeed = 0.02;
                if (keysPressed['ArrowLeft']) barrel.rotation -= rotationSpeed;
                if (keysPressed['ArrowRight']) barrel.rotation += rotationSpeed;
                if (barrel.rotation < -Math.PI) barrel.rotation = -Math.PI;
                if (barrel.rotation > 0) barrel.rotation = 0;

                // Update Bullets
                for (let i = bullets.length - 1; i >= 0; i--) {
                    const b = bullets[i];
                    b.graphics.x += b.velocity.x;
                    b.graphics.y += b.velocity.y;
                    if (b.graphics.x < 0 || b.graphics.x > app.screen.width || b.graphics.y < 0 || b.graphics.y > app.screen.height) {
                        app.stage.removeChild(b.graphics);
                        bullets.splice(i, 1);
                    }
                }

                // Update Targets (Physics & Faces)
                for (let i = targets.length - 1; i >= 0; i--) {
                    const t = targets[i];

                    // Face Animation
                    t.faceTimer++;
                    if (t.faceState === 'normal') {
                        if (t.faceTimer > 200) { // Blink every ~3-4 seconds
                            t.drawFace('normal', true); // Blink
                            if (t.faceTimer > 210) {
                                t.faceTimer = 0;
                                t.drawFace('normal', false); // Open
                            }
                        }
                    } else if (t.faceState === 'surprised' || t.faceState === 'dizzy') {
                        if (t.faceTimer > 120) { // Return to normal after 2 seconds
                            t.faceState = 'normal';
                            t.faceTimer = 0;
                            t.drawFace('normal');
                        }
                    }

                    // Apply Velocity + Impulse
                    t.graphics.x += t.vx + t.impulseX;
                    t.graphics.y += t.vy + t.impulseY;

                    // Impulse Decay
                    t.impulseX *= 0.95;
                    t.impulseY *= 0.95;
                    if (Math.abs(t.impulseX) < 0.1) t.impulseX = 0;
                    if (Math.abs(t.impulseY) < 0.1) t.impulseY = 0;

                    // Boundary Bounce
                    if (t.graphics.x < 40 || t.graphics.x > app.screen.width - 40) {
                        t.vx *= -1;
                        t.impulseX *= -0.5;
                        t.graphics.x = Math.max(40, Math.min(t.graphics.x, app.screen.width - 40));
                    }
                    if (t.graphics.y < 40 || t.graphics.y > app.screen.height * 0.45) {
                        t.vy *= -1;
                        t.impulseY *= -0.5;
                        t.graphics.y = Math.max(40, Math.min(t.graphics.y, app.screen.height * 0.45));
                    }

                    // Collision Detection
                    for (let j = bullets.length - 1; j >= 0; j--) {
                        const b = bullets[j];
                        const dx = b.graphics.x - t.graphics.x;
                        const dy = b.graphics.y - (t.graphics.y - 10);
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < 45) {
                            app.stage.removeChild(b.graphics);
                            bullets.splice(j, 1);

                            if (b.type === 'air') {
                                createShockwave(b.graphics.x, b.graphics.y);
                                playSoundEffect('shoot');

                                // AOE Push
                                targets.forEach(target => {
                                    const tdx = target.graphics.x - b.graphics.x;
                                    const tdy = target.graphics.y - b.graphics.y;
                                    const dist = Math.sqrt(tdx * tdx + tdy * tdy);

                                    if (dist < 250) {
                                        const force = (250 - dist) / 25;
                                        const angle = Math.atan2(tdy, tdx);
                                        target.impulseX += Math.cos(angle) * force;
                                        target.impulseY += Math.sin(angle) * force;

                                        // Set Surprised Face
                                        if (target.faceState !== 'dizzy') {
                                            target.faceState = 'surprised';
                                            target.faceTimer = 0;
                                            target.drawFace('surprised');
                                        }
                                    }
                                });
                            } else {
                                // Cannon Logic
                                if (t.symbol === gameStateRef.current.target) {
                                    playSoundEffect('correct');
                                    createExplosion(t.graphics.x, t.graphics.y, t.color);
                                    app.stage.removeChild(t.graphics);
                                    targets.splice(i, 1);
                                    gameStateRef.current.score += 10 + (gameStateRef.current.combo * 2);
                                    gameStateRef.current.combo += 1;
                                    setScore(gameStateRef.current.score);
                                    setCombo(gameStateRef.current.combo);
                                    setTimeout(startNewRound, 1000);
                                } else {
                                    playSoundEffect('wrong');
                                    shakeObject(t.graphics);
                                    createDizzyEffect(t.graphics.x, t.graphics.y);

                                    // Set Dizzy Face
                                    t.faceState = 'dizzy';
                                    t.faceTimer = 0;
                                    t.drawFace('dizzy');

                                    const angle = Math.atan2(dy, dx);
                                    t.impulseX += -Math.cos(angle) * 10;
                                    t.impulseY += -Math.sin(angle) * 10;

                                    setIsCannonJammed(true);
                                    gameStateRef.current.isJammed = true;
                                    setTimeout(() => {
                                        setIsCannonJammed(false);
                                        gameStateRef.current.isJammed = false;
                                    }, 1000);
                                    gameStateRef.current.combo = 0;
                                    setCombo(0);
                                    playCorrection(t.symbol);
                                }
                            }
                            break;
                        }
                    }
                }
            });

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                app.destroy(true, { children: true, texture: true });
            };
        };

        const cleanupPromise = initApp();
        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, []);

    return {
        containerRef,
        score,
        combo,
        targetSymbol,
        showHint,
        isCannonJammed,
        ammoType,
        handleReplayAudio
    };
};
