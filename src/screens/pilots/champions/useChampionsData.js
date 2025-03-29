// useChampionsData.js
import { useState, useEffect } from "react";
import championsData from "./champions.json";

export function useChampionsData() {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setChampions(championsData.champions);
      setLoading(false);
    } catch (err) {
      console.error("Ошибка загрузки чемпионов:", err);
      setError("Ошибка загрузки чемпионов");
      setLoading(false);
    }
  }, []);

  return { champions, loading, error };
}
