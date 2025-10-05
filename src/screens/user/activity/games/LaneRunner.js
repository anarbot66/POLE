// src/myteam/runner/LaneRunnerGame.jsx
import React, { useRef, useEffect, useState } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../../firebase';
import Modal from '../../../components/Modal';
import GameRulesModal from './components/GameRulesModal';
import MobileControls from './components/MobileControls';
import './graphic/FormulaRunnerAssets/runner.css';
import gameOverUrl from './graphic/FormulaRunnerAssets/gameover.png';
import BackButton from '../../../components/BackButton';

// Asset URLs
import coneUrl from './graphic/FormulaRunnerAssets/cone.png';
import crashedCarUrl from './graphic/FormulaRunnerAssets/crashedcar.png';
import fireUrl from './graphic/FormulaRunnerAssets/fire.png';
import puddleUrl from './graphic/FormulaRunnerAssets/puddle.png';
import playerUrl from './graphic/FormulaRunnerAssets/player.png';
import trackUrl from './graphic/FormulaRunnerAssets/track2.png';
import apIconUrl from '../../../recources/images/logo.png';
import shieldUrl from './graphic/FormulaRunnerAssets/shield.png';
import bonusModeUrl from './graphic/FormulaRunnerAssets/bonusMode.png';

// === NEW: fixed canvas size (no virtual coords) ===
const CANVAS_WIDTH  = 400;
const CANVAS_HEIGHT = 500;

// Entity sizes tuned for 400x400
const CAR_WIDTH     = 48;
const CAR_HEIGHT    = 36;
const OBSTACLE_SIZE = 32;
const SPAWN_CELLS   = 10;

// spawn region (centered horizontally)
const SPAWN_REGION_WIDTH = 240;
const SPAWN_REGION_X     = (CANVAS_WIDTH - SPAWN_REGION_WIDTH) / 2;

const COST_AP = 0;
const COST_GS = 0;
const scrollSpeed = 4.6; // tuned for 400px height
const debugMode = true;

// Hitboxes tuned for new sizes
const OBSTACLE_HITBOXES = {
  cone:       { offsetX: 6,  offsetY: 6,  width: 20, height: 18 },
  crashedcar: { offsetX: 4,  offsetY: 6,  width: 28, height: 18 },
  fire:       { offsetX: 10, offsetY: 6,  width: 12, height: 20 },
  puddle:     { offsetX: 6,  offsetY: 8,  width: 22, height: 14 },
};

const PLAYER_HITBOX = {
  offsetX: 12,
  offsetY: 6,
  width: CAR_WIDTH - 24,
  height: CAR_HEIGHT - 12,
};

// SVG for GS icon (unchanged)
const GS_SVG_TEXT = `<svg width="16" height="15" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">... (same as before) ...</svg>`;

const OBSTACLE_ASSETS = [
  { key: 'cone', url: coneUrl },
  { key: 'crashedcar', url: crashedCarUrl },
  { key: 'fire', url: fireUrl },
  { key: 'puddle', url: puddleUrl },
];

export default function LaneRunnerGame({ currentUser }) {
  // refs
  const canvasRef = useRef(null);
  const imagesRef = useRef({});
  const carXRef    = useRef((CANVAS_WIDTH - CAR_WIDTH)/2);
  const carYRef    = useRef(CANVAS_HEIGHT - CAR_HEIGHT - 8);

  // display size (now fixed)
  const [displaySize, setDisplaySize] = useState({ w: CANVAS_WIDTH, h: CANVAS_HEIGHT, scale: 1 });

  // game state
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [collectedGS,   setCollectedGS] = useState(0);
  const [collectedAP,   setCollectedAP] = useState(0);
  const [record,        setRecord] = useState(currentUser?.bestRunner || 0);
  const [usedAttempts,  setUsedAttempts] = useState(0);
  const [showModal,     setShowModal] = useState(false);
  const [modalMessage,  setModalMessage] = useState('');
  const [showRules,     setShowRules] = useState(false);

  const [showBlink, setShowBlink]   = useState(false);
  const [showStats, setShowStats]   = useState(false);

  // bonus states
  const [shieldActive,    setShieldActive] = useState(false);
  const [bonusModeActive, setBonusModeActive] = useState(false);

  // background scroll
  const [bgY1, setBgY1] = useState(0);
  const [bgY2, setBgY2] = useState(-CANVAS_HEIGHT);

  // car movement
  const [carX,  setCarX]  = useState(carXRef.current);
  const [carY,  setCarY]  = useState(carYRef.current);
  const [carV,  setCarV]  = useState(0);
  const [carVy, setCarVy] = useState(0);

  // objects & spawn
  const [objects,   setObjects]   = useState([]);
  const [spawnRate, setSpawnRate] = useState(800);

  // pause
  const [isPaused, setIsPaused] = useState(false);

  // sync refs
  useEffect(() => { carXRef.current = carX; }, [carX]);
  useEffect(() => { carYRef.current = carY; }, [carY]);

  // preload images
  useEffect(() => {
    const assets = [
      { key: 'track',        url: trackUrl },
      { key: 'player',       url: playerUrl },
      ...OBSTACLE_ASSETS,
      { key: 'gsIcon',       dataUri: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(GS_SVG_TEXT), size:24 },
      { key: 'apIcon',       url: apIconUrl, size:24 },
      { key: 'shieldIcon',   url: shieldUrl, size:32 },
      { key: 'bonusModeIcon',url: bonusModeUrl, size:32 },
    ];
    Promise.all(assets.map(({key,url,dataUri}) => new Promise(res=>{
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url || dataUri;
      img.onload = () => {
        imagesRef.current[key] = img;
        res();
      };
      img.onerror = () => res();
    })));
  }, []);

  // load today's attempts
  useEffect(() => {
    if (!currentUser?.runnerAttemptsDate) return;
    const today = new Date().toISOString().slice(0,10);
    setUsedAttempts(
      currentUser.runnerAttemptsDate === today
        ? currentUser.runnerAttempts
        : 0
    );
    setRecord(currentUser?.bestRunner || 0);
  }, [currentUser]);

  // start game
  const startGame = async () => {
    if (currentUser.apexPoints < COST_AP || currentUser.gsCurrency < COST_GS) {
      setModalMessage('Недостаточно ресурсов.');
      return setShowModal(true);
    }
    const userDoc = doc(db,'users',currentUser.uid);
    const todayStr = new Date().toISOString().slice(0,10);
    // списываем попытку
    if (currentUser.runnerAttemptsDate !== todayStr) {
      await updateDoc(userDoc, {
        apexPoints:    increment(-COST_AP),
        gsCurrency:    increment(-COST_GS),
        runnerAttempts:      1,
        runnerAttemptsDate: todayStr
      });
      setUsedAttempts(1);
    } else {
      await updateDoc(userDoc, {
        apexPoints:    increment(-COST_AP),
        gsCurrency:    increment(-COST_GS),
        runnerAttempts: increment(1)
      });
      setUsedAttempts(u=>u+1);
    }
    // сбрасываем всё
    setScore(0);
    setCollectedGS(0);
    setCollectedAP(0);
    setObjects([]);
    setCarX((CANVAS_WIDTH-CAR_WIDTH)/2);
    setCarY(CANVAS_HEIGHT-CAR_HEIGHT-8);
    setSpawnRate(800);
    setShieldActive(false);
    setBonusModeActive(false);
    setIsPaused(false);
    setShowBlink(false);
    setShowStats(false);
    setGameState('running');
  };

  // ---------- resize & DPR scaling: canvas фиксирован 400x400, поддерживаем DPR для чёткости ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;

      // CSS display size fixed
      canvas.style.width  = CANVAS_WIDTH + 'px';
      canvas.style.height = CANVAS_HEIGHT + 'px';
      canvas.style.display = 'block';

      // internal buffer scaled by DPR
      canvas.width  = Math.round(CANVAS_WIDTH * dpr);
      canvas.height = Math.round(CANVAS_HEIGHT * dpr);

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      setDisplaySize({ w: CANVAS_WIDTH, h: CANVAS_HEIGHT, scale: 1 });
    }

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  // spawn logic (stops when paused)
  useEffect(() => {
    if (gameState !== 'running' || isPaused) return;
    const id = setInterval(() => {
      setObjects(prev => {
        const regionCellW = SPAWN_REGION_WIDTH / SPAWN_CELLS;
        const occupied   = new Set(prev.map(o => Math.floor((o.x - SPAWN_REGION_X) / regionCellW)));
        const free       = Array.from({ length: SPAWN_CELLS }, (_, i) => i).filter(i => !occupied.has(i));
        const count      = spawnRate <= 500 ? 2 : 1;
        const next       = [];

        for (let k = 0; k < count && free.length; k++) {
          const idx  = Math.floor(Math.random() * free.length);
          const cell = free.splice(idx, 1)[0];
          const x    = SPAWN_REGION_X + cell * regionCellW + (regionCellW - OBSTACLE_SIZE) / 2;
          const y    = -OBSTACLE_SIZE;

          if (bonusModeActive) {
            const p = Math.random();
            if (p < 0.01) {
              const rare = Math.random();
              if (rare < 0.25) {
                if (!shieldActive) next.push({ kind: 'bonus', bonusType: 'shield', x, y });
              }
              else if (rare < 0.5)  next.push({ kind: 'bonus', bonusType: 'bonusMode', x, y });
              else if (rare < 0.75) next.push({ kind: 'bonus', bonusType: 'bigGS', x, y });
              else                  next.push({ kind: 'bonus', bonusType: 'bigAP', x, y });
            } else {
              next.push({ kind: 'bonus', bonusType: Math.random() < 0.5 ? 'gs' : 'ap', x, y });
            }
          } else {
            const rnd = Math.random();
            if (rnd < 0.01) {
              if (rnd < 0.005) {
                if (!shieldActive) next.push({ kind: 'bonus', bonusType: 'shield', x, y });
              }
              else if (rnd < 0.01)  next.push({ kind: 'bonus', bonusType: 'bonusMode', x, y });
              else if (rnd < 0.015) next.push({ kind: 'bonus', bonusType: 'bigGS', x, y });
              else                   next.push({ kind: 'bonus', bonusType: 'bigAP', x, y });
            }
            else if (rnd < 0.17) {
              next.push({ kind: 'bonus', bonusType: Math.random() < 0.5 ? 'gs' : 'ap', x, y });
            }
            else {
              const asset = OBSTACLE_ASSETS[Math.floor(Math.random() * OBSTACLE_ASSETS.length)];
              next.push({ kind: 'obs', spriteKey: asset.key, x, y });
            }
          }
        }

        return [...prev, ...next];
      });
    }, spawnRate);

    return () => clearInterval(id);
  }, [gameState, spawnRate, bonusModeActive, shieldActive, isPaused]);

  // main loop: движение, столкновения, счёт (при паузе не обновляем позицию/объекты/счёт)
  useEffect(() => {
    if (gameState !== 'running') return;
    let last = performance.now(), raf;
    const baseSpeed = 0.18, speedMult = 1.6;

    function animate(now){
      const delta = now - last; last = now;

      if (isPaused) {
        raf = requestAnimationFrame(animate);
        return;
      }

      const dy = scrollSpeed * (delta/16);
      let y1 = bgY1+dy, y2 = bgY2+dy;
      if (y1 >= CANVAS_HEIGHT) y1 = y2 - CANVAS_HEIGHT;
      if (y2 >= CANVAS_HEIGHT) y2 = y1 - CANVAS_HEIGHT;
      setBgY1(y1); setBgY2(y2);

      // движение машины
      setCarX(x=>Math.max(SPAWN_REGION_X, Math.min(SPAWN_REGION_X+SPAWN_REGION_WIDTH-CAR_WIDTH, x + carV*delta/16)));
      setCarY(y=>Math.max(0, Math.min(CANVAS_HEIGHT-CAR_HEIGHT, y + carVy*delta/16)));

      // хитбокс машины (свежие координаты из ref)
      const carRect = {
        x: carXRef.current + PLAYER_HITBOX.offsetX,
        y: carYRef.current + PLAYER_HITBOX.offsetY,
        w: PLAYER_HITBOX.width,
        h: PLAYER_HITBOX.height
      };

      // обновляем объекты
      setObjects(list =>
        list
          .map(o => ({...o, y: o.y + baseSpeed*speedMult*delta}))
          .filter(o => {
            const hb = o.kind==='obs'
              ? OBSTACLE_HITBOXES[o.spriteKey]
              : { offsetX:0, offsetY:0, width:OBSTACLE_SIZE, height:OBSTACLE_SIZE };
            const objRect = {
              x: o.x + hb.offsetX,
              y: o.y + hb.offsetY,
              w: hb.width,
              h: hb.height
            };
            const collided = !(
              carRect.x > objRect.x + objRect.w ||
              carRect.x + carRect.w < objRect.x ||
              carRect.y > objRect.y + objRect.h ||
              carRect.y + carRect.h < objRect.y
            );
            if (collided) {
              if (o.kind==='obs') {
                if (shieldActive) {
                  setShieldActive(false);
                  return false;
                } else {
                  setGameState('over');
                  return false;
                }
              } else {
                switch(o.bonusType){
                  case 'gs':       setCollectedGS(g=>g+1);    break;
                  case 'ap':       setCollectedAP(a=>a+1);    break;
                  case 'shield':   setShieldActive(true);      break;
                  case 'bonusMode':
                    setBonusModeActive(true);
                    setTimeout(()=>setBonusModeActive(false),10000);
                    break;
                  case 'bigGS':    setCollectedGS(g=>g+5);   break;
                  case 'bigAP':    setCollectedAP(a=>a+10);  break;
                }
                return false;
              }
            }
            return o.y < CANVAS_HEIGHT;
          })
      );

      // счёт и ускорение
      setScore(s => {
        const n = s + delta*0.05;
        if (Math.floor(n)%300===0) {
          setSpawnRate(r=>Math.max(300, Math.round(r*0.98)));
        }
        return n;
      });

      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [gameState, carV, carVy, bgY1, bgY2, shieldActive, isPaused]);

  // when game over
  useEffect(() => {
    if (gameState !== 'over') return;
    setShowBlink(true);
    setShowStats(false);
  }, [gameState]);

  // render to canvas (рисуем каждый раз при изменениях важных стейтов)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // clear
    ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

    // фон / трек (растягиваем текстуру на весь canvas)
    const track = imagesRef.current.track;
    if (track) {
      // повторяем фон двигая по Y в диапазоне 0..CANVAS_HEIGHT
      ctx.drawImage(track, 0, bgY1, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(track, 0, bgY2, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    }

    // машина
    const pImg = imagesRef.current.player;
    if (pImg) ctx.drawImage(pImg, carXRef.current, carYRef.current, CAR_WIDTH, CAR_HEIGHT);
    else {
      // fallback rectangle
      ctx.fillStyle = '#0af';
      ctx.fillRect(carXRef.current, carYRef.current, CAR_WIDTH, CAR_HEIGHT);
    }

    // объекты
    objects.forEach(o=>{
      if (o.kind==='obs') {
        const img = imagesRef.current[o.spriteKey];
        if (img) ctx.drawImage(img, o.x, o.y, OBSTACLE_SIZE, OBSTACLE_SIZE);
        else {
          ctx.fillStyle = 'orange';
          ctx.fillRect(o.x, o.y, OBSTACLE_SIZE, OBSTACLE_SIZE);
        }
      } else {
        let key, size, label;
        switch(o.bonusType){
          case 'gs':       key='gsIcon';       size=20; label='+1'; break;
          case 'ap':       key='apIcon';       size=20; label='+10'; break;
          case 'shield':   key='shieldIcon';   size=28; label='';    break;
          case 'bonusMode':key='bonusModeIcon';size=28; label='';    break;
          case 'bigGS':    key='gsIcon';       size=28; label='+50'; break;
          case 'bigAP':    key='apIcon';       size=28; label='+1000'; break;
          default:         key='gsIcon';       size=20; label='';     break;
        }
        const icon = imagesRef.current[key];
        if (icon) ctx.drawImage(icon, o.x, o.y, size, size);
        if (label) {
          ctx.fillStyle='white';
          ctx.font='12px sans-serif';
          ctx.fillText(label, o.x + size/4, o.y + size + 12);
        }
      }
    });

    // HUD (canvas fallback texts)
    ctx.fillStyle = 'white';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 8, 18);
    ctx.fillText(`GS: ${collectedGS}`, 8, 36);
    ctx.fillText(`AP: ${collectedAP}`, 8, 54);
    // Shield/Bonus are shown by DOM icons above canvas
  }, [objects, collectedGS, collectedAP, score, bgY1, bgY2, shieldActive, bonusModeActive]);

  // завершение игры: выдача наград
  useEffect(() => {
    if (gameState !== 'over') return;
    const extra = Math.floor(score/100);
    const totalGS = collectedGS + extra;
    const totalAP = collectedAP*10 + extra*10;
    const userDoc = doc(db,'users',currentUser.uid);
    if (score > record) {
      updateDoc(userDoc, { bestRunner: Math.floor(score) });
    }
    updateDoc(userDoc, { gsCurrency: increment(totalGS), apexPoints: increment(totalAP) });
  }, [gameState]); // eslint-disable-line

  // управление с клавиатуры (стрелки)
  useEffect(() => {
    const down = e => {
      if (gameState !== 'running' || isPaused) return;
      if (e.key === 'ArrowLeft')  setCarV(-5);
      if (e.key === 'ArrowRight') setCarV(5);
      if (e.key === 'ArrowUp')    setCarVy(-5);
      if (e.key === 'ArrowDown')  setCarVy(5);
    };
    const up = e => {
      if (['ArrowLeft','ArrowRight'].includes(e.key)) setCarV(0);
      if (['ArrowUp','ArrowDown'].includes(e.key))    setCarVy(0);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [gameState, isPaused]);

  // Escape toggles pause when running
  useEffect(() => {
    const keyHandler = (e) => {
      if (e.key === 'Escape' && gameState === 'running') {
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [gameState]);

  // ICON vertical placement: немного ниже y=75 (AP) — теперь просто фиксированный offset
  const ICON_OFFSET_PX = 12; // дополнительный отступ от верхней полосы HUD
  const hudTopPx = 36 + ICON_OFFSET_PX; // верхняя HUD-строка ~36px вниз

  return (
    <div style={{ textAlign: 'center', color: 'white', marginBottom: '90px', justifyItems: 'center' }}>
      {gameState === 'start' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: 32, cursor: 'pointer' }} onClick={() => setShowRules(true)}>
              Прямая в Монце
            </h2>
            <button
              onClick={startGame}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                color: 'white',
                border: 'none',
                border: "1px solid rgba(255, 255, 255, 0.2)",
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#111'
              }}
            >
              Играть
            </button>
          </div>
        </div>
      ) : (
        // full-screen container (canvas + controls). pointerEvents selective so overlays are interactive
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          {/* wrapper для canvas и overlay */}
          <div style={{ position: 'relative', width: CANVAS_WIDTH + 'px', height: displaySize.h + 'px', pointerEvents: 'auto'}}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{ width: CANVAS_WIDTH + 'px', height: displaySize.h + 'px', display: 'block' }}
            />

            {/* Icon HUD (левый верхний угол) */}
            <div
              style={{
                position: 'absolute',
                left: 8,
                top: hudTopPx,
                zIndex: 48,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'flex-start',
                pointerEvents: 'none',
              }}
            >
              {/* Shield icon */}
              {shieldActive && imagesRef.current.shieldIcon && (
                <div className="hud-icon" style={{ display: 'flex', gap: 8, pointerEvents: 'auto', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <img
                    src={imagesRef.current.shieldIcon.src}
                    alt="Shield active"
                    style={{ width: 34, height: 34, display: 'block' }}
                  />
                </div>
              )}

              {/* BonusMode icon */}
              {bonusModeActive && imagesRef.current.bonusModeIcon && (
                <div className="hud-icon" style={{ display: 'flex', gap: 8, pointerEvents: 'auto', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <img
                    src={imagesRef.current.bonusModeIcon.src}
                    alt="Bonus mode active"
                    style={{ width: 34, height: 34, display: 'block' }}
                  />
                </div>
              )}
            </div>

            {/* Pause button (вверху справа внутри wrapper) */}
            <button
              onClick={() => setIsPaused(p => !p)}
              style={{
                position: 'absolute',
                right: 8,
                top: 8,
                zIndex: 40,
                borderRadius: 10,
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent'
              }}
            >
              {isPaused ? (
                <img src="/assets/runnerButtons/play.png" alt="Resume" style={{ width: 36, height: 36 }} />
              ) : (
                <img src="/assets/runnerButtons/pause.png" alt="Pause" style={{ width: 36, height: 36 }} />
              )}
            </button>

            {/* Overlay: blinking GAME OVER */}
            {gameState === 'over' && showBlink && (
              <div
                className="overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 45,
                  pointerEvents: 'auto'
                }}
              >
                <img
                  src={gameOverUrl}
                  alt="Game Over"
                  className="blink"
                  style={{ width: Math.min(220, displaySize.w * 0.9), height: 'auto' }}
                  onAnimationEnd={() => {
                    setShowBlink(false);
                    setShowStats(true);
                  }}
                />
              </div>
            )}

            {/* Overlay: final stats */}
            {gameState === 'over' && showStats && (
              <div
                className="overlay fade-in gameOverGlass"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  padding: 20,
                  color: 'white',
                  zIndex: 46,
                  pointerEvents: 'auto'
                }}
              >
                <h3>Вы проиграли</h3>
                <p>Очки: {Math.floor(score)}</p>
                <p>GS получено: {collectedGS + Math.floor(score / 100)}</p>
                <p>Apex получено: {collectedAP * 10 + Math.floor(score / 100) * 10}</p>
                <p>Рекорд: {Math.max(record, Math.floor(score))}</p>
                <button onClick={() => {
                      setIsPaused(false);
                      setGameState('start');
                      setObjects([]);
                      setScore(0);
                      setShowBlink(false);
                      setShowStats(false);
                    }} style={{ padding: '8px 12px', borderRadius: 8 }}>Выйти</button>
              </div>
            )}

            {/* Paused menu overlay */}
            {isPaused && gameState === 'running' && (
  <div
    style={{
      position: 'fixed', // фиксируем на весь экран
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      zIndex: 50,
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    {/* затемнение */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.6)', // прозрачный чёрный фон
        zIndex: 61
      }}
    />

    {/* сам блок паузы */}
    <div
      style={{
        position: 'relative', // чтобы быть поверх оверлея
        background: '#222',
        padding: 20,
        borderRadius: 12,
        textAlign: 'center',
        color: 'white',
        minWidth: 220,
        zIndex: 62 // выше оверлея
      }}
    >
      <h3>Пауза</h3>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
        <button onClick={() => setIsPaused(false)} style={{ padding: '8px 12px', borderRadius: 8, minWidth: '130px' }}>Продолжить</button>
        <button onClick={() => {
          setIsPaused(false);
          setGameState('start');
          setObjects([]);
          setScore(0);
          setShowBlink(false);
          setShowStats(false);
        }} style={{ padding: '8px 12px', borderRadius: 8, minWidth: '130px' }}>Выйти</button>
      </div>
    </div>
  </div>
)}

          </div>

          {/* MobileControls — располагаем под canvas, фиксированная ширина = canvas */}
          <div style={{ width: CANVAS_WIDTH + 'px', pointerEvents: 'auto', zIndex: 60, paddingTop: 8 }}>
            <MobileControls
              onPress={dir => {
                if (isPaused || gameState !== 'running') return;
                if (dir === 'left') setCarV(-5);
                if (dir === 'right') setCarV(5);
                if (dir === 'up') setCarVy(-5);
                if (dir === 'down') setCarVy(5);
              }}
              onRelease={dir => {
                if (dir === 'left' || dir === 'right') setCarV(0);
                if (dir === 'up' || dir === 'down') setCarVy(0);
              }}
            />
          </div>
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
      {showRules && <GameRulesModal onClose={() => setShowRules(false)} />}

      {/* Local CSS for HUD icons (вставлено в компонент для простоты) */}
      <style>{`
        .hud-icon {
          pointer-events: auto;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 220ms ease, transform 220ms ease;
          display: inline-flex;
          align-items: center;
        }
        .hud-icon.hidden {
          opacity: 0;
          transform: translateY(-6px);
        }
        .overlay img.blink {
          animation: blink-anim 800ms ease-in-out;
        }
        @keyframes blink-anim {
          0% { transform: scale(0.6); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
