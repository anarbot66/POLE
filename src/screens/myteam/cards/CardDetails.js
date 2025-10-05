// src/myteam/mycards/CardDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "../../../firebase";
import cardsJson from "./cards.json";
import BackButton from "../../components/BackButton";
import logo from "../../recources/images/logo.png"; // используем тот же логотип
import {
  collection,
  doc,
  runTransaction,
  onSnapshot,
  query,
  where,
  increment,
  getDocs,
} from 'firebase/firestore';

const LISTINGS_COL = 'marketplace';

export default function CardDetails({ currentUser }) {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [userCardCount, setUserCardCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDissolving, setIsDissolving] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  const goBack = () => {
    const to = location?.state?.from ?? '/collection';
    navigate(to, { replace: true });
  };

  useEffect(() => {
    // Найти карточку в JSON
    const foundCard = cardsJson.cards.find(c => c.id === cardId);
    if (foundCard) {
      setCard(foundCard);
    } else {
      setCard(null);
    }
    setLoading(false);
  }, [cardId]);

  useEffect(() => {
    // Подписка на количество карточек пользователя
    if (!currentUser?.uid || !cardId) {
      setUserCardCount(0);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const userData = snap.data();
        const cards = userData.cards || {};
        setUserCardCount(Number(cards[cardId] || 0));
      } else {
        setUserCardCount(0);
      }
    }, (err) => {
      console.error('onSnapshot error', err);
      setUserCardCount(0);
    });

    return () => unsub();
  }, [currentUser, cardId]);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
        Загрузка...
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Карточка не найдена</h2>
        <button
          onClick={() => navigate('/collection', { replace: true })}
          style={{
            marginTop: 20,
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Назад к коллекции
        </button>
      </div>
    );
  }

  // ============ Логика распыления (как в PackOpeningPage) ============
  function getRarityMultiplier(rarity) {
    const map = {
      consumable: 3,
      rookie: 5,
      common: 10,
      rare: 25,
      epic: 40,
      legendary: 80,
      hero: 60,
      prime_hero: 80,
      icon: 100,
      prime_icon: 120
    };
    return map[rarity] || 1;
  }

  function calcDissolveValue(cardObj) {
    const rtg = Number(cardObj.rtg || 0);
    const mult = getRarityMultiplier(cardObj.rarity);
    return Math.round(rtg * mult);
  }

  // флаг: special карточки нельзя распылять — скрываем секцию
  const isSpecialCard = (card && String(card.rarity || '').toLowerCase() === 'event');

  const handleDissolve = async () => {
    setError(null);
    if (isSpecialCard) {
      setError('Эту карточку нельзя распылить.');
      return;
    }
    if (!currentUser?.uid) {
      setError('Требуется вход в аккаунт.');
      return;
    }
    if (!card || !card.id) {
      setError('Неверная карта.');
      return;
    }
    if ((userCardCount || 0) <= 0) {
      setError('У вас нет этой карточки для распыления.');
      return;
    }
  
    try {
      // Проверяем активные листинги на эту карту
      const listingsQuery = query(
        collection(db, LISTINGS_COL),
        where('sellerId', '==', currentUser.uid),
        where('cardId', '==', card.id),
        where('status', '==', 'active')
      );
      const listingsSnap = await getDocs(listingsQuery);
      const reserved = listingsSnap.docs.reduce((s, d) => s + (d.data().count || 0), 0);
    
      if (userCardCount <= reserved) {
        setError('Все ваши копии этой карточки сейчас в активных листингах. Распыление невозможно.');
        return;
      }
    
      // Количество, которое реально можно распылить
      const availableToDissolve = userCardCount - reserved;
      console.log('Можно распылить карточек:', availableToDissolve);

      // (по UI сейчас мы распыляем по 1; можно расширить, чтобы распылять N)
    } catch (err) {
      console.error('Ошибка при проверке листингов перед распылением', err);
      setError('Не удалось проверить листинги. Попробуйте позже.');
      return;
    }
    
  
    const value = calcDissolveValue(card);
    setIsDissolving(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('Пользователь не найден');
        const data = snap.data();
        const cards = data.cards || {};
        const have = Number(cards[card.id] || 0);
        if (have <= 0) throw new Error('У вас нет этой карточки для распыления');
  
        // уменьшаем количество карточек на 1 и добавляем apexPoints
        tx.update(userRef, {
          [`cards.${card.id}`]: increment(-1),
          apexPoints: increment(value)
        });
      });
  
      // оптимистично обновляем локальное состояние
      setUserCardCount(prev => Math.max(0, (prev || 0) - 1));
  
      // Навигация обратно в коллекцию (или откуда пришли)
      goBack();
    } catch (e) {
      console.error('handleDissolve error', e);
      setError(e && e.message ? e.message : 'Ошибка распыления');
    } finally {
      setIsDissolving(false);
    }
  };
  
  // ===================================================================

  // Определение цвета рамки по редкости
  const getRarityColor = (rarity) => {
    const colors = {
      rookie: '#888888',
      common: '#ffffff',
      rare: '#00aaff',
      epic: '#aa00ff',
      legendary: '#ffaa00',
      hero: '#ff5555',
      prime_hero: '#ff3333',
      icon: '#ffcc00',
      prime_icon: '#ffaa00'
    };
    return colors[rarity] || '#ffffff';
  };

  return (
    <div style={{
      padding: 20,
      maxWidth: 800,
      margin: '0 auto',
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: 20 }}>
        <BackButton />
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        flex: 1
      }}>
        {/* Карточка */}
        <div style={{
          position: 'relative',
          borderRadius: 16,
          padding: 16,
          width: '100%',
          maxWidth: 400
        }}>
          <img
            src={card.image}
            alt={card.name}
            style={{
              width: '100%',
              borderRadius: 12,
              display: 'block'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/cards/unknown.png';
            }}
          />

          {/* Бейдж количества */}
          {userCardCount > 0 && (
            <div style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              fontSize: 14,
              padding: '4px 12px',
              borderRadius: 20,
              minWidth: 30,
              textAlign: 'center'
            }}>
              ×{userCardCount}
            </div>
          )}
        </div>

        {/* Информация о карточке */}
        <div style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: 20
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            textAlign: 'center',
            color: '#fff'
          }}>
            {card.name}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}>
            <div>
              <div style={{
                fontSize: 14,
                color: '#aaa',
                marginBottom: 4
              }}>
                Редкость
              </div>
              <div style={{
                fontSize: 16,
                color: getRarityColor(card.rarity),
                textTransform: 'capitalize'
              }}>
                {card.rarityText}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: 14,
                color: '#aaa',
                marginBottom: 4
              }}>
                Рейтинг
              </div>
              <div style={{
                fontSize: 16,
                color: '#fff'
              }}>
                {card.rtg}
              </div>
            </div>

            {card.nationText && (
              <div>
                <div style={{
                  fontSize: 14,
                  color: '#aaa',
                  marginBottom: 4
                }}>
                  Нация
                </div>
                <div style={{
                  fontSize: 16,
                  color: '#fff'
                }}>
                  {card.nationText}
                </div>
              </div>
            )}

            {card.team && (
              <div>
                <div style={{
                  fontSize: 14,
                  color: '#aaa',
                  marginBottom: 4
                }}>
                  Команда
                </div>
                <div style={{
                  fontSize: 16,
                  color: '#fff'
                }}>
                  {card.team}
                </div>
              </div>
            )}


            {card.recomendPrice && (
              <div>
                <div style={{
                  fontSize: 14,
                  color: '#aaa',
                  marginBottom: 4
                }}>
                  Цена карточки (рекомедованная)
                </div>
                <div style={{
                  fontSize: 16,
                  color: '#fff'
                }}>
                  {card.recomendPrice}
                </div>
              </div>
            )}
          </div>

          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              fontSize: 14,
              color: '#aaa',
              marginBottom: 8
            }}>
              ID карточки
            </div>
            <div style={{
              fontSize: 12,
              color: '#888',
              wordBreak: 'break-all'
            }}>
              {card.id}
            </div>
          </div>

          {/* Блок распыления */}
          {/* Скрываем весь блок распыления для карточек special */}
          {!isSpecialCard && (
            <div style={{ marginTop: 18 }}>
              <div style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>Распыление</div>

              {/* Показываем кнопку только если есть хотя бы 1 карта */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleDissolve}
                  disabled={isDissolving || (userCardCount <= 0)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: (isDissolving || userCardCount <= 0) ? 'rgba(0,0,0,0.6)' : '#141416',
                    color: '#fff',
                    cursor: (isDissolving || userCardCount <= 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  title={userCardCount > 0 ? `Распылить за ${calcDissolveValue(card)} ApexPoints` : 'У вас нет этой карты'}
                >
                  {isDissolving ? 'Распыление…' : `Распылить за ${calcDissolveValue(card)}`}
                  <div style={{ width: 18, height: 18 }}>
                    <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                </button>
              </div>

              {error && <div style={{ color: '#f88', marginTop: 10 }}>{error}</div>}
            </div>
          )}
          {/* конец блока распыления */}
        </div>
      </div>
    </div>
  );
}
