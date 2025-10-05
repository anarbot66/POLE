import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

import { db } from '../../../firebase';
import cardsJson from '../cards/cards.json';

// Компонент для выбора 2 пилотов и сохранения состава
export default function TeamBuilder({ currentUser }) {
  const uid = currentUser?.uid;
  const [owned, setOwned] = useState([]); // { id, name, image, rtg, count, rarity }
  const [selected, setSelected] = useState([]); // массив id
  const [teamName, setTeamName] = useState('');
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState([]);

  // Загрузим карты пользователя (структура похожа на MyCards)
  useEffect(() => {
    if (!uid) { setOwned([]); return; }
    const userRef = doc(db, 'users', uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) { setOwned([]); return; }
      const raw = snap.data().cards ?? {};
      let items = [];
      if (Array.isArray(raw)) {
        items = raw.map(it => (typeof it === 'object' && it !== null) ? it : { id: String(it), count: 1 });
      } else if (raw && typeof raw === 'object') {
        items = Object.entries(raw).map(([cardId, count]) => ({ id: cardId, count: Number(count || 0) }));
      }
      const metaMap = new Map();
      if (cardsJson && Array.isArray(cardsJson.cards)) for (const c of cardsJson.cards) metaMap.set(c.id, c);
      const enriched = items.map(it => {
        const meta = metaMap.get(it.id);
        return {
          id: it.id,
          count: it.count ?? 0,
          name: meta?.name ?? it.id,
          image: meta?.image ?? '/assets/cards/unknown.png',
          rtg: meta?.rtg ? Number(meta.rtg) : 0,
          rarity: meta?.rarity ?? 'unknown'
        };
      }).filter(c => c.count > 0);
      setOwned(enriched);
    }, (e) => { console.error('TeamBuilder onSnapshot error', e); setOwned([]); });
    return () => unsub();
  }, [uid]);

  // Загрузка существующих команд пользователя
  useEffect(() => {
    if (!uid) { setTeams([]); return; }
    const teamsCol = collection(db, 'users', uid, 'teams');
    const unsub = onSnapshot(teamsCol, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setTeams(arr.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (e) => { console.error('teams onSnapshot', e); setTeams([]); });
    return () => unsub();
  }, [uid]);

  const selectedCards = useMemo(() => selected.map(id => owned.find(c => c.id === id)).filter(Boolean), [selected, owned]);

  const ovr = useMemo(() => {
    if (selectedCards.length !== 2) return null;
    const v = Math.round((Number(selectedCards[0].rtg || 0) + Number(selectedCards[1].rtg || 0)) / 2);
    return v;
  }, [selectedCards]);

  const toggleSelect = (cardId) => {
    setSelected(prev => {
      if (prev.includes(cardId)) return prev.filter(x => x !== cardId);
      if (prev.length >= 2) return prev; // не больше 2
      return [...prev, cardId];
    });
  };

  const saveTeam = async () => {
    if (!uid) return alert('Требуется авторизация');
    if (selected.length !== 2) return alert('Выберите ровно 2 пилотов');
    setSaving(true);
    try {
      const payload = {
        name: teamName || `${selectedCards[0].name} & ${selectedCards[1].name}`,
        members: selected,
        memberNames: selectedCards.map(c => c.name),
        ovr: ovr,
        createdAt: serverTimestamp(),
      };
      const teamsCol = collection(db, 'users', uid, 'teams');
      await addDoc(teamsCol, payload);
      setTeamName('');
      setSelected([]);
    } catch (e) {
      console.error('saveTeam error', e);
      alert('Ошибка при сохранении команды');
    } finally {
      setSaving(false);
    }
  };

  const deleteTeam = async (teamId) => {
    if (!uid) return;
    const confirmed = window.confirm('Удалить команду?');
    if (!confirmed) return;
    try {
      const tdoc = doc(db, 'users', uid, 'teams', teamId);
      await deleteDoc(tdoc);
    } catch (e) {
      console.error('delete team error', e);
      alert('Не удалось удалить команду');
    }
  };
  

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-3">Создать состав</h3>

      <div className="bg-slate-900/40 p-3 rounded-lg mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            className="p-2 rounded bg-black/30 border border-slate-700 text-white"
            placeholder="Название команды (необязательно)"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <div className="p-2 rounded bg-black/30 border border-slate-700 text-white">
            <div className="text-sm">Выбранно: {selected.length} / 2</div>
            <div className="text-sm">OVR: {ovr ?? '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {owned.map(card => (
            <button
              key={card.id}
              onClick={() => toggleSelect(card.id)}
              className={`p-2 rounded-md text-left flex flex-col items-center gap-2 border ${selected.includes(card.id) ? 'border-amber-400' : 'border-transparent'} bg-black/40`}
            >
              <img src={card.image} alt={card.name} className="w-full h-24 object-cover rounded" onError={(e)=>{e.target.onerror=null;e.target.src='/assets/cards/unknown.png'}} />
              <div className="text-xs font-medium truncate w-full text-white">{card.name}</div>
              <div className="text-[11px] text-slate-300">RTG {card.rtg} • ×{card.count}</div>
            </button>
          ))}
          {owned.length === 0 && <div className="col-span-full text-center text-slate-400 py-6">Коллекция пуста</div>}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={saveTeam}
            disabled={saving || selected.length !== 2}
            className="px-3 py-1 rounded bg-emerald-600 disabled:opacity-50 text-white"
          >
            {saving ? 'Сохранение...' : 'Сохранить состав'}
          </button>
          <button onClick={() => setSelected([])} className="px-3 py-1 rounded bg-red-600 text-white">Сбросить выбор</button>
        </div>
      </div>

      <h4 className="text-lg font-semibold mb-2">Мои составы</h4>
      <div className="space-y-2">
        {teams.length === 0 && <div className="text-slate-400">Пока нет сохранённых составов</div>}
        {teams.map(t => (
          <div key={t.id} className="flex items-center justify-between p-2 bg-black/30 rounded border border-slate-700">
            <div>
              <div className="font-medium text-white">{t.name} <span className="text-sm text-slate-300">OVR {t.ovr}</span></div>
              <div className="text-sm text-slate-400">{(t.memberNames || t.members || []).join(' • ')}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelected(t.members || []); setTeamName(t.name || '') }} className="px-2 py-1 rounded bg-sky-600 text-white">Загрузить</button>
              <button onClick={() => deleteTeam(t.id)} className="px-2 py-1 rounded bg-red-600 text-white">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
