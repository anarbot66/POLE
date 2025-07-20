// NotificationsPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../../../firebase";
import "./NotificationsPanel.css";
import { driverTranslations } from "../../pilots/driverDetails/constants";
import { useNavigate } from "react-router-dom";

const NotificationsPanel = ({ userId, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const startYRef = useRef(0);

  // Блокируем скролл фона, пока панель открыта
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Фокус на панели и слушатель ESC
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = e => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Свайп вверх/вниз на панели
  useEffect(() => {
    if (!panelRef.current) return;
    const panel = panelRef.current;
    const onTouchStart = e => {
      startYRef.current = e.touches[0].clientY;
    };
    const onTouchEnd = e => {
      const delta = e.changedTouches[0].clientY - startYRef.current;
      if (delta > 50) {
        // свайп вниз
        onClose();
      } else if (delta < -50) {
        // свайп вверх
        onClose();
      }
    };
    panel.addEventListener("touchstart", onTouchStart);
    panel.addEventListener("touchend", onTouchEnd);
    return () => {
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchend", onTouchEnd);
    };
  }, [onClose]);

  const getPilotUrl = (name, driverId) => {
  if (driverId === "max_verstappen") return "/pilot-details/verstappen";
  if (driverId === "verstappen") return "/pilot-details/verstappen";
  if (driverId === "hülkenberg") {
    return "/pilot-details/" +
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")
        .toLowerCase();
  }
  return `/pilot-details/${driverId}`;
};


  // Загрузка уведомлений
  useEffect(() => {
    if (!isOpen) return;
    const loadAll = async () => {
      setLoading(true);
      try {
        const qPilots = query(
          collection(db, "favorites"),
          where("userId", "==", userId)
        );
        const snapPilots = await getDocs(qPilots);
        const favPilotIds = snapPilots.docs.map(d => d.data().pilotId);

        const qTeams = query(
          collection(db, "favoritesConstructors"),
          where("userId", "==", userId)
        );
        const snapTeams = await getDocs(qTeams);
        const favTeamIds = snapTeams.docs.map(d => d.data().constructorId);

        const res = await fetch(
          "https://api.jolpi.ca/ergast/f1/current/last/results.json"
        );
        const json = await res.json();
        const race = json.MRData.RaceTable.Races[0];
        const results = race?.Results || [];
        const locality = race.Circuit.Location.locality;
        const notifs = [];

        favPilotIds.forEach(pid => {
          // простая замена только для max_verstappen
          const searchId = pid === "verstappen" ? "max_verstappen" : pid;
  
          const r = results.find(x => x.Driver.driverId === searchId);
          if (r) {
            const orig = r.Driver.familyName;
            const translated = driverTranslations[orig] || orig;
            notifs.push({
              key: `pilot-${pid}`,
              type: "pilot",
              driverId: pid,
              translatedName: translated,
              suffix: ` финишировал P${r.position} на ${locality}`
            });
          } else {
            // логируем подробно, чего не хватает
            console.warn(
              `[NotificationsPanel] Не найден результат для pilotId="${pid}" (ищем по "${searchId}")`,
              {
                allDriverIds: results.map(x => x.Driver.driverId)
              }
            );
          }
        });
        
        
        

        favTeamIds.forEach(tid => {
          const pts = results
            .filter(x => x.Constructor.constructorId === tid)
            .reduce((sum, x) => sum + +x.points, 0);
          if (pts > 0) {
            const name = results.find(
              x => x.Constructor.constructorId === tid
            ).Constructor.name;
            notifs.push({
              key: `team-${tid}`,
              text: `${name} заработали ${pts} очков на ${locality}`
            });
          }
        });

        if (!notifs.length) {
          notifs.push({
            key: "none",
            text: `По вашим фаворитам нет данных за ${locality}`
          });
        }

        setNotifications(notifs);
      } catch (err) {
        console.error(err);
        setNotifications([{ key: "err", text: "Ошибка загрузки уведомлений" }]);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [isOpen, userId]);

  return (
    <>
      {/* затемнённый фон */}
      <CSSTransition in={isOpen} timeout={300} classNames="fade" unmountOnExit>
        <div className="glass" onClick={onClose} />
      </CSSTransition>

      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames="slideDown"
        unmountOnExit
        nodeRef={panelRef}
      >
        <div
          ref={panelRef}
          className="glass notifications-panel"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >

          <div className="header">
            <h3>Уведомления</h3>
            <button onClick={onClose} aria-label="Закрыть">×</button>
          </div>


          {!loading &&
  notifications.map(n => {
    // Если это уведомление о пилоте — рендерим ссылку с переводом
    if (n.type === "pilot") {
      return (
        <div key={n.key} className="notification-item">
          <p>
            <span
              className="driver-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(getPilotUrl(n.fullName, n.driverId))}

            >
              {n.translatedName}
            </span>
            {n.suffix}
          </p>
        </div>
      );
    }

    // Для любого другого уведомления (team, none, err и т.п.) — выводим просто текст
    return (
      <div key={n.key} className="notification-item">
        <p>{n.text}</p>
      </div>
    );
  })}


          <div className="handle" />
        </div>
              

      </CSSTransition>
    </>
  );
};

export default NotificationsPanel;
