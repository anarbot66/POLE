// src/myteam/MyTeam.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyTeamPreload } from "../hooks/useMyTeamPreload";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import cardsJson from "../myteam/cards/cards.json";
import '../recources/fonts/fonts.css';
import UserStats from "../user/components/UserStats";

const CARDS = (cardsJson && cardsJson.cards) ? cardsJson.cards : [];

const MyTeam = ({ currentUser }) => {
  useMyTeamPreload();
  const navigate = useNavigate();
  const [lastCardName, setLastCardName] = useState("—");
  const [cardsCount, setCardsCount] = useState(0);

  const userId = currentUser?.uid;

  const [activeLots, setActiveLots] = useState(0);
  const [playersWithCards, setPlayersWithCards] = useState(0);

  // Подписка на всех пользователей — считаем, сколько игроков имеют карточки
  useEffect(() => {
    const usersCol = collection(db, "users");
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        usersCol,
        (snapshot) => {
          try {
            const docs = snapshot.docs.map(d => d.data());
            // считаем, у кого есть cards с хотя бы одним ключом со значением > 0
            const count = docs.filter(u => {
              const cards = u?.cards;
              if (!cards) return false;
              if (Array.isArray(cards)) {
                // массив — считаем, есть ли элементы
                return cards.length > 0;
              }
              if (typeof cards === "object") {
                // объект — есть ли ключи с value > 0
                return Object.values(cards).some(v => Number(v || 0) > 0);
              }
              return false;
            }).length;
            setPlayersWithCards(count);
          } catch (e) {
            console.error("users onSnapshot processing error:", e);
          }
        },
        (err) => {
          console.error("users onSnapshot error:", err);
        }
      );
    } catch (e) {
      console.error("users onSnapshot init error:", e);
    }

    return () => {
      try { unsub(); } catch (_) {}
    };
  }, []);

  // Подписка на marketplace — считаем активные лоты
  useEffect(() => {
    const marketplaceCol = collection(db, "marketplace");
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        marketplaceCol,
        (snapshot) => {
          try {
            const active = snapshot.docs.filter(d => d.data()?.status === "active").length;
            setActiveLots(active);
          } catch (e) {
            console.error("marketplace onSnapshot processing error:", e);
          }
        },
        (err) => {
          console.error("marketplace onSnapshot error:", err);
        }
      );
    } catch (e) {
      console.error("marketplace onSnapshot init error:", e);
    }

    return () => {
      try { unsub(); } catch (_) {}
    };
  }, []);

  // Подписка на документ пользователя: lastCard и сумма карточек
  useEffect(() => {
    if (!userId) {
      setLastCardName("—");
      setCardsCount(0);
      return;
    }

    const userRef = doc(db, "users", userId);
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        userRef,
        (snap) => {
          try {
            if (!snap.exists()) {
              setLastCardName("—");
              setCardsCount(0);
              return;
            }
            const data = snap.data();

            // lastCard -> показать имя
            const lastCardId = data.lastCard;
            if (lastCardId) {
              const card = CARDS.find(c => c.id === lastCardId);
              setLastCardName(card ? card.name : "—");
            } else {
              setLastCardName("—");
            }

            // Сумма всех карточек: поддерживаем разные форматы (object / array)
            const cardsObj = data.cards || {};
            let totalCards = 0;
            if (Array.isArray(cardsObj)) {
              // массив случаев: подсчитываем суммарно представленное поле count или 1 на элемент
              totalCards = cardsObj.reduce((acc, it) => {
                if (!it) return acc;
                if (typeof it === "object") return acc + (Number(it.count) || 0);
                return acc + 1;
              }, 0);
            } else if (cardsObj && typeof cardsObj === "object") {
              totalCards = Object.values(cardsObj).reduce((acc, val) => acc + (Number(val) || 0), 0);
            } else {
              totalCards = 0;
            }
            setCardsCount(totalCards);
          } catch (e) {
            console.error("user doc onSnapshot processing error:", e);
          }
        },
        (err) => {
          console.error("user doc onSnapshot error:", err);
        }
      );
    } catch (e) {
      console.error("user doc onSnapshot init error:", e);
    }

    return () => {
      try { unsub(); } catch (_) {}
    };
  }, [userId]);

  const goBack = () => {
    localStorage.setItem("showBottomNav", "true");
    navigate("/standings");
  };

  const containerStyle = {
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: 16,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0d0d0d",
  };

  const cardWrapStyle = {
    width: "100%",
    maxWidth: 420,
    height: "calc(100vh - 32px)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const cardStyle = {
    padding: 15,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    justifyContent: "flex-start",
    cursor: "pointer",
    boxSizing: "border-box",
    flex: "1 1 0",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "white",
  };

  const smallCardStyle = {
    ...cardStyle,
    flex: "0 0 auto",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  };

  const titleStyle = { fontSize: 18, fontWeight: 500 };
  const subtitleStyle = { fontSize: 12, fontWeight: 400 };
  const inlineRow = { display: "flex", alignItems: "center", gap: 10 };

  const backgrounds = {
    events: "/assets/menu/events.png",
    packs: "/assets/menu/packs.png",
    miniGames: "/assets/menu/mini-games.png",
    myTeam: "/assets/menu/team.png",
    collection: "/assets/menu/collection.png",
    marketplace: "/assets/menu/market.png",
    fantasy: "/assets/menu/fantasy.png",
    darkshop: "/assets/menu/darkshop.png",
    leaderboard: "/assets/menu/leaderboard.png",
  };

  return (
    <div style={containerStyle}>
      <div style={cardWrapStyle}>
      {currentUser && <UserStats uid={currentUser.uid} />}
        <div
          role="button"
          style={{
            ...cardStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${backgrounds.events})`,
          }}
          onClick={() => navigate("/events")}
          tabIndex={0}
        >
          <div style={titleStyle}>События</div>
          <div style={subtitleStyle}>
            Истории, мини-игры и множество других событий
          </div>
        </div>

        {/* Наборы */}
        <div
          role="button"
          style={{
            ...cardStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${backgrounds.packs})`,
          }}
          onClick={() => navigate("/pack-opener")}
          tabIndex={0}
        >
          <div style={titleStyle}>Наборы</div>
          <div style={subtitleStyle}>
            Открывайте наборы и пополняйте свою коллекцию карточек
          </div>
        </div>

        {/* Мини-игры */}
        <div
          role="button"
          style={{
            ...cardStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${backgrounds.miniGames})`,
          }}
          onClick={() => navigate("/activity")}
          tabIndex={0}
        >
          <div style={titleStyle}>Мини-игры</div>
          <div style={subtitleStyle}>Зарабатывайте валюту в мини-играх!</div>
        </div>

        {/* Коллекция */}
        <div
          role="button"
          style={{
            ...cardStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${backgrounds.collection})`,
          }}
          onClick={() => navigate("/collection")}
          tabIndex={0}
        >
          <div style={titleStyle}>Коллекция</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={inlineRow}>
              <div style={{ fontSize: 13, color: 'darkgray' }}>Карт в коллекции</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{cardsCount}</div>
            </div>
            <div style={inlineRow}>
              <div style={{ fontSize: 13, color: 'darkgray' }}>Последняя карточка</div>
              <div style={{ fontSize: 13 }}>
                {lastCardName}
              </div>
            </div>
          </div>
        </div>

        {/* Торговая площадка */}
        <div
          role="button"
          style={{
            ...cardStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${backgrounds.marketplace})`,
          }}
          onClick={() => navigate("/marketplace")}
          tabIndex={0}
        >
          <div style={titleStyle}>Торговая площадка</div>
          <div style={inlineRow}>
            <div style={{ fontSize: 13, color: 'darkgray' }}>Всего лотов</div>
            <div style={{ fontSize: 13 }}>{activeLots}</div>
          </div>
        </div>

        <div
          role="button"
          style={{
            ...cardStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${backgrounds.leaderboard})`,
          }}
          onClick={() => navigate("/leaderboard")}
          tabIndex={0}
        >
          <div style={titleStyle}>Таблица лидеров</div>
          <div style={inlineRow}>
            <div style={{ fontSize: 13, color: 'darkgray' }}>Игроков</div>
            <div style={{ fontSize: 13 }}>{playersWithCards}</div>
          </div>
        </div>

        <div
          role="button"
          style={{
            ...cardStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${backgrounds.darkshop})`,
          }}
          onClick={() => navigate("/shop")}
          tabIndex={0}
        >
          <div style={titleStyle}>Тайная лавка</div>
        </div>

        {/* Кнопка выйти */}
        <div style={smallCardStyle}>
          <button
            onClick={goBack}
            style={{
              all: "unset",
              cursor: "pointer",
              background: "transparent",
              fontSize: 14,
              fontWeight: 300,
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            Выйти из MyTeam
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyTeam;
