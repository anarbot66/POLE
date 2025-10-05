// src/components/QuizComponent.jsx
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Props:
 * - game: { type: 'quiz', questions: [{ id, q, options: [], answerIndex, reward }] }
 * - onSubmit: async function(payload) -> payload: { answers, localScore }
 * - autoSubmit (optional)
 */
export default function QuizComponent({ game, onSubmit, autoSubmit = false }) {
  const questions = game?.questions || [];

  // answers array aligned with questions indices: { questionId, selectedIndex }
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // initialize answers whenever questions change
  useEffect(() => {
    setAnswers(questions.map((q, idx) => ({ questionId: q.id ?? `q-${idx}`, selectedIndex: null })));
    setSubmitted(false);
    setError(null);
  }, [questions]);

  const localScore = useMemo(() => {
    return questions.reduce((sum, q, idx) => {
      const sel = answers[idx]?.selectedIndex;
      if (sel === null || sel === undefined) return sum;
      return sum + (sel === q.answerIndex ? (q.reward || 0) : 0);
    }, 0);
  }, [answers, questions]);

  function handleSelect(qIdx, optionIndex) {
    if (submitted) return;
    setAnswers(prev => {
      const copy = prev.slice();
      copy[qIdx] = { ...copy[qIdx], selectedIndex: optionIndex };
      return copy;
    });

    if (autoSubmit) {
      // check if all answered after a tiny delay
      setTimeout(() => {
        const allAnswered = (answers.slice().map((a, i) => (i === qIdx ? optionIndex !== null : a.selectedIndex !== null))).every(Boolean);
        if (allAnswered) submit();
      }, 30);
    }
  }

  async function submit() {
    setError(null);
    const allAnswered = answers.every(a => a.selectedIndex !== null && a.selectedIndex !== undefined);
    if (!allAnswered) {
      setError('Пожалуйста, ответьте на все вопросы.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { answers: answers.map(a => ({ questionId: a.questionId, selectedIndex: a.selectedIndex })), localScore };
      const res = await onSubmit(payload);
      setSubmitted(true);
      return res;
    } catch (err) {
      setError(err?.message || 'Ошибка отправки результатов');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  if (!questions || questions.length === 0) return <div>Вопросы отсутствуют.</div>;

  return (
    <div className="quizComponent" style={{ padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Викторина</strong>
        <div style={{ fontSize: 12 }}>{answers.filter(a => a.selectedIndex !== null).length}/{questions.length} ответов</div>
      </div>

      <div style={{ marginTop: 8 }}>
        {questions.map((q, qi) => {
          const sel = answers[qi]?.selectedIndex;
          const isCorrect = submitted && sel === q.answerIndex;
          const isWrong = submitted && sel !== q.answerIndex;
          return (
            <div key={q.id ?? `q-${qi}`} style={{ marginBottom: 12, padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
              <div style={{ marginBottom: 6 }}>{qi + 1}. {q.q}</div>
              <div>
                {q.options.map((opt, oi) => {
                  const checked = sel === oi;
                  return (
                    <label key={oi} style={{ display: 'block', marginBottom: 6, cursor: submitted ? 'default' : 'pointer' }}>
                      <input
                        type="radio"
                        name={`q-${q.id ?? qi}`}
                        checked={checked || false}
                        onChange={() => handleSelect(qi, oi)}
                        disabled={submitted || submitting}
                        style={{ marginRight: 8 }}
                      />
                      <span>{opt}</span>
                      {submitted && q.answerIndex === oi && (
                        <span style={{ marginLeft: 8, color: 'green' }}> ✔</span>
                      )}
                      {submitted && checked && isWrong && (
                        <span style={{ marginLeft: 8, color: 'crimson' }}> ✖</span>
                      )}
                    </label>
                  );
                })}
              </div>

              {submitted && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  {isCorrect ? <span style={{ color: 'green' }}>Правильно! +{q.reward || 0}</span> :
                    <span>Неверно. Правильный ответ: <strong>{q.options[q.answerIndex]}</strong></span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        {!submitted ? (
          <button onClick={submit} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 6, background: '#0b74de', color: '#fff', border: 'none' }}>
            {submitting ? 'Отправка…' : 'Завершить и отправить'}
          </button>
        ) : (
          <div style={{ color: '#2a7f2a' }}><strong>{localScore}</strong></div>
        )}
        {error && <div style={{ color: 'crimson', marginLeft: 8 }}>{error}</div>}
      </div>
    </div>
  );
}
