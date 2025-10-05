// src/myteam/marketplace/TradeCard.jsx
import React from 'react';
import cardsJson from '../cards/cards.json';

function formatCards(hash = {}) {
  return Object.entries(hash).map(([id,c]) => {
    const meta = (cardsJson.cards || []).find(x => x.id === id) || { name: id };
    return `${meta.name || id} x${c}`;
  }).join(', ') || '—';
}

export default function TradeCard({ trade, currentUser, onAccept, onDecline, onCancel, loading }) {
  const amSender = currentUser && trade.fromId === currentUser.uid;
  const amReceiver = currentUser && trade.toId === currentUser.uid;

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.06)', padding: 10, borderRadius: 8, marginBottom: 8, background: '#0f0f0f' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff' }}>{trade.meta?.fromName || trade.fromId} → {trade.meta?.toName || (trade.toId || 'Всем')}</div>
          <div style={{ color: '#999', fontSize: 13 }}>{new Date(trade.createdAt?.seconds ? trade.createdAt.seconds*1000 : Date.now()).toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: trade.status === 'pending' ? '#ffd' : '#888' }}>{trade.status}</div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div><strong>Отдаёт:</strong> {formatCards(trade.offered)}</div>
        <div><strong>Просит:</strong> {formatCards(trade.requested)}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {trade.status === 'pending' && amReceiver && <button onClick={onAccept} disabled={loading}>Принять</button>}
        {trade.status === 'pending' && amReceiver && <button onClick={onDecline} disabled={loading}>Отклонить</button>}
        {trade.status === 'pending' && amSender && <button onClick={onCancel} disabled={loading}>Отменить</button>}
      </div>
    </div>
  );
}
