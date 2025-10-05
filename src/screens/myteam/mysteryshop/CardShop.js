// src/pages/CardShop.jsx
import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../firebase';
import cardsData from '../cards/cards.json';
import Modal from '../../components/Modal';
import UserStats from '../../user/components/UserStats';
import { useSwipeable } from 'react-swipeable';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './CardShop.css';
import logo from "../../recources/images/logo.png"
import BackButton from '../../components/BackButton';

const APEX_TO_GS_RATE = 10;
const dailyCards = ['rookie_1', 'common_2', 'epic_3', 'premium_hero_1', 'icon_1', 'legendary_3'];

// Настраиваемый cooldown (ms) после успешного обмена, чтобы избежать дюпа кликами
const COOLDOWN_MS = 5000;

export default function CardShop({ currentUser }) {
  const [apexInput, setApexInput] = useState(0);
  const [gsOutput, setGsOutput] = useState(0);
  const [modalShow, setModalShow] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [tab, setTab] = useState('exchange'); // вкладки: exchange / cards

  // новый стейт: обмен в процессе (блокирует кнопку)
  const [isConverting, setIsConverting] = useState(false);
  // флаг cooldown после успешного обмена
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownTimerRef = useRef(null);

  useEffect(() => {
    setGsOutput(Math.floor(apexInput / APEX_TO_GS_RATE));
  }, [apexInput]);

  useEffect(() => {
    return () => {
      // очистка таймера при размонтировании компонента
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const showModal = (message) => {
    setModalMessage(message);
    setModalShow(true);
  };

  const handleConvert = async () => {
    // мягкая локальная защита: если уже в процессе или на cooldown — не делаем ничего
    if (isConverting || isCooldown) return;

    // валидация
    if (!apexInput || apexInput <= 0) {
      showModal('Введите корректное количество ApexPoints для обмена');
      return;
    }

    if (apexInput > currentUser.apexPoints) {
      showModal('Недостаточно ApexPoints');
      return;
    }

    if (gsOutput <= 0) {
      showModal('Нельзя обменять такое количество (меньше требуемого по курсу)');
      return;
    }

    setIsConverting(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);

      // Выполняем обновление: атомарное уменьшение apex и увеличение gs
      await updateDoc(userRef, {
        apexPoints: increment(-apexInput),
        gsCurrency: increment(gsOutput)
      });

      showModal(`Вы получили ${gsOutput} GS за ${apexInput} ApexPoints`);
      setApexInput(0);

      // ставим короткий cooldown, чтобы избежать быстрого повторного клика/дюпа
      setIsCooldown(true);
      cooldownTimerRef.current = setTimeout(() => {
        setIsCooldown(false);
        cooldownTimerRef.current = null;
      }, COOLDOWN_MS);
    } catch (err) {
      console.error(err);
      showModal('Ошибка при обмене.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleBuyCard = async (card) => {
    // проверка баланса
    if (card.recomendPriceFantasy > currentUser.fantasyPoints) {
      showModal('Недостаточно Fantasy Points для покупки');
      return;
    }
  
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fantasyPoints: increment(-card.recomendPriceFantasy), // списание fantasyPoints
        [`cards.${card.id}`]: increment(1)                   // добавление карточки
      });
      showModal(`Вы купили ${card.name}. Карточка добавлена в вашу коллекцию!`);
    } catch (err) {
      console.error(err);
      showModal('Ошибка при покупке карточки.');
    }
  };
  

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => setTab(tab === 'exchange' ? 'cards' : 'exchange'),
    onSwipedRight: () => setTab(tab === 'cards' ? 'exchange' : 'cards'),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true
  });

  // условия дизейбла кнопки обмена
  const convertDisabled = isConverting || isCooldown || apexInput <= 0 || apexInput > currentUser.apexPoints || gsOutput <= 0;

  return (
    <div className="container">
      {/* Верхняя панель */}
      <div style={{position: 'fixed', left: 0, top: 0, width: '100%', padding: 12, background: '#111', zIndex: 10}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <BackButton />
          {currentUser && <UserStats uid={currentUser.uid} />}
        </div>
        <div style={{display: 'flex', gap: 8, marginTop: 8}}>
          <button
            onClick={() => setTab('exchange')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 30,
              background: tab === 'exchange' ? 'black' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 280ms ease'
            }}
          >
            Обмен
          </button>
          <button
            onClick={() => setTab('cards')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 30,
              background: tab === 'cards' ? 'black' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 280ms ease'
            }}
          >
            Рынок
          </button>
        </div>
      </div>

      <TransitionGroup>
        <CSSTransition key={tab} classNames="tab" timeout={300}>
          <div {...swipeHandlers} style={{marginTop: 100}}>
            {/* Вкладка Обмен */}
            {tab === 'exchange' && (
              <div className="cardsStack">
                <h1 style={{display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', width: '100%'}}>Обмен <div style={{ width: 15, height: 15 }}>
                            <img src={logo} alt="Логотип" className="logo" />
                          </div> на <svg width="16" height="15" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg"> ... </svg></h1>
                <input
                  className="inputDsg"
                  type="number"
                  value={apexInput === 0 ? '' : apexInput}
                  min={0}
                  max={currentUser.apexPoints}
                  onChange={(e) => setApexInput(Number(e.target.value))}
                  onFocus={() => setApexInput(0)}
                />
                <button
                  className="convertButton"
                  onClick={handleConvert}
                  disabled={convertDisabled}
                  style={{
                    opacity: convertDisabled ? 0.45 : 1,
                    pointerEvents: convertDisabled ? 'none' : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {isConverting ? 'Обмен...' : `Обменять ${apexInput} `}
                  <div style={{ width: 15, height: 15 }}>
                    <img src={logo} alt="Логотип" className="logo" />
                  </div>
                  {` на ${gsOutput} `}
                  <svg width="16" height="15" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#paint0_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint0_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/></g></g><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clipPath="url(#paint1_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint1_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/></g></g><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clipPath="url(#paint2_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint2_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/></g></g><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clipPath="url(#paint3_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint3_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shapeRendering="crispEdges"/></g></g><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<defs>
<clipPath id="paint0_diamond_4291_10_clip_path"><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z"/></clipPath><clipPath id="paint1_diamond_4291_10_clip_path"><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z"/></clipPath><clipPath id="paint2_diamond_4291_10_clip_path"><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z"/></clipPath><clipPath id="paint3_diamond_4291_10_clip_path"><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z"/></clipPath><linearGradient id="paint0_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stopColor="#00FFD5"/>
<stop offset="1" stopColor="#0084FF"/>
</linearGradient>
<linearGradient id="paint1_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stopColor="#00FFD5"/>
<stop offset="1" stopColor="#0084FF"/>
</linearGradient>
<linearGradient id="paint2_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stopColor="#00FFD5"/>
<stop offset="1" stopColor="#0084FF"/>
</linearGradient>
<linearGradient id="paint3_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stopColor="#00FFD5"/>
<stop offset="1" stopColor="#0084FF"/>
</linearGradient>
</defs>
</svg>
                </button>
                {isCooldown && <p style={{fontSize: 12, color: 'gray', textAlign: 'center', marginTop: 8}}>Подождите чуть-чуть</p>}
              </div>
            )}

            {/* Вкладка Рынок */}
            {tab === 'cards' && (
              <div className="cardsStack">
                <div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
  }}
>
  {dailyCards.map((id) => {
    const card = cardsData.cards.find((c) => c.id === id);
    return (
      <div
        key={card.id}
        style={{
          flex: '0 0 calc(50% - 10px)', // две карточки в ряд с учётом gap
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img
          className="cardImg"
          src={card.image}
          alt={card.name}
          style={{ width: '100%', maxWidth: 200 }}
        />
        <h3 className="cardName">{card.name}</h3>
        <p className="cardRarity">{card.rarityText}</p>
        <button
          style={{
            background: 'black',
            marginTop: 10,
            display: 'flex',
            gap: 5,
            alignItems: 'center',
            justifyContent: 'center',
            width: 'fit-content',
            fontSize: 12,
            padding: '10px 20px',
            borderRadius: 20,
            minWidth: 160,
          }}
          onClick={() => handleBuyCard(card)}
        >
          Купить за {card.recomendPriceFantasy}
          <div style={{ width: 15, height: 15 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="16" height="16" rx="8" fill="#F100F5"/>
<path d="M5.5973 11.9092V4.63645H10.5618V6.06401H7.35511V7.55549H10.2457V8.98659H7.35511V11.9092H5.5973Z" fill="white"/>
</svg>
          </div>
        </button>
      </div>
    );
  })}

  <p style={{color: "gray", fontSize: '12px', width: '100%', textAlign: 'center'}}>Карточки тайной лавки обновляются раз в 3 дня.</p>
</div>

              </div>
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>

      {/* Модалка */}
      <Modal
        show={modalShow}
        onClose={() => setModalShow(false)}
        message={modalMessage}
      />
    </div>
  );
}
