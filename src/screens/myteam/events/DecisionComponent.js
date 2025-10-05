// src/components/DecisionComponent.jsx
import React, { useState } from 'react';

/**
 * Props:
 * - game: { type: 'decision', situations: [{ id, situation, options: [{ id, text, explain, isCanonical }], reward? }] }
 * - onSubmit: async function(payload) -> payload: { decisions: [...], localScore }
 */
export default function DecisionComponent({ game, onSubmit }) {
  const situations = game?.situations || [];
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState({}); // { [situationId]: selectedOptionId }
  const [revealed, setRevealed] = useState({}); // { [situationId]: true }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function choose(situationId, optionId) {
    setSelected(prev => ({ ...prev, [situationId]: optionId }));
  }

  function revealCurrent() {
    const sid = situations[index].id;
    if (!selected[sid]) {
      setError('Сначала выберите вариант.');
      return;
    }
    setError(null);
    setRevealed(prev => ({ ...prev, [sid]: true }));
  }

  function next() {
    if (index + 1 < situations.length) setIndex(index + 1);
  }

  function prev() {
    if (index > 0) setIndex(index - 1);
  }

  async function finish() {
    setError(null);
    const allChosen = situations.every(s => !!selected[s.id]);
    if (!allChosen) {
      setError('Пожалуйста, примите решение во всех ситуациях перед завершением.');
      return;
    }

    const localScore = situations.reduce((sum, s) => sum + (s.reward || 0), 0);

    setSubmitting(true);
    try {
      const payload = {
        decisions: situations.map(s => ({ situationId: s.id, selectedOptionId: selected[s.id] })),
        localScore
      };
      const res = await onSubmit(payload);
      return res;
    } catch (err) {
      setError(err?.message || 'Ошибка отправки');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  if (!situations || situations.length === 0) return <div>Нет ситуаций для принятия решений.</div>;

  const cur = situations[index];

  return (
    <div className="decisionComponent" style={{ padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Ситуация {index + 1} из {situations.length}</strong>
        <div style={{ fontSize: 12 }}>{Object.keys(selected).length}/{situations.length} выбрано</div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ marginBottom: 10 }}>{cur.situation}</div>

        <div>
          {cur.options.map(opt => {
            const chosen = selected[cur.id] === opt.id;
            const revealedForThis = Boolean(revealed[cur.id]);
            return (
              <div
                key={opt.id}
                onClick={() => !revealedForThis && choose(cur.id, opt.id)}
                style={{
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 8,
                  cursor: revealedForThis ? 'default' : 'pointer',
                  border: chosen ? '1px solid #ddd' : '1px solid black'
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="radio" readOnly checked={chosen} style={{ marginRight: 8 }} />
                  <div>{opt.text}</div>
                </div>

                {revealedForThis && (
                  <div style={{ marginTop: 8 }}>
                    <div><strong>Объяснение:</strong> {opt.explain}</div>
                    {typeof opt.isCanonical !== 'undefined' && (
                      <div style={{ marginTop: 6, fontStyle: 'italic', color: '#555' }}>
                        {opt.isCanonical ? 'Это совпадает с историческим решением героя.' : 'Альтернативный вариант.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {!revealed[cur.id] ? (
            <button onClick={revealCurrent} style={{ padding: '8px 12px', borderRadius: 6, background: '#0b74de', color: '#fff', border: 'none' }}>
              Подтвердить выбор и узнать почему
            </button>
          ) : (
            <>
              <button onClick={prev} disabled={index === 0} style={{ padding: '8px 12px', borderRadius: 6 }}>Назад</button>
              {index + 1 < situations.length ? (
                <button onClick={next} style={{ padding: '8px 12px', borderRadius: 6, background: '#0b74de', color: '#fff', border: 'none' }}>Далее</button>
              ) : (
                <button onClick={finish} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 6, background: '#0b74de', color: '#fff', border: 'none' }}>
                  {submitting ? 'Отправка…' : 'Завершить главу'}
                </button>
              )}
            </>
          )}
        </div>

        {error && <div style={{ marginTop: 8, color: 'crimson' }}>{error}</div>}
      </div>
    </div>
  );
}
