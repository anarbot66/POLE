// src/myteam/marketplace/tradesApi.js
import {
    collection,
    doc,
    runTransaction,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    increment,
    getDocs,
  } from 'firebase/firestore';
  import { db } from '../../../firebase';
  
  const TRADES_COL = 'trades';
  const USERS_COL = 'users';
  
  /**
   * Создать обмен: fromId предлагает offered -> toId просит requested
   * offered/requested: { cardId: count, ... }
   * toId может быть null (публичное предложение)
   */
  export async function createTrade({ fromId, toId = null, offered = {}, requested = {}, meta = {} }) {
    if (!fromId) throw new Error('fromId required');
    if (!offered || Object.keys(offered).length === 0) throw new Error('offered required');
  
    const fromRef = doc(db, USERS_COL, fromId);
    const tradesCol = collection(db, TRADES_COL);
    const tradeRef = doc(tradesCol);
  
    return await runTransaction(db, async (tx) => {
      const fromSnap = await tx.get(fromRef);
      if (!fromSnap.exists()) throw new Error('User not found');
  
      const fromData = fromSnap.data();
      const cards = fromData.cards || {};
      // подсчёт резерва: все pending trades от этого юзера резервируют свои offered
      const pendingQuerySnap = await getDocs(query(
        collection(db, TRADES_COL),
        where('fromId', '==', fromId),
        where('status', '==', 'pending')
      ));
      const reserved = {};
      pendingQuerySnap.docs.forEach(d => {
        const o = d.data().offered || {};
        for (const k of Object.keys(o||{})) reserved[k] = (reserved[k]||0) + (Number(o[k])||0);
      });
  
      // проверяем, что from имеет достаточно карт
      for (const [cardId, cnt] of Object.entries(offered)) {
        const have = Number(cards[cardId] || 0);
        const res = Number(reserved[cardId] || 0);
        if (have - res < Number(cnt || 0)) {
          throw new Error(`У вас недостаточно карт ${cardId} для обмена`);
        }
      }
  
      const toSet = {
        fromId, toId,
        offered,
        requested,
        status: 'pending',
        createdAt: serverTimestamp(),
        meta
      };
      tx.set(tradeRef, toSet);
      return tradeRef.id;
    });
  }
  
  /**
   * Подписка на входящие предложения (toId === currentUser.uid) и исходящие (fromId)
   * callback получает массив трейдов
   */
  export function subscribeUserTrades(uid, callback) {
    const colRef = collection(db, TRADES_COL);
    const q = query(colRef, orderBy('createdAt', 'desc')); // можно фильтр позже в клиенте
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // фильтрация на клиенте: возвращать только те, где toId === uid || fromId === uid
      const filtered = arr.filter(t => t.fromId === uid || t.toId === uid || t.toId == null);
      callback(filtered);
    }, (err) => {
      console.error('subscribeUserTrades', err);
      callback([]);
    });
    return unsub;
  }
  
  /**
   * Отмена трейда отправителем
   */
  export async function cancelTrade(tradeId, requesterId) {
    if (!tradeId) throw new Error('tradeId required');
    if (!requesterId) throw new Error('requesterId required');
  
    const tradeRef = doc(db, TRADES_COL, tradeId);
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(tradeRef);
      if (!snap.exists()) throw new Error('Трейд не найден');
      const trade = snap.data();
      if (trade.status !== 'pending') throw new Error('Трейд нельзя отменить');
      if (trade.fromId !== requesterId) throw new Error('Только отправитель может отменить');
  
      tx.update(tradeRef, { status: 'cancelled', cancelledAt: serverTimestamp() });
      return true;
    });
  }
  
  /**
   * Отклонить трейд (toId отклоняет)
   */
  export async function declineTrade(tradeId, requesterId) {
    if (!tradeId) throw new Error('tradeId required');
    if (!requesterId) throw new Error('requesterId required');
  
    const tradeRef = doc(db, TRADES_COL, tradeId);
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(tradeRef);
      if (!snap.exists()) throw new Error('Трейд не найден');
      const trade = snap.data();
      if (trade.status !== 'pending') throw new Error('Трейд нельзя отклонить');
      // Только адресат или отправитель (если toId null — отклонить может любой) может отклонить
      if (trade.toId && trade.toId !== requesterId) throw new Error('Только адресат может отклонить');
      tx.update(tradeRef, { status: 'declined', declinedAt: serverTimestamp() });
      return true;
    });
  }
  
  /**
   * Принятие трейда: обмен карт между fromId и toId (если toId null — нельзя принять без назначения)
   * Важно: проверяем наличие карт у обеих сторон именно в момент транзакции.
   */
  export async function acceptTrade(tradeId, accepterId) {
    if (!tradeId) throw new Error('tradeId required');
    if (!accepterId) throw new Error('accepterId required');
  
    const tradeRef = doc(db, TRADES_COL, tradeId);
  
    return await runTransaction(db, async (tx) => {
      const tradeSnap = await tx.get(tradeRef);
      if (!tradeSnap.exists()) throw new Error('Трейд не найден');
      const trade = tradeSnap.data();
      if (trade.status !== 'pending') throw new Error('Трейд не активен');
  
      // кто принимает: должен быть toId (если указан) и совпадать с accepterId, либо если toId === null, accepter не разрешён
      if (trade.toId) {
        if (trade.toId !== accepterId) throw new Error('Только адресат может принять этот трейд');
      } else {
        throw new Error('Нельзя принять публичный трейд без назначения');
      }
  
      const fromRef = doc(db, USERS_COL, trade.fromId);
      const toRef = doc(db, USERS_COL, trade.toId);
  
      const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);
      if (!fromSnap.exists() || !toSnap.exists()) throw new Error('Пользователь(и) не найдены');
  
      const fromData = fromSnap.data();
      const toData = toSnap.data();
  
      const fromCards = { ...(fromData.cards || {}) };
      const toCards = { ...(toData.cards || {}) };
  
      // Проверяем, что от отправителя есть offered
      for (const [cardId, cnt] of Object.entries(trade.offered || {})) {
        if ((Number(fromCards[cardId] || 0)) < Number(cnt || 0)) {
          throw new Error(`У отправителя недостаточно карт ${cardId}`);
        }
      }
  
      // Проверяем, что у адресата есть requested (если requested пустой — ничего не нужно)
      for (const [cardId, cnt] of Object.entries(trade.requested || {})) {
        if ((Number(toCards[cardId] || 0)) < Number(cnt || 0)) {
          throw new Error(`У адресата недостаточно карт ${cardId} для обмена`);
        }
      }
  
      // Применяем перевод: списываем у from -> добавляем to; списываем у to -> добавляем from
      // Сначала уменьшаем у обеих сторон
      for (const [cardId, cnt] of Object.entries(trade.offered || {})) {
        tx.update(fromRef, { [`cards.${cardId}`]: increment(-Number(cnt || 0)) });
        tx.update(toRef, { [`cards.${cardId}`]: increment(Number(cnt || 0)) });
      }
      for (const [cardId, cnt] of Object.entries(trade.requested || {})) {
        tx.update(toRef, { [`cards.${cardId}`]: increment(-Number(cnt || 0)) });
        tx.update(fromRef, { [`cards.${cardId}`]: increment(Number(cnt || 0)) });
      }
  
      // Пометим трейд как accepted
      tx.update(tradeRef, { status: 'accepted', acceptedAt: serverTimestamp() });
  
      return true;
    });
  }
  