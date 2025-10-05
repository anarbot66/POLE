// src/myteam/marketplace/marketplaceApi.js
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

const LISTINGS_COL = 'marketplace';
const USERS_COL = 'users';

/**
 * Получить все листинги, включая проданные.
 * Можно добавить фильтр по статусу, но по умолчанию берем все.
 */
export async function fetchAllListings() {
  const colRef = collection(db, LISTINGS_COL);
  const q = query(colRef, orderBy('createdAt', 'desc')); // все лоты по дате создания
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Получить только проданные лоты
 */
export async function fetchSoldListings() {
  const colRef = collection(db, LISTINGS_COL);
  const q = query(colRef, where("status", "==", "sold"), orderBy('soldAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


/**
 * Подписка на активные листинги.
 * callback = (arr) => void, arr = [{ id, ...data }]
 * Возвращает функцию отписки.
 */
export function subscribeActiveListings(callback) {
  const colRef = collection(db, LISTINGS_COL);
  // убедитесь, что createdAt существует в документах (orderBy)
  const q = query(colRef, where("status", "==", "active"), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (err) => {
    console.error('subscribeActiveListings snapshot error', err);
    callback([]); // в ошибочном случае — чистим
  });
  return unsub;
}

/**
 * Создать листинг и зарезервировать карточки у продавца (в транзакции).
 * Возвращает id нового листинга.
 * payload: { sellerId, cardId, count, price, listingMeta }
 */
export async function createListing({ sellerId, cardId, cardName, count, price, listingMeta = {} }) {
  if (!sellerId) throw new Error('sellerId required');
  if (!cardId) throw new Error('cardId required');

  const sellerRef = doc(db, USERS_COL, sellerId);
  const listingsColRef = collection(db, LISTINGS_COL);
  const listingRef = doc(listingsColRef); // новый doc ref

  return await runTransaction(db, async (tx) => {
    const sellerSnap = await tx.get(sellerRef);
    if (!sellerSnap.exists()) throw new Error('Seller not found');

    const sellerData = sellerSnap.data();
    const cards = sellerData.cards || {};
    const have = Number(cards[cardId] || 0);

    // Получаем все активные листинги этого продавца с этой картой
    const listingsQuerySnap = await getDocs(query(
      collection(db, LISTINGS_COL),
      where('sellerId', '==', sellerId),
      where('cardId', '==', cardId),
      where('status', '==', 'active')
    ));

    const reservedCount = listingsQuerySnap.docs.reduce((sum, d) => sum + (d.data().count || 0), 0);

    if (have - reservedCount < count) throw new Error('У продавца недостаточно копий этой карты для листинга');

    // Создаём листинг без списания карт
    const toSet = {
      sellerId,
      cardId,
      cardName,
      count,
      price: Number(price),
      status: 'active',
      createdAt: serverTimestamp(),
      ...listingMeta,
    };
    tx.set(listingRef, toSet);

    return listingRef.id;
  });
}


/**
 * Покупка листинга (покупаем весь лот).
 * buyerId - uid покупателя.
 */
export async function buyListing(listingId, buyerId) {
  if (!listingId) throw new Error('listingId required');
  if (!buyerId) throw new Error('buyerId required');

  const listingRef = doc(db, LISTINGS_COL, listingId);

  return await runTransaction(db, async (tx) => {
    const listingSnap = await tx.get(listingRef);
    if (!listingSnap.exists()) throw new Error('Лот не найден');
    const listing = listingSnap.data();

    if (listing.status !== 'active') throw new Error('Лот недоступен');
    const { sellerId, cardId, count = 1, price = 0 } = listing;

    if (sellerId === buyerId) throw new Error('Нельзя купить свой лот');

    const buyerRef = doc(db, USERS_COL, buyerId);
    const sellerRef = doc(db, USERS_COL, sellerId);

    const [buyerSnap, sellerSnap] = await Promise.all([
      tx.get(buyerRef),
      tx.get(sellerRef)
    ]);

    if (!buyerSnap.exists()) throw new Error('Покупатель не найден');
    if (!sellerSnap.exists()) throw new Error('Продавец не найден');

    const buyerData = buyerSnap.data();
    const sellerData = sellerSnap.data();

    const buyerBalance = Number(buyerData.apexPoints || buyerData.apexpoints || 0);
    console.log(buyerBalance)
    if (buyerBalance < price) throw new Error('У вас недостаточно ApexPoints');

    console.log(sellerId, cardId)

    const sellerCardCount = sellerData.cards?.[cardId] || 0;
    console.log('sellerData.cards:', sellerData.cards);
    console.log('cardId:', cardId, 'sellerCardCount:', sellerCardCount, 'count:', count);

    if (sellerCardCount < count) throw new Error('У продавца недостаточно карт для продажи');

    // списываем деньги у покупателя и начисляем продавцу
    tx.update(buyerRef, { apexPoints: increment(-price) });
    tx.update(sellerRef, { apexPoints: increment(price) });

    // передаем карты: списываем у продавца, добавляем покупателю
    tx.update(sellerRef, { [`cards.${cardId}`]: increment(-count) });
    tx.update(buyerRef, { [`cards.${cardId}`]: increment(count) });

    // отмечаем лот как проданный
    tx.update(listingRef, {
      status: 'sold',
      buyerId,
      soldAt: serverTimestamp(),
    });

    return true;
  });
}


/**
 * Отмена листинга продавцом — возвращаем карты на аккаунт продавца и помечаем лот cancelled.
 */
export async function cancelListing(listingId, requesterId) {
  if (!listingId) throw new Error('listingId required');
  if (!requesterId) throw new Error('requesterId required');

  const listingRef = doc(db, LISTINGS_COL, listingId);

  return await runTransaction(db, async (tx) => {
    const listingSnap = await tx.get(listingRef);
    if (!listingSnap.exists()) throw new Error('Лот не найден');

    const listing = listingSnap.data();
    if (listing.status !== 'active') throw new Error('Лот нельзя отменить');

    if (listing.sellerId !== requesterId) throw new Error('Только продавец может отменить лот');

    const sellerRef = doc(db, USERS_COL, listing.sellerId);

    // mark listing cancelled
    tx.update(listingRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    });

    return true;
  });
}
