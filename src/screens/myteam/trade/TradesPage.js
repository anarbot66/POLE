// src/myteam/marketplace/TradesPage.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { subscribeUserTrades, createTrade, acceptTrade, declineTrade, cancelTrade } from './tradesApi';
import TradeModal from './TradeModal';
import TradeCard from './TradeCard';
import UserStats from '../../user/components/UserStats';

export default function TradesPage({ currentUser }) {
  const [trades, setTrades] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [modalMsg, setModalMsg] = useState('');

  const showMessage = (m) => { setModalMsg(m); setTimeout(() => setModalMsg(''), 3000); };

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeUserTrades(currentUser.uid, (data) => {
      setTrades(data);
    });
    return () => unsub && unsub();
  }, [currentUser]);

  const incoming = useMemo(() => trades.filter(t => t.toId === currentUser?.uid && t.status === 'pending'), [trades, currentUser]);
  const outgoing = useMemo(() => trades.filter(t => t.fromId === currentUser?.uid), [trades, currentUser]);

  const handleCreate = async (payload) => {
    if (!currentUser) return showMessage('Нужно войти');
    try {
      await createTrade({ fromId: currentUser.uid, ...payload });
      showMessage('Обмен отправлен');
      setShowCreate(false);
    } catch (e) {
      showMessage(e?.message || 'Ошибка отправки обмена');
    }
  };

  const handleAccept = async (trade) => {
    try {
      setLoadingId(trade.id);
      await acceptTrade(trade.id, currentUser.uid);
      showMessage('Обмен успешно принят. Внимание: это обмен — мы не несём ответственности за обещания вне приложения.');
    } catch (e) {
      showMessage(e?.message || 'Ошибка при принятии обмена');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (trade) => {
    try {
      setLoadingId(trade.id);
      await declineTrade(trade.id, currentUser.uid);
      showMessage('Обмен отклонён');
    } catch (e) {
      showMessage(e?.message || 'Ошибка при отклонении');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (trade) => {
    try {
      setLoadingId(trade.id);
      await cancelTrade(trade.id, currentUser.uid);
      showMessage('Обмен отменён');
    } catch (e) {
      showMessage(e?.message || 'Ошибка при отмене');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={currentUser?.photoUrl || 'https://placehold.co/80x80'} alt="avatar" style={{ width: 36, height: 36, borderRadius: 18 }} />
        {currentUser && <UserStats uid={currentUser.uid} />}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setShowCreate(true)}>Предложить обмен</button>
        </div>
      </div>

      <h3>Входящие</h3>
      {incoming.length === 0 && <div>Нет входящих</div>}
      {incoming.map(t => (
        <TradeCard
          key={t.id}
          trade={t}
          currentUser={currentUser}
          onAccept={() => handleAccept(t)}
          onDecline={() => handleDecline(t)}
          loading={loadingId === t.id}
        />
      ))}

      <h3>Исходящие</h3>
      {outgoing.length === 0 && <div>Нет исходящих</div>}
      {outgoing.map(t => (
        <TradeCard
          key={t.id}
          trade={t}
          currentUser={currentUser}
          onCancel={() => handleCancel(t)}
          loading={loadingId === t.id}
        />
      ))}

      {showCreate && (
        <TradeModal
          show={showCreate}
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {modalMsg && <div style={{ position: 'fixed', bottom: 20, left: 20, background: '#111', color: '#fff', padding: 10, borderRadius: 8 }}>{modalMsg}</div>}
    </div>
  );
}
