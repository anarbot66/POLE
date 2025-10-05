// ListingCard.jsx
import React from 'react';
import cardsJson from '../cards/cards.json';

export default function ListingCard({ listing, currentUser, onBuy, onCancel, disabled }) {
  const meta = (cardsJson && cardsJson.cards && cardsJson.cards.find(c => c.id === listing.cardId)) || { name: listing.cardId, image: '/assets/cards/unknown.png' };
  const isOwner = currentUser && currentUser.uid === listing.sellerId;

  return (
    <div style={{display: 'flex', gap: '20px'}}>
      <div>
      <img src={meta.image} alt={meta.name} style={{ width: "100%", height: 230, objectFit: 'cover', borderRadius: 8 }} />
      </div>
      <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500 }}>{meta.name}</div>
      <div style={{ marginTop: 8, fontWeight: 400, color: 'gray' }}>Редкость</div>
      <div style={{ fontSize: 14 }}>{meta.rarityText}</div>
      <div style={{ marginTop: 8, fontWeight: 400, color: 'gray' }}>Цена</div>
      <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', fontSize: 14 }}>{listing.price} <img src="/assets/other/logo.png" style={{height: '20px'}} alt='logo'></img></div>
      <div style={{ marginTop: 8, fontWeight: 400, color: 'gray' }}>Продавец</div>
      <div style={{ fontSize: 14 }}>
        {!isOwner ? (
            <div>
              {String(listing.sellerName)}
            </div>
          ) : (
            <div>Вы</div>
          )}
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          {!isOwner ? (
            <button onClick={() => onBuy(listing)} disabled={disabled}>
              Купить
            </button>
          ) : (
            <button onClick={() => onCancel(listing)} disabled={disabled}>
              Отменить
            </button>
          )}
        </div>
        </div>
    </div>
  );
}
