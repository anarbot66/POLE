import React, { useRef, useEffect, useState } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../../firebase';
import Modal from '../../../components/Modal';
import GameRulesModal from './components/GameRulesModal';
import MobileControls from './components/MobileControls';
import './graphic/FormulaRunnerAssets/runner.css';
import gameOverUrl from './graphic/FormulaRunnerAssets/gameover.png';

// Asset URLs
import coneUrl from './graphic/FormulaRunnerAssets/cone.png';
import crashedCarUrl from './graphic/FormulaRunnerAssets/crashedcar.png';
import fireUrl from './graphic/FormulaRunnerAssets/fire.png';
import puddleUrl from './graphic/FormulaRunnerAssets/puddle.png';
import playerUrl from './graphic/FormulaRunnerAssets/player.png';
import trackUrl from './graphic/FormulaRunnerAssets/track2.png';
import apIconUrl from '../../../recources/images/racehub-logo.png';
import shieldUrl from './graphic/FormulaRunnerAssets/shield.png';         
import bonusModeUrl from './graphic/FormulaRunnerAssets/bonusMode.png';   

// Constants
const CANVAS_WIDTH  = 360;
const CANVAS_HEIGHT = 500;
const CAR_WIDTH     = 60;
const CAR_HEIGHT    = 50;
const OBSTACLE_SIZE = 40;
const SPAWN_CELLS   = 10;
const SPAWN_REGION_WIDTH = 200;
const SPAWN_REGION_X     = (CANVAS_WIDTH - SPAWN_REGION_WIDTH) / 2;
const MAX_ATTEMPTS_PER_DAY = 3;
const COST_AP = 0;
const COST_GS = 0;
const scrollSpeed = 4.8;
const debugMode = false;

// SVG for GS icon
const GS_SVG_TEXT = `<svg width="16" height="15" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#paint0_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint1_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint2_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint3_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<defs>
<clipPath id="paint0_diamond_4291_10_clip_path"><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z"/></clipPath><clipPath id="paint1_diamond_4291_10_clip_path"><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z"/></clipPath><clipPath id="paint2_diamond_4291_10_clip_path"><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z"/></clipPath><clipPath id="paint3_diamond_4291_10_clip_path"><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z"/></clipPath><linearGradient id="paint0_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint1_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint2_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint3_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
</defs>
</svg>`;

const OBSTACLE_ASSETS = [
  { key: 'cone', url: coneUrl },
  { key: 'crashedcar', url: crashedCarUrl },
  { key: 'fire', url: fireUrl },
  { key: 'puddle', url: puddleUrl },
];

const OBSTACLE_HITBOXES = {
  cone:       { offsetX: 10,  offsetY: 10, width: 20, height: 20 },
  crashedcar: { offsetX: 6,   offsetY: 10, width: 30, height: 20 },
  fire:       { offsetX: 15,  offsetY: 10, width: 10, height: 20 },
  puddle:     { offsetX: 10,  offsetY: 12, width: 22, height: 15 },
};

const PLAYER_HITBOX = {
  offsetX: 22,
  offsetY: 10,
  width: CAR_WIDTH - 45,
  height: CAR_HEIGHT - 20,
};

export default function LaneRunnerGame({ currentUser }) {
  // refs
  const canvasRef = useRef(null);
  const imagesRef = useRef({});
  const carXRef    = useRef((CANVAS_WIDTH - CAR_WIDTH)/2);
  const carYRef    = useRef(CANVAS_HEIGHT - CAR_HEIGHT - 10);

  // game state
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [collectedGS,   setCollectedGS] = useState(0);
  const [collectedAP,   setCollectedAP] = useState(0);
  const [record,        setRecord] = useState(currentUser.bestRunner || 0);
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

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS_PER_DAY - usedAttempts);

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
      img.src = url || dataUri;
      img.onload = () => {
        imagesRef.current[key] = img;
        res();
      };
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
  }, [currentUser]);

  // start game
  const startGame = async () => {
    if (attemptsLeft <= 0) {
      setModalMessage(`Попытки сегодня исчерпаны (${MAX_ATTEMPTS_PER_DAY})`);
      return setShowModal(true);
    }
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
    setCarY(CANVAS_HEIGHT-CAR_HEIGHT-10);
    setSpawnRate(800);
    setShieldActive(false);
    setBonusModeActive(false);
    setGameState('running');
  };

  // spawn logic
  useEffect(() => {
    if (gameState !== 'running') return;
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
          const y    = 0;
  
          if (bonusModeActive) {
            // только бонусы, чуть больше шансов на редкие
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
            // обычный режим: бонусы или препятствие
            const rnd = Math.random();
            if (rnd < 0.01) {
              // очень редкие
              if (rnd < 0.005) {
                if (!shieldActive) next.push({ kind: 'bonus', bonusType: 'shield', x, y });
              }
              else if (rnd < 0.01)  next.push({ kind: 'bonus', bonusType: 'bonusMode', x, y });
              else if (rnd < 0.015) next.push({ kind: 'bonus', bonusType: 'bigGS', x, y });
              else                   next.push({ kind: 'bonus', bonusType: 'bigAP', x, y });
            }
            else if (rnd < 0.17) {
              // обычные бонусы
              next.push({ kind: 'bonus', bonusType: Math.random() < 0.5 ? 'gs' : 'ap', x, y });
            }
            else {
              // препятствие
              const asset = OBSTACLE_ASSETS[Math.floor(Math.random() * OBSTACLE_ASSETS.length)];
              next.push({ kind: 'obs', spriteKey: asset.key, x, y: -OBSTACLE_SIZE });
            }
          }
        }
  
        return [...prev, ...next];
      });
    }, spawnRate);
  
    return () => clearInterval(id);
  }, [gameState, spawnRate, bonusModeActive, shieldActive]);
  

  // main loop: движение, столкновения, счёт
  useEffect(() => {
    if (gameState !== 'running') return;
    let last = performance.now(), raf;
    const baseSpeed = 0.2, speedMult = 1.5;

    function animate(now){
      const delta = now - last; last = now;
      const dy = scrollSpeed * (delta/16);
      let y1 = bgY1+dy, y2 = bgY2+dy;
      if (y1 >= CANVAS_HEIGHT) y1 = y2 - CANVAS_HEIGHT;
      if (y2 >= CANVAS_HEIGHT) y2 = y1 - CANVAS_HEIGHT;
      setBgY1(y1); setBgY2(y2);

      // движение машины
      setCarX(x=>Math.max(SPAWN_REGION_X, Math.min(SPAWN_REGION_X+SPAWN_REGION_WIDTH-CAR_WIDTH, x + carV*delta/16)));
      setCarY(y=>Math.max(0, Math.min(CANVAS_HEIGHT-CAR_HEIGHT, y + carVy*delta/16)));

      // хитбокс машины
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
            // хитбокс объекта
            const hb = o.kind==='obs'
              ? OBSTACLE_HITBOXES[o.spriteKey]
              : { offsetX:0, offsetY:0, width:OBSTACLE_SIZE, height:OBSTACLE_SIZE };
            const objRect = {
              x: o.x + hb.offsetX,
              y: o.y + hb.offsetY,
              w: hb.width,
              h: hb.height
            };
            // проверка пересечения
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
                  return false; // удаляем препятствие, без конца игры
                } else {
                  setGameState('over');
                  return false;
                }
              } else {
                // бонус
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
                  // (обратите внимание: collectedAP*10 выводит AP, так что +100 здесь даст +1000)
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
          setSpawnRate(r=>Math.max(300, r*0.98));
        }
        return n;
      });

      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [gameState, carV, carVy, bgY1, bgY2, shieldActive]);

  useEffect(() => {
    if (gameState === 'over') {
      setShowBlink(true);
      setShowStats(false);
    }
  }, [gameState]);

  // рендер
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // фон
    const track = imagesRef.current.track;
    if (track) {
      ctx.drawImage(track, 0, bgY1, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(track, 0, bgY2, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    }

    // машина
    const pImg = imagesRef.current.player;
    if (pImg) ctx.drawImage(pImg, carXRef.current, carYRef.current, CAR_WIDTH, CAR_HEIGHT);

    // объекты
    objects.forEach(o=>{
      if (o.kind==='obs') {
        const img = imagesRef.current[o.spriteKey];
        if (img) ctx.drawImage(img, o.x, o.y, OBSTACLE_SIZE, OBSTACLE_SIZE);
      } else {
        // бонус
        let key, size, label;
        switch(o.bonusType){
          case 'gs':       key='gsIcon';       size=24; label='+1'; break;
          case 'ap':       key='apIcon';       size=24; label='+10'; break;
          case 'shield':   key='shieldIcon';   size=32; label='';    break;
          case 'bonusMode':key='bonusModeIcon';size=32; label='';    break;
          case 'bigGS':    key='gsIcon';       size=32; label='+50'; break;
          case 'bigAP':    key='apIcon';       size=32; label='+1000'; break;
        }
        const icon = imagesRef.current[key];
        if (icon) ctx.drawImage(icon, o.x, o.y, size, size);
        if (label) {
          ctx.fillStyle='white';
          ctx.font='14px sans-serif';
          ctx.fillText(label, o.x + size/4, o.y + size + 14);
        }
      }
    });

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Счёт: ${Math.floor(score)}`, 10, 25);
    ctx.fillText(`GS: ${collectedGS}`, 10, 50);
    ctx.fillText(`AP: ${collectedAP*10}`, 10, 75);
    if (shieldActive) {
      ctx.fillText(`Safety Car`, 260, 25);
    }
    if (bonusModeActive) {
      ctx.fillText(`Без препятствий!`, 200, 50);
    }
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
  }, [gameState]);

  // управление с клавиатуры
  useEffect(() => {
    const down = e => {
      if (gameState !== 'running') return;
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
  }, [gameState]);

  return (
    <div style={{ textAlign: 'center', color: 'white', marginBottom: '90px', justifyItems: 'center' }}>
      {gameState === 'start' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '490px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: 40, cursor: 'pointer' }} onClick={() => setShowRules(true)}>
              Прямая в Монце
            </h2>
            <p>Попыток сегодня: {usedAttempts} / {MAX_ATTEMPTS_PER_DAY}</p>
            <button
              onClick={startGame}
              disabled={attemptsLeft <= 0}
              style={{
                padding: '15px 20px',
                borderRadius: '15px',
                color: attemptsLeft ? 'white' : 'gray',
                border: 'none',
                border: attemptsLeft ? "1px solid rgba(255, 255, 255, 0.2)" : 'none',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
            
              Играть
            </button>
          </div>
        </div>
      ) : (
        <div
          className="game-wrapper"
          style={{
            position: 'relative',
            width: CANVAS_WIDTH,
            maxWidth: '100%',
            margin: '0 auto'
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ width: '100%', height: 'auto', borderRadius: '15px', marginTop: '10px'}}
          />
          <MobileControls
            onPress={dir => {
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
                justifyContent: 'center'
              }}
            >
              <img
                src={gameOverUrl}
                alt="Game Over"
                className="blink"
                style={{ width: 200, height: 'auto' }}
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
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                padding: 20,
                color: 'white',
                borderRadius: '15px',
                maxHeight: "500px"
              }}
            >
              <h3>Вы проиграли</h3>
              <p>Очки: {Math.floor(score)}</p>
              <p>GS получено: {collectedGS + Math.floor(score / 100)}</p>
              <p>Apex получено: {collectedAP * 10 + Math.floor(score / 100) * 10}</p>
              <p>Рекорд: {Math.max(record, Math.floor(score))}</p>
            </div>
          )}
        </div>
      )}
  
      <Modal show={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
      <GameRulesModal
        show={showRules}
        onClose={() => setShowRules(false)}
        gameType="race"
        buttonText="Понятно"
      />
    </div>
  );
  
}
