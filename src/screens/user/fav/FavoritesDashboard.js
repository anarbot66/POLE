// FavoritesDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import { useSwipeable } from "react-swipeable";
import { CSSTransition, TransitionGroup } from "react-transition-group";

import NewPilotCard from "./NewPilotCard";
import NewConstructorCard from "./NewConstructorCard";

const FavoritesDashboard = ({ currentUser }) => {
  const [pilotResults, setPilotResults] = useState([]);
  const [teamResults, setTeamResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pilots");
  const tabs = ["pilots", "constructors"];
  const userId = currentUser.uid;

  const goPrev = () => {
    const i = tabs.indexOf(activeTab);
    setActiveTab(tabs[(i - 1 + tabs.length) % tabs.length]);
  };
  const goNext = () => {
    const i = tabs.indexOf(activeTab);
    setActiveTab(tabs[(i + 1) % tabs.length]);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => goNext(),
    onSwipedRight: () => goPrev(),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true
  });

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      try {
        // 1) Fetch favorite pilots & teams
        const [pilotsSnap, teamsSnap] = await Promise.all([
          getDocs(query(collection(db, "favorites"), where("userId", "==", userId))),
          getDocs(query(collection(db, "favoritesConstructors"), where("userId", "==", userId)))
        ]);
        const favPilotIds = pilotsSnap.docs.map(d => d.data().pilotId);
        const favTeamIds = teamsSnap.docs.map(d => d.data().constructorId);

        // 2) Fetch last race results
        const res = await fetch("https://api.jolpi.ca/ergast/f1/current/last/results.json");
        const json = await res.json();
        const race = json.MRData.RaceTable.Races[0] || {};
        const results = race.Results || [];
        const locality = race.Circuit?.Location?.locality || "—";

        // 3) Build and sort pilot cards data by points descending
        const pr = favPilotIds
          .map(pid => {
            const searchId = pid === "verstappen" ? "max_verstappen" : pid;
            const r = results.find(x => x.Driver.driverId === searchId);
            if (!r) return null;
            return {
              key: pid,
              position: Number(r.position),
              points: Number(r.points),
              suffix: `финишировал P${r.position} на ${locality}`,
              Driver: {
                givenName: r.Driver.givenName,
                familyName: r.Driver.familyName,
                nationality: r.Driver.nationality
              },
              Constructors: [{ name: r.Constructor.name }],
              onClick: () =>
                navigate(`/pilot-details/${pid === "max_verstappen" ? "verstappen" : pid}`)
            };
          })
          .filter(Boolean);

        pr.sort((a, b) => b.points - a.points);

        // 4) Build constructor cards data
        const tr = favTeamIds
          .map(tid => {
            const teamRes = results.filter(r => r.Constructor.constructorId === tid);
            if (!teamRes.length) return null;
            const pts = teamRes.reduce((sum, r) => sum + +r.points, 0);
            const name = teamRes[0].Constructor.name;
            return {
              key: tid,
              points: pts,
              suffix: `${name} заработали ${pts} очков на ${locality}`,
              Constructor: { name },
              drivers: teamRes.map(r => ({
                Driver: { givenName: r.Driver.givenName, familyName: r.Driver.familyName },
                Constructors: [{ name: r.Constructor.name }]
              }))
            };
          })
          .filter(Boolean);

        setPilotResults(pr);
        setTeamResults(tr);
      } catch (err) {
        console.error("Ошибка при загрузке фаворитов:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [userId, navigate]);

  if (loading) {
    return <p>Загрузка ваших фаворитов…</p>;
  }

  if (!pilotResults.length && !teamResults.length) {
    return <p>У вас пока нет сохранённых результатов.</p>;
  }

  return (
    <div>
      {/* Tab buttons */}
      <div
        className="buttonGlass"
        style={{
          borderRadius: 15,
          position: "fixed",
          width: "calc(100% - 30px)",
          top: 85,
          left: 15,
          right: 15,
          padding: 15
        }}
      >
        <div style={{ display: "flex", borderRadius: 20 }}>
          <button
            onClick={() => setActiveTab("pilots")}
            style={{
              padding: "10px 20px",
              flex: 1,
              boxShadow:
                activeTab === "pilots"
                  ? "0 0 0 1px rgba(255,255,255,0.2)"
                  : "none",
              color: "white",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Пилоты
          </button>
          <button
            onClick={() => setActiveTab("constructors")}
            style={{
              padding: "10px 20px",
              flex: 1,
              boxShadow:
                activeTab === "constructors"
                  ? "0 0 0 1px rgba(255,255,255,0.2)"
                  : "none",
              color: "white",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Команды
          </button>
        </div>
      </div>

      {/* Swipeable content */}
      <TransitionGroup>
        <CSSTransition key={activeTab} classNames="tab" timeout={400}>
          <div
            {...swipeHandlers}
            style={{ padding: 15, marginTop: 155, marginBottom: 100 }}
          >
            {activeTab === "pilots" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 15
                }}
              >
                {pilotResults.map(p => (
                  <NewPilotCard
                    key={p.key}
                    pilot={p}
                    onClick={p.onClick}
                    suffix={p.suffix}
                  />
                ))}
              </div>
            )}
            {activeTab === "constructors" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 15
                }}
              >
                {teamResults.map(t => (
                  <NewConstructorCard
                    key={t.key}
                    constructor={t}
                    drivers={t.drivers}
                    onClick={t.onClick}
                    suffix={t.suffix}
                  />
                ))}
              </div>
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
};

export default FavoritesDashboard;
