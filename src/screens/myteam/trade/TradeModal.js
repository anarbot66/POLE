// src/myteam/marketplace/TradeModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import cardsJson from '../cards/cards.json';
import { CSSTransition } from "react-transition-group";

export default function TradeModal({ show, onClose, currentUser, onSubmit }) {
  const [offered, setOffered] = useState({}); // {cardId: count}
  const [requested, setRequested] = useState({});
  const [toId, setToId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const userCards = useMemo(() => currentUser?.cards || {}, [currentUser]);

  useEffect(() => {
    if (!show) return;
    setOffered({});
    setRequested({});
    setToId('');
    setNote('');
    setError(null);
  }, [show]);

  const changeOffered = (cardId, cnt) => {
    setOffered(prev => ({ ...prev, [cardId]: cnt ? Number(cnt) : undefined }));
  };
  const changeRequested = (cardId, cnt) => {
    setRequested(prev => ({ ...prev, [cardId]: cnt ? Number(cnt) : undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!currentUser) return setError('Нужно войти');
    if (Object.keys(offered).length === 0) return setError('Укажите хотя бы одну карту для предложения');
    // проверка наличия у пользователя
    for (const [cid, cnt] of Object.entries(offered)) {
      if ((Number(userCards[cid] || 0)) < Number(cnt || 0)) return setError(`У вас недостаточно ${cid}`);
    }
    // requested может быть пустым (просто дарение)
    try {
      await onSubmit({ toId: toId || null, offered, requested, meta: { note, toName: '', fromName: currentUser.name || '' } });
    } catch (err) {
      setError(err?.message || 'Ошибка');
    }
  }

  const allCards = cardsJson?.cards || [];

  return (
    <CSSTransition in={show} timeout={200} classNames="fade" unmountOnExit mountOnEnter>
      <div className="modalBackdrop" onClick={onClose}>
        <div className="modalDark modalWide" onClick={e => e.stopPropagation()}>
          <div className="modalHeader">
            <h3>Предложить обмен</h3>
            <button className="closeBtn" onClick={onClose}>✕</button>
          </div>
          <div className="modalBody">
            <form onSubmit={handleSubmit}>
              <label>Кому (uid) — оставьте пустым для публичного предложения</label>
              <input value={toId} onChange={e => setToId(e.target.value)} placeholder="UID адресата" />

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4>Вы отдаёте</h4>
                  {allCards.map(c => {
                    const have = Number(userCards[c.id] || 0);
                    if (have <= 0) return null;
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <img src={c.image} alt={c.name} style={{ width: 36, height: 36 }} />
                        <div style={{ flex: 1 }}>{c.name} (в наличии: {have})</div>
                        <input type="number" min="0" max={have} value={offered[c.id] || ''} onChange={e => changeOffered(c.id, e.target.value)} style={{ width: 70 }} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ flex: 1 }}>
                  <h4>Вы хотите получить</h4>
                  {allCards.map(c => (
                    <div key={'r'+c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <img src={c.image} alt={c.name} style={{ width: 36, height: 36 }} />
                      <div style={{ flex: 1 }}>{c.name}</div>
                      <input type="number" min="0" value={requested[c.id] || ''} onChange={e => changeRequested(c.id, e.target.value)} style={{ width: 70 }} />
                    </div>
                  ))}
                </div>
              </div>

              <label>Примечание (необязательно)</label>
              <input value={note} onChange={e => setNote(e.target.value)} />

              {error && <div className="errorMsg">{error}</div>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btnSecondary" onClick={onClose}>Отмена</button>
                <button type="submit" className="btnPrimary">Отправить</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
}
