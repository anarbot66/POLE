// src/pages/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import cardsCatalogJson from "../cards/cards.json";
import logo from '../../recources/images/logo.png';
import BackButton from "../../components/BackButton";
import PickerModal from "../../components/PickerModal";
import { CSSTransition } from "react-transition-group";

export default function Leaderboard({ currentUser }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("collection"); // collection, cardCount, gs, bestRunner
  const [isPickerOpen, setPickerOpen] = useState(false);

  const filterOptions = [
    { name: "Стоимость коллекции", value: "collection" },
    { name: "Количество карт", value: "cardCount" },
    { name: "GS", value: "gs" },
    { name: "Рекорд в Мини-игре «Прямая в Монце»", value: "bestRunner" },
  ];

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

        // цены карточек
        const cardPrices = {};
        cardsCatalogJson.cards.forEach(card => {
          cardPrices[card.id] = card.recomendPrice || 0;
        });

        const usersWithStats = users.map(user => {
          let totalValue = 0;
          let totalCards = 0;
          if (user.cards) {
            for (const [cardId, count] of Object.entries(user.cards)) {
              const price = cardPrices[cardId] || 0;
              totalValue += price * count;
              totalCards += count;
            }
          }
          // ApexPoints и GS берём из пользователя или 0
          const apexPoints = Number(user.apexPoints || 0);
          const gsCurrency = Number(user.gsCurrency || 0);
          const bestRunner = Number(user.bestRunner || 0);

          return {
            ...user,
            collectionValue: totalValue + apexPoints, // совмещаем стоимость и ApexPoints
            cardCount: totalCards,
            gsCurrency,
            bestRunner,
          };
        }).filter(user => user.collectionValue > 0 || user.cardCount > 0 || user.gsCurrency > 0 || user.bestRunner > 0);

        setLeaderboard(usersWithStats);
      } catch (err) {
        console.error("Ошибка при загрузке пользователей:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) return <div> </div>;

  // сортировка по выбранному фильтру
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (filter === "collection") return b.collectionValue - a.collectionValue;
    if (filter === "cardCount") return b.cardCount - a.cardCount;
    if (filter === "gs") return b.gsCurrency - a.gsCurrency;
    if (filter === "bestRunner") return (b.bestRunner || 0) - (a.bestRunner || 0);
    return 0;
  });

  return (
    <div style={{ padding: 15, minHeight: "100vh", boxSizing: "border-box" }}>
      <div style={{background: 'rgb(17, 17, 19)', display: 'flex', flexDirection: 'column', alignItems: "center", position: 'fixed', width: '100%', top: 0, left: 0, zIndex: 10}}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            borderRadius: 15,
            padding: '15px',
            width: '100%',
            flexDirection: 'column'
          }}
        >
          <div style={{display: 'flex', gap: '5px'}}>
            <BackButton />
            <span style={{ color: 'white', width: '100%', fontSize: '18px'}}>
              Таблица лидеров
            </span>
          </div>

          <button
            onClick={() => setPickerOpen(true)}
            style={{
              width: "100%",
              padding: "10px 10px",
              background: "transparent",
              color: "#fff",
              fontSize: "13px",
              fontFamily: "Inter",
              fontWeight: 500,
              cursor: "pointer",
              borderBottom: "1px solid #242424",
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <span style={{ whiteSpace: "nowrap", width: '100%', textAlign: 'left' }}>
              {filterOptions.find(f => f.value === filter)?.name}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.24738 11.1399L2.45115 5.6585C1.88539 5.01192 2.34457 4 3.20373 4H12.7962C13.6554 4 14.1145 5.01192 13.5488 5.6585L8.75254 11.1399C8.35413 11.5952 7.6458 11.5952 7.24738 11.1399Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          marginTop: '100px'
        }}
      >
        {sortedLeaderboard.map((user, index) => (
          <div
            key={user.uid}
            style={{
              color: "#fff",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              transition: "transform 0.2s",
              gap: '20px',
              borderBottom: '1px solid #171717'
            }}
          >
            {/* Аватарка */}
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.username || user.firstName}
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#333" }} />
            )}

            <div>
              <div style={{ fontSize: "16px", textAlign: "left" }}>{user.username || user.firstName}</div>
              <div
                style={{
                  fontSize: "12px",
                  display: "flex",
                  gap: "7px",
                  alignItems: "center",
                }}
              >
                {filter === "collection" && (
                  <>
                    <p style={{color: 'gray', margin: 0}}>Цена команды</p>
                    <div style={{ marginLeft: 6 }}>{Number(user.collectionValue || 0).toLocaleString()}</div>
                    <div style={{ width: "15px", height: "15px" }}>
                      <img src={logo} alt="Логотип" className="logo" />
                    </div>
                  </>
                )}
                {filter === "cardCount" && (
                  <>
                    <p style={{color: 'gray', margin: 0}}>Карт</p>
                    <div style={{ marginLeft: 6 }}>{user.cardCount}</div>
                  </>
                )}
                {filter === "gs" && (
                  <>
                    <p style={{color: 'gray', margin: 0}}>GS</p>
                    <div style={{ marginLeft: 6 }}>{Number(user.gsCurrency || 0).toLocaleString()}</div>
                  </>
                )}
                {filter === "bestRunner" && (
                  <>
                    <p style={{color: 'gray', margin: 0}}>Лучший результат</p>
                    <div style={{ marginLeft: 6 }}>{Number(user.bestRunner || 0).toLocaleString()}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CSSTransition
        in={isPickerOpen}
        timeout={300}
        classNames="window-fade"
        unmountOnExit
        mountOnEnter
        appear
      >
        <PickerModal
          isOpen={isPickerOpen}
          onClose={() => setPickerOpen(false)}
          options={filterOptions}
          onSelect={(value) => setFilter(value)}
          title="Выберите таблицу лидеров"
        />
      </CSSTransition>
    </div>
  );
}
