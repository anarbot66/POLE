// src/myteam/mycards/MyCards.jsx
import React, { useEffect, useState, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import cardsJson from "./cards.json";
import BackButton from "../../components/BackButton";
import { useNavigate, useLocation } from 'react-router-dom';

const rarityOrder = ['rookie', 'common', 'rare', 'epic', 'hero', 'legendary', 'prime_hero', 'icon', 'prime_icon'];
const rarityRank = Object.fromEntries(rarityOrder.map((r, i) => [r, i]));

export default function MyCards({ currentUser }) {
  const [owned, setOwned] = useState([]); // [{ id, count, name, image, rarity, rtg }]
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [sortField, setSortField] = useState('rarity');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const userId = currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setOwned([]);
      return;
    }

    const userRef = doc(db, "users", userId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setOwned([]);
        return;
      }

      const raw = snap.data().cards ?? {};
      let items = [];

      if (Array.isArray(raw)) {
        items = raw.map(it => {
          if (typeof it === 'object' && it !== null) return it;
          return { id: String(it), count: 1 };
        });
      } else if (raw && typeof raw === 'object') {
        items = Object.entries(raw).map(([cardId, count]) => ({ id: cardId, count: Number(count || 0) }));
      }

      const metaMap = new Map();
      if (cardsJson && Array.isArray(cardsJson.cards)) {
        for (const c of cardsJson.cards) metaMap.set(c.id, c);
      }

      const enriched = items
  .map(it => {
    const meta = metaMap.get(it.id);
    return {
      id: it.id,
      count: it.count ?? 0,
      name: meta?.name ?? it.name ?? it.id,
      image: meta?.image ?? it.image ?? '/assets/cards/unknown.png',
      rarity: meta?.rarity ?? it.rarity ?? 'unknown',
      rtg: meta?.rtg ? Number(meta.rtg) : 0,
      nation: meta?.nation ?? '',
      team: meta?.team ?? '',
    };
  })
  // 🧹 фильтруем карточки с count <= 0
  .filter(card => card.count > 0);

setOwned(enriched);


      setOwned(enriched);
    }, (err) => {
      console.error("MyCards onSnapshot error:", err);
      setOwned([]);
    });

    return () => unsub();
  }, [userId]);

  // Фильтрация и сортировка
  const filteredAndSortedCards = useMemo(() => {
    let result = [...owned];

    // Поиск по имени
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(card => 
        card.name.toLowerCase().includes(term)
      );
    }

    // Фильтр по редкости
    if (rarityFilter !== 'all') {
      result = result.filter(card => card.rarity === rarityFilter);
    }

    // Фильтр по рейтингу
    if (minRating !== '') {
      const min = Number(minRating);
      result = result.filter(card => card.rtg >= min);
    }
    if (maxRating !== '') {
      const max = Number(maxRating);
      result = result.filter(card => card.rtg <= max);
    }

    // Сортировка
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'rarity':
          const ra = rarityRank[a.rarity] ?? -1;
          const rb = rarityRank[b.rarity] ?? -1;
          comparison = rb - ra;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rtg':
          comparison = b.rtg - a.rtg;
          break;
        case 'count':
          comparison = b.count - a.count;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [owned, searchTerm, rarityFilter, minRating, maxRating, sortField, sortDirection]);

  const handleCardClick = (cardId) => {
    navigate(`/card/${cardId}`, { state: { from: location.pathname } });
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRarityFilter('all');
    setMinRating('');
    setMaxRating('');
  };

  const rarityOptions = [
    { value: 'all', label: 'Все редкости' },
    { value: 'rookie', label: 'Новичок' },
    { value: 'common', label: 'Обычная' },
    { value: 'rare', label: 'Редкая' },
    { value: 'epic', label: 'Эпическая' },
    { value: 'legendary', label: 'Легендарная' },
    { value: 'hero', label: 'Герой' },
    { value: 'prime_hero', label: 'Прайм Герой' },
    { value: 'icon', label: 'Икона' },
    { value: 'prime_icon', label: 'Прайм Икона' }
  ];

  // Слушатель клавиши Esc и блокировка скролла при открытой панели
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setFiltersOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (filtersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  // Вынесенный рендер панели фильтров (используется в боковой панели)
  const renderFilters = () => (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
        {/* Поиск по имени */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Поиск</label>
          <input
            type="text"
            placeholder="Имя пилота..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              outline: 'none'
            }}
          />
        </div>

        {/* Фильтр по редкости */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Редкость</label>
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              outline: 'none'
            }}
          >
            {rarityOptions.map(option => (
              <option key={option.value} value={option.value} style={{ background: '#333' }}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Минимальный рейтинг */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Мин. рейтинг</label>
          <input
            type="number"
            placeholder="0"
            min="0"
            max="100"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              outline: 'none'
            }}
          />
        </div>

        {/* Максимальный рейтинг */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Макс. рейтинг</label>
          <input
            type="number"
            placeholder="100"
            min="0"
            max="100"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Сортировка */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14 }}>Сортировка:</span>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          style={{
            padding: 6,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff'
          }}
        >
          <option value="rarity" style={{ background: '#333' }}>По редкости</option>
          <option value="name" style={{ background: '#333' }}>По имени</option>
          <option value="rtg" style={{ background: '#333' }}>По рейтингу</option>
          <option value="count" style={{ background: '#333' }}>По количеству</option>
        </select>
        
        <button
          onClick={toggleSortDirection}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>
        
        <button
          onClick={clearFilters}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,100,100,0.3)', background: 'rgba(255,100,100,0.1)', color: '#ff6666', cursor: 'pointer' }}
        >
          Сбросить фильтры
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{display: "flex", flexDirection: "column", gap: "19px", position: 'fixed', width: '100%', background: 'rgb(17, 17, 19)', left: '0', top: '0', padding: '20px 20px 20px 20px', zIndex: 100}}>
        <div style={{display: 'flex', width: "100%", gap: "10px", alignItems: "center"}}>
        <BackButton onClick={() => navigate('/my-team', { replace: true })} label="Назад" />

          <span style={{ color: 'white', fontSize: '18px', width: '100%'}}>Коллекция</span>

          {/* Кнопка открытия боковой панели фильтров */}
          <button onClick={() => setFiltersOpen(true)} aria-label="Открыть фильтры" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.625 17.7188C23.625 17.2528 23.2472 16.875 22.7812 16.875H17.7188C17.2528 16.875 16.875 17.2528 16.875 17.7188C16.875 18.1847 17.2528 18.5625 17.7188 18.5625H22.7812C23.2472 18.5625 23.625 18.1847 23.625 17.7188Z" fill="white"/>
              <path d="M23.625 12.6562C23.625 12.1903 23.2472 11.8125 22.7812 11.8125H10.9688C10.5028 11.8125 10.125 12.1903 10.125 12.6562C10.125 13.1222 10.5028 13.5 10.9688 13.5H22.7812C23.2472 13.5 23.625 13.1222 23.625 12.6562Z" fill="white"/>
              <path d="M23.625 7.59375C23.625 7.12776 23.2472 6.75 22.7812 6.75H4.21875C3.75276 6.75 3.375 7.12776 3.375 7.59375C3.375 8.05974 3.75276 8.4375 4.21875 8.4375H22.7812C23.2472 8.4375 23.625 8.05974 23.625 7.59375Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Основной контент: сетка карточек */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: 12,
        marginTop: 60
      }}>
        {filteredAndSortedCards.length === 0 && (
          <div style={{ color: '#888', gridColumn: '1 / -1', textAlign: 'center', padding: 20 }}>
            {owned.length === 0 ? 'Коллекция пуста' : 'Нет карточек, соответствующих фильтрам'}
          </div>
        )}

        {filteredAndSortedCards.map(card => (
          <div key={card.id} style={{ padding: 8, borderRadius: 12, textAlign: "center", color: '#fff', position: 'relative', cursor: 'pointer' }} onClick={() => handleCardClick(card.id)}>
            <img src={card.image} alt={card.name} style={{ width: "100%", objectFit: 'cover', borderRadius: 8, display: 'block' }} onError={(e) => { e.target.onerror = null; e.target.src = '/assets/cards/unknown.png'; }} />

            {/* бейдж дубликатов */}
            {card.count > 1 && (
              <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 12, padding: '2px 6px', borderRadius: 10, minWidth: 22, textAlign: 'center' }}>
                ×{card.count}
              </div>
            )}

            {/* информация под карточкой */}
            <div style={{ marginTop: 6, fontSize: 12, textAlign: 'center' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Боковая панель фильтров и оверлей */}
      {/* Overlay */}
      {filtersOpen && (
        <div onClick={() => setFiltersOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
      )}

      {/* Side panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 'min(280px, 92vw)',
        background: 'rgb(17,17,19)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.6)',
        transform: filtersOpen ? 'translateX(0)' : 'translateX(105%)',
        transition: 'transform 560ms cubic-bezier(.2,.9,.2,1)',
        zIndex: 300,
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ color: '#fff', fontSize: 16 }}>Фильтры</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setFiltersOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
        </div>

        {renderFilters()}
      </div>

    </div>
  );
}
