// ConstructorDetails.js
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import SocialIcons from "../../../screens/recources/SocialIcons";
import seasonsData from "../../recources/json/seasons";
import StatsCard from "./StatsCard";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import {
  TEAM_SOCIAL,
  CONSTRUCTOR_API_NAMES,
  TEAM_COLORS,
  TEAM_BIOGRAPHIES
} from "../../recources/json/constants";
import { useConstructorStats } from "./useConstructorStats";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import FavoriteConstructorButton from "./FavoriteConstructorButton";
import { useSwipeable } from 'react-swipeable';
import SeasonPickerModal from "../../components/SeasonPickerModal";
import BackButton from "../../components/BackButton";
import ConstructorBiography from "./ConstructorBiography";
import ConstructorAchievements from "./ConstructorAchievements";

/**
 * Helpers
 */
const safeString = (v) => (v == null ? "" : String(v));

const safeNameFromCtor = (ctor) => {
  if (!ctor) return "";
  return (
    ctor?.Constructor?.name ||
    ctor?.Constructor?.constructorId ||
    ctor?.constructorId ||
    ctor?.name ||
    ctor?._raw?.Constructor?.name ||
    ""
  );
};

const normalizeForKey = (name = "") =>
  safeString(name).toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9а-яё]/gi, "");

const normalizeIdForDoc = (name = "") =>
  safeString(name).toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9а-яё_]/gi, "");

/**
 * Конструктор компонента
 */
const ConstructorDetails = ({ constructor: constructorProp, currentUser }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // effectiveConstructor — единый источник правды внутри компонента
  // Инициализируем минимальным объектом, если есть id.
  const initialCtorFromState = constructorProp || location.state?.constructor || null;
  const [effectiveConstructor, setEffectiveConstructor] = useState(() => {
    if (initialCtorFromState) return initialCtorFromState;
    if (id) {
      return {
        position: null,
        points: null,
        wins: 0,
        Constructor: {
          name: id,
          constructorId: id,
          url: ""
        },
        _raw: null
      };
    }
    return null;
  });

  // loading flag
  const [loadingCtor, setLoadingCtor] = useState(!initialCtorFromState && !!id);

  const [activeTab, setActiveTab] = useState("biography");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [seasons, setSeasons] = useState([]);
  const tabs = ['biography','seasons', 'social', 'achievements'];
  const labels = { biography: 'Биография', seasons: 'Сезоны', social: 'Соц.Сети' };
  const [pickerOpen, setPickerOpen] = useState(false);

  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const bioRef = useRef(null);
  const seasonsRef = useRef(null);
  const socialRef = useRef(null);
  const achievementsRef = useRef(null);

  useLayoutEffect(() => {
    const updateUnderline = () => {
      let ref;
      if (activeTab === "biography") ref = bioRef;
      if (activeTab === "seasons") ref = seasonsRef;
      if (activeTab === "social") ref = socialRef;
      if (activeTab === "achievements") ref = achievementsRef;
  
      if (ref?.current) {
        const { offsetLeft, offsetWidth } = ref.current;
        setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
      }
    };
  
    requestAnimationFrame(updateUnderline); // ждем, пока браузер нарисует DOM
    window.addEventListener("resize", updateUnderline);
    return () => window.removeEventListener("resize", updateUnderline);
  }, [activeTab, bioRef.current, seasonsRef.current, socialRef.current, achievementsRef.current]);

  const tabsContainerRef = useRef(null);
  const tabsOrder = ['biography','seasons', 'social', 'achievements'];

  useEffect(() => {
    if (!tabsContainerRef.current) return;
  
    // словарь с рефами (используем твои рефы)
    const tabRefs = {
      biography: bioRef,
      seasons: seasonsRef,
      social: socialRef,
      achievements: achievementsRef
    };
  
    const currentRef = tabRefs[activeTab];
    if (!currentRef || !currentRef.current) return;
  
    const idx = tabsOrder.indexOf(activeTab);
    const isLast = idx === tabsOrder.length - 1;
  
    // Для последней — прижать к правой границе контейнера,
    // для остальных — к левой (чтобы "блок сдвигался влево" когда выбирают последний)
    const inlineOpt = isLast ? "end" : "start";
  
    // smooth прокрутка
    try {
      currentRef.current.scrollIntoView({ behavior: "smooth", inline: inlineOpt, block: "nearest" });
    } catch (e) {
      // fallback для старых браузеров: ручной подсчёт
      const btnRect = currentRef.current.getBoundingClientRect();
      const contRect = tabsContainerRef.current.getBoundingClientRect();
      if (btnRect.right > contRect.right) {
        tabsContainerRef.current.scrollLeft += btnRect.right - contRect.right;
      } else if (btnRect.left < contRect.left) {
        tabsContainerRef.current.scrollLeft -= contRect.left - btnRect.left;
      }
    }
  }, [activeTab]); // запускается при изменении activeTab

  // избранное
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);

  const currentYear = new Date().getFullYear().toString();

  // Если проп constructorProp пришёл позже — обновляем effectiveConstructor
  useEffect(() => {
    if (constructorProp) {
      setEffectiveConstructor(constructorProp);
      setLoadingCtor(false);
    }
  }, [constructorProp]);

  // Если навигировали с state (navigate(..., { state: { constructor } })) — используем его (если еще нет)
  useEffect(() => {
    const stateCtor = location.state?.constructor;
    if (!effectiveConstructor && stateCtor) {
      setEffectiveConstructor(stateCtor);
      setLoadingCtor(false);
    }
  }, [location.state, effectiveConstructor]);

  // Функция загрузки standings — пробуем базовый URL и fallback с .json
  const fetchStandings = async (season = currentYear) => {
    // предпочтительный URL — можно менять под нужный сезон
    const base = `https://api.jolpi.ca/ergast/f1/${season}/constructorstandings/`;
    const tryUrls = [base, `${base}.json`, `${base}index.json`];

    let lastErr = null;
    for (const u of tryUrls) {
      try {
        const resp = await fetch(u);
        if (!resp.ok) {
          lastErr = new Error(`Fetch ${u} returned ${resp.status}`);
          continue;
        }
        const json = await resp.json();
        return json;
      } catch (err) {
        lastErr = err;
        // try next
      }
    }
    throw lastErr || new Error("Не удалось получить standings");
  };

  // Основной эффект: если у нас нет полных данных (_raw) — грузим по id
  useEffect(() => {
    // Если нет id — ничего не делаем
    if (!id) {
      setLoadingCtor(false);
      return;
    }

    // Если у effectiveConstructor уже есть _raw (полные данные) — не грузим
    if (effectiveConstructor && effectiveConstructor._raw) {
      setLoadingCtor(false);
      return;
    }

    let mounted = true;
    const run = async () => {
      setLoadingCtor(true);
      try {
        // подставляем текущий год; можно параметризовать
        const season = currentYear;
        const json = await fetchStandings(season);
        // путь в ответе Ergast-like:
        const list = json?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

        // попытка найти по constructorId или по слагу имени
        const cleanedParam = normalizeForKey(id);
        const found = list.find(c => {
          const cid = safeString(c?.Constructor?.constructorId).toLowerCase();
          if (cid === String(id).toLowerCase()) return true;
          // слаг из имени
          const slug = normalizeForKey(c?.Constructor?.name || "");
          if (slug === cleanedParam) return true;
          // также сравним с без-подчёркивания вариантом
          const flatId = String(id).toLowerCase().replace(/[^a-z0-9]/gi, "");
          if (slug === flatId) return true;
          return false;
        });

        if (!mounted) return;

        if (found) {
          const normalized = {
            position: found.position ?? null,
            points: found.points ?? null,
            wins: found.wins ?? 0,
            Constructor: {
              name: found.Constructor?.name ?? safeString(id),
              constructorId: found.Constructor?.constructorId ?? safeString(id),
              url: found.Constructor?.url ?? ""
            },
            _raw: found
          };
          setEffectiveConstructor(normalized);
        } else {
          // Если не нашли — оставляем минимальный объект, но обновляем имя/constructorId
          setEffectiveConstructor(prev => ({
            ...(prev || {}),
            position: prev?.position ?? null,
            points: prev?.points ?? null,
            wins: prev?.wins ?? 0,
            Constructor: {
              name: prev?.Constructor?.name || id,
              constructorId: prev?.Constructor?.constructorId || id,
              url: ""
            },
            _raw: null
          }));
        }
      } catch (err) {
        console.error("Ошибка загрузки standings:", err);
        if (!mounted) return;
        // оставляем минимальный объект (уже установлен), просто выключаем loading
      } finally {
        if (mounted) setLoadingCtor(false);
      }
    };

    run();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Хуки статистики — useConstructorStats должен корректно обрабатывать null/минимальный объект
  const statsCurrent = useConstructorStats(effectiveConstructor, currentYear)?.stats ?? {};
  const statsSelected = useConstructorStats(effectiveConstructor, selectedYear)?.stats ?? {};

  // Подготовка сезонов (когда effectiveConstructor доступен)
  useEffect(() => {
    if (!effectiveConstructor) return;
    const name = safeNameFromCtor(effectiveConstructor);
    const formattedConstructorName =
      CONSTRUCTOR_API_NAMES[name] ||
      safeString(name).toLowerCase().replace(/\s+/g, "");
    setSeasons(seasonsData[formattedConstructorName] || []);
  }, [effectiveConstructor]);

  // Проверка избранного (только когда есть effectiveConstructor и currentUser)
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser?.uid || !effectiveConstructor) {
        setIsFavorite(false);
        return;
      }
      try {
        const name = safeNameFromCtor(effectiveConstructor);
        const formattedConstructorName =
          CONSTRUCTOR_API_NAMES[name] ||
          normalizeIdForDoc(name);
        const favDocRef = doc(db, "favoritesConstructors", `${currentUser.uid}_${formattedConstructorName}`);
        const favDoc = await getDoc(favDocRef);
        setIsFavorite(!!favDoc.exists());
      } catch (error) {
        console.error("Ошибка проверки избранного конструктора:", error);
      }
    };
    checkFavoriteStatus();
  }, [currentUser, effectiveConstructor]);

  // Favorite add / remove (используем effectiveConstructor)
  const handleFavorite = async () => {
    if (!currentUser || !effectiveConstructor) return;
    try {
      const favCollRef = collection(db, "favoritesConstructors");
      const q = query(favCollRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length >= 3) {
        setShowFavoriteAlert(true);
        return;
      }
      setFavLoading(true);
      const name = safeNameFromCtor(effectiveConstructor);
      const formattedConstructorName =
        CONSTRUCTOR_API_NAMES[name] ||
        normalizeIdForDoc(name);
      const favDocRef = doc(db, "favoritesConstructors", `${currentUser.uid}_${formattedConstructorName}`);
      await setDoc(favDocRef, {
        userId: currentUser.uid,
        constructorId: formattedConstructorName,
        createdAt: new Date()
      });
      setIsFavorite(true);
    } catch (error) {
      console.error("Ошибка при добавлении конструктора в избранное:", error);
    }
    setFavLoading(false);
  };

  const handleUnfavorite = async () => {
    if (!currentUser || !effectiveConstructor) return;
    setFavLoading(true);
    try {
      const name = safeNameFromCtor(effectiveConstructor);
      const formattedConstructorName =
        CONSTRUCTOR_API_NAMES[name] ||
        normalizeIdForDoc(name);
      const favDocRef = doc(db, "favoritesConstructors", `${currentUser.uid}_${formattedConstructorName}`);
      await deleteDoc(favDocRef);
      setIsFavorite(false);
    } catch (error) {
      console.error("Ошибка при удалении конструктора из избранного:", error);
    }
    setFavLoading(false);
  };

  const goPrev = () => {
    const i = tabs.indexOf(activeTab);
    const prev = tabs[(i - 1 + tabs.length) % tabs.length];
    setActiveTab(prev);
  };
  const goNext = () => {
    const i = tabs.indexOf(activeTab);
    const next = tabs[(i + 1) % tabs.length];
    setActiveTab(next);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => goNext(),
    onSwipedRight: () => goPrev(),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true
  });

  // Пока загружаем конструктор — показываем простой индикатор
  if (loadingCtor) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>;
  }

  if (!effectiveConstructor) {
    return <div>Конструктор не найден.</div>;
  }

  // безопасные готовые поля
  const ctorName = safeNameFromCtor(effectiveConstructor) || "unknown_constructor";
  const socialLinks = TEAM_SOCIAL[ctorName] || TEAM_SOCIAL[effectiveConstructor?.Constructor?.name] || null;
  const teamColor = TEAM_COLORS[ctorName] || TEAM_COLORS[effectiveConstructor?.Constructor?.name] || "#000000";
  const biography = TEAM_BIOGRAPHIES[ctorName] 
  || TEAM_BIOGRAPHIES[effectiveConstructor?.Constructor?.name] 
  || null;

// Теперь вытаскиваем части отдельно
const create = biography?.childhood || biography?.create || "Данных не найдено";
const peak = biography?.waytoformula || biography?.peak || "Данных не найдено";
const now = biography?.career || biography?.now || "Данных не найдено";

  return (
    <div>
      <div style={{
      height: "100%",
      marginBottom: "65px",
      overflowY: "auto",
      borderRadius: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "19px",
      marginTop: "10px"
    }}
    >

<div style={{display: "flex",
        flexDirection: "column",
        gap: "19px", position: 'fixed', width: '100%', background: 'rgb(17, 17, 19)', left: '0', top: '0', padding: '20px 20px 0px 20px'}}>
      <div style={{display: 'flex', width: "100%"}}>
      <BackButton
        label="Назад"
        style={{width: '100%'}}
      />

      <FavoriteConstructorButton
          currentUser={currentUser}
          constructor={effectiveConstructor}
        />

      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: teamColor, fontSize: "16px", fontFamily: "Inter" }}>
            {effectiveConstructor?.Constructor?.name ?? ctorName}
          </div>
        </div>

      </div>

      {/* Статистика конструктора за текущий сезон */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "12px",
          width: "100%"
        }}
      >
        <StatsCard label="ПОЗИЦИЯ" value={statsCurrent?.position ?? "—"} />
        <StatsCard label="ОЧКОВ" value={statsCurrent?.points ?? "—"} />
        <StatsCard label="ПОБЕД" value={statsCurrent?.wins ?? 0} />
        <StatsCard label="ПОДИУМОВ" value={statsCurrent?.podiums ?? 0} />
        <StatsCard label="ПОУЛОВ" value={statsCurrent?.poles ?? 0} />
      </div>

      <div
  ref={tabsContainerRef}
  style={{
    position: "relative",
    display: "flex",
    gap: "19px",
    overflowX: "auto",           // главное: делаем контейнер скроллируемым
    WebkitOverflowScrolling: "touch",
    whiteSpace: "nowrap",        // чтобы
    overflowX: "auto",
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE/Edge
  }}
>
      <button
        ref={bioRef}
        onClick={() => setActiveTab("biography")}
        style={{
          padding: "10px 5px",
          color: activeTab === "biography" ? "white" : "var(--col-darkGray)",
          background: activeTab === "biography" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Биография
      </button>

      <button
        ref={seasonsRef}
        onClick={() => setActiveTab("seasons")}
        style={{
          padding: "10px 5px",
          color: activeTab === "seasons" ? "white" : "var(--col-darkGray)",
          background: activeTab === "seasons" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Сезоны
      </button>

      <button
        ref={socialRef}
        onClick={() => setActiveTab("social")}
        style={{
          padding: "10px 5px",
          color: activeTab === "social" ? "white" : "var(--col-darkGray)",
          background: activeTab === "social" ? "rgb(17, 17, 19)" : "transparent",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "color 0.3s ease, background 0.3s ease",
          fontSize: 14,
        }}
      >
        Ссылки
      </button>

      <button
    ref={achievementsRef}
    onClick={() => setActiveTab("achievements")}
    style={{
      padding: "10px 5px",
      color: activeTab === "achievements" ? "white" : "var(--col-darkGray)",
      background: activeTab === "achievements" ? "rgb(17, 17, 19)" : "transparent",
      borderRadius: "10px",
      cursor: "pointer",
      transition: "color 0.3s ease, background 0.3s ease",
      fontSize: 14,
      whiteSpace: "nowrap"
    }}
  >
    Достижения
  </button>

      {/* Полоска */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: underlineStyle.left,
          height: "3px",
          width: underlineStyle.width,
          backgroundColor: "blue",
          borderRadius: "2px",
          transition: "left 0.3s ease, width 0.3s ease",
          pointerEvents: "none",
        }}
      />
    </div>

      </div>

      <div style={{ width: "100%" }}>

        <TransitionGroup>
          <CSSTransition key={activeTab} classNames="tab" timeout={400}>
          <div style={{marginTop: '200px'}} {...swipeHandlers} className="">
              {activeTab === "biography" && (
                <div style={{padding: '15px'}}>
                <ConstructorBiography
                create={create}
                peak={peak}
                now={now}
              />
                </div>
              )}

              {activeTab === "seasons" && (
                <div style={{ marginTop: "20px", width: "100%" }}>
                  <button
      onClick={() => setPickerOpen(true)}
      style={{
        width: "100%",
        padding: "15px 20px",
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
                    <span style={{width: "100%", textAlign: "left"}}>Сезон {selectedYear || "Выберите сезон"}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.24738 11.1399L2.45115 5.6585C1.88539 5.01192 2.34457 4 3.20373 4H12.7962C13.6554 4 14.1145 5.01192 13.5488 5.6585L8.75254 11.1399C8.35413 11.5952 7.6458 11.5952 7.24738 11.1399Z" fill="white"/>
</svg>
                  </button>

                  <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: "12px",
          padding: '20px',
          background: '#141416',
          borderRadius: '15px',
          margin: '15px'
        }}
      >
                    <StatsCard label="ПОЗИЦИЯ" value={statsSelected?.position ?? "—"} />
                    <StatsCard label="ОЧКОВ" value={statsSelected?.points ?? "—"} />
                    <StatsCard label="ПОБЕД" value={statsSelected?.wins ?? 0} />
                    <StatsCard label="ПОДИУМОВ" value={statsSelected?.podiums ?? 0} />
                    <StatsCard label="ПОУЛОВ" value={statsSelected?.poles ?? 0} />
                  </div>
                </div>
              )}

              {activeTab === "social" && (
                <div style={{padding: '15px'}}>
                  <div style={{background: '#141416', padding: '20px', borderRadius: '15px'}}>
                  {socialLinks && <SocialIcons social={socialLinks} />}
                </div>
                </div>
              )}
              {activeTab === "achievements" && (
  <div style={{
    padding: '15px',
  }}>
    <ConstructorAchievements
  constructorName={id}
/>
  </div>
)}
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>


      <CSSTransition in={pickerOpen} timeout={300} classNames="window-fade" unmountOnExit mountOnEnter appear>
        <SeasonPickerModal
          seasons={seasons}
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(year) => setSelectedYear(year)}
          type={"constructor"}
        />
      </CSSTransition>
      </div>
    </div>
  );
};

export default ConstructorDetails;
