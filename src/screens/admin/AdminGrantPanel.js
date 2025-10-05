// src/components/AdminGrantPanel.jsx
import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  runTransaction,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

function genInstanceUid() {
  return `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminGrantPanel({ currentUser }) {
  const [username, setUsername] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [packIdToGrant, setPackIdToGrant] = useState("");
  const [apexDelta, setApexDelta] = useState(0);
  const [fantasyDelta, setFantasyDelta] = useState(0);
  const [gsDelta, setGsDelta] = useState(0);

  const lastLoadedUserIdRef = useRef(null);

  const [isTsar, setIsTsar] = useState(false);

  useEffect(() => {
    if (!currentUser) return setIsTsar(false);
    setIsTsar(currentUser.role === "tsar");
  }, [currentUser]);

  // Поиск пользователя по username
  const findUserByUsername = useCallback(async () => {
    if (!isTsar) {
      setError("Недостаточно прав (требуется tsar)");
      return;
    }

    setError(null);
    setFoundUser(null);
    if (!username?.trim()) { setError("Введите username"); return; }
    setLoading(true);
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("username", "==", username.trim()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("Пользователь не найден");
        setFoundUser(null);
      } else {
        const docSnap = snap.docs[0];
        setFoundUser({ id: docSnap.id, data: docSnap.data() });
        lastLoadedUserIdRef.current = docSnap.id;
      }
    } catch (e) {
      console.error("findUserByUsername", e);
      setError("Ошибка при поиске пользователя");
    } finally {
      setLoading(false);
    }
  }, [username, isTsar]);

  // Универсальная транзакция — выдача пака и валюты
  const grantPackAndCurrencyToUsername = useCallback(async ({
    packId = null,
    apex = 0,
    fantasy = 0,
    gs = 0,
    source = "admin",
  } = {}) => {
    if (!isTsar) {
      setError("Недостаточно прав (требуется tsar)");
      return;
    }

    if (!username?.trim()) { setError("Введите username"); return; }
    setLoading(true);

    try {
      // Найти пользователя
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("username", "==", username.trim()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("Пользователь не найден");
        setLoading(false);
        return;
      }
      const userDoc = snap.docs[0];
      const userRef = doc(db, "users", userDoc.id);

      const instance = packId ? {
        uid: genInstanceUid(),
        packId,
        acquiredAt: new Date().toISOString(),
        source
      } : null;

      await runTransaction(db, async (tx) => {
        const s = await tx.get(userRef);
        if (!s.exists()) throw new Error("Документ пользователя исчез в транзакции");
        const data = s.data();

        const arr = Array.isArray(data.ownedPacks) ? data.ownedPacks.slice() : [];
        if (instance) arr.push(instance);

        const curApex = typeof data.apexPoints === "number" ? data.apexPoints : 0;
        const curFantasy = typeof data.fantasyPoints === "number" ? data.fantasyPoints : 0;
        const curGs = typeof data.gsCurrency === "number" ? data.gsCurrency : 0;

        tx.update(userRef, {
          ownedPacks: arr,
          apexPoints: curApex + Number(apex || 0),
          fantasyPoints: curFantasy + Number(fantasy || 0),
          gsCurrency: curGs + Number(gs || 0),
        });
      });

      // adminLogs
      try {
        const logsCol = collection(db, "adminLogs");
        await addDoc(logsCol, {
          username: username.trim(),
          userId: userDoc.id,
          adminId: currentUser.uid,
          adminRole: "tsar",
          action: "grantPackAndCurrency",
          packInstance: instance || null,
          deltas: { apex: Number(apex || 0), fantasy: Number(fantasy || 0), gs: Number(gs || 0) },
          adminAt: new Date().toISOString()
        });
      } catch (logErr) {
        console.error("Не удалось записать лог admin", logErr);
      }

      if (lastLoadedUserIdRef.current === userDoc.id) {
        setFoundUser((prev) => {
          if (!prev) return prev;
          const newData = { ...prev.data };
          newData.apexPoints = (typeof newData.apexPoints === "number" ? newData.apexPoints : 0) + Number(apex || 0);
          newData.fantasyPoints = (typeof newData.fantasyPoints === "number" ? newData.fantasyPoints : 0) + Number(fantasy || 0);
          newData.gsCurrency = (typeof newData.gsCurrency === "number" ? newData.gsCurrency : 0) + Number(gs || 0);
          if (instance) {
            newData.ownedPacks = Array.isArray(newData.ownedPacks) ? [...newData.ownedPacks, instance] : [instance];
          }
          return { ...prev, data: newData };
        });
      }

      setError(null);
      alert("Операция выполнена успешно");
    } catch (e) {
      console.error("grantPackAndCurrencyToUsername", e);
      setError(e.message || "Не удалось выполнить операцию");
    } finally {
      setLoading(false);
    }
  }, [username, currentUser, isTsar]);

  const onGrantPackClick = async () => {
    if (!packIdToGrant?.trim()) { setError("packId пустой"); return; }
    await grantPackAndCurrencyToUsername({ packId: packIdToGrant.trim() });
    setPackIdToGrant("");
  };

  const onGrantCurrencyClick = async () => {
    const apex = Number(apexDelta) || 0;
    const fantasy = Number(fantasyDelta) || 0;
    const gs = Number(gsDelta) || 0;
    if (apex === 0 && fantasy === 0 && gs === 0) { setError("Укажите хотя бы одну сумму"); return; }
    await grantPackAndCurrencyToUsername({ apex, fantasy, gs });
    setApexDelta(0); setFantasyDelta(0); setGsDelta(0);
  };

  if (!currentUser) return <div>Требуется вход</div>;
  if (!isTsar) return <div style={{ color: "red" }}>Доступ запрещён — требуется роль <b>tsar</b>.</div>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <h2>Admin: выдать пак / валюту</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Username (для поиска)</label><br />
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
        <button onClick={findUserByUsername} disabled={loading} style={{ marginLeft: 8 }}>Найти</button>
      </div>

      {loading && <div>Загрузка...</div>}
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      {foundUser && (
        <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
          <strong>Найден пользователь</strong>
          <div>docId / uid: {foundUser.id}</div>
          <div>username: {foundUser.data.username}</div>
          <div>apexPoints: {foundUser.data.apexPoints ?? 0}</div>
          <div>fantasyPoints: {foundUser.data.fantasyPoints ?? 0}</div>
          <div>gsCurrency: {foundUser.data.gsCurrency ?? 0}</div>
          <div>ownedPacks: {Array.isArray(foundUser.data.ownedPacks) ? foundUser.data.ownedPacks.length : 0}</div>
        </div>
      )}

      <hr />

      <div style={{ marginBottom: 16 }}>
        <h3>Выдать пак</h3>
        <input value={packIdToGrant} onChange={e => setPackIdToGrant(e.target.value)} placeholder="packId" />
        <button onClick={onGrantPackClick} disabled={loading}>Выдать пак</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3>Выдать валюту</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div>
            <label>Apex</label><br />
            <input type="number" value={apexDelta} onChange={e => setApexDelta(e.target.value)} />
          </div>
          <div>
            <label>Fantasy</label><br />
            <input type="number" value={fantasyDelta} onChange={e => setFantasyDelta(e.target.value)} />
          </div>
          <div>
            <label>GS</label><br />
            <input type="number" value={gsDelta} onChange={e => setGsDelta(e.target.value)} />
          </div>
          <div>
            <button onClick={onGrantCurrencyClick} disabled={loading}>Выдать валюту</button>
          </div>
        </div>
      </div>
    </div>
  );
}
