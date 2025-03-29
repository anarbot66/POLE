// usePilotStats.js
import { useState, useEffect, useCallback } from "react";
import { normalizeName } from "./constants";

export function usePilotStats(pilot, selectedYear) {
  const [seasonStats, setSeasonStats] = useState({ wins: 0, podiums: 0, poles: 0, dnf: 0, position: "", points: "" });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const fetchPilotStandings = useCallback(async (name, year) => {
    try {
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
      if (!response.ok) throw new Error("Ошибка загрузки данных о чемпионате");
      const data = await response.json();
      const standings = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
      if (!standings) throw new Error("Данные о пилотах отсутствуют");
      const normalizedName = normalizeName(name);
      const pilotData = standings.find(driver => normalizeName(driver.Driver.familyName) === normalizedName);
      if (!pilotData) throw new Error("Пилот не найден в этом году");
      return { position: pilotData.position || "-", points: pilotData.points || "-" };
    } catch (error) {
      console.error("Ошибка загрузки standings:", error);
      return { position: "-", points: "-" };
    }
  }, []);

  const fetchPilotResults = useCallback(async (lastName, year) => {
    try {
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/drivers/${lastName}/results.json`);
      if (!response.ok) throw new Error("Не удалось получить данные о результатах пилота");
      const data = await response.json();
      const results = data?.MRData?.RaceTable?.Races;
      if (results && Array.isArray(results)) {
        const wins = results.filter(result => parseInt(result?.Results?.[0]?.position, 10) === 1).length;
        const podiums = results.filter(result => {
          const pos = parseInt(result?.Results?.[0]?.position, 10);
          return pos >= 1 && pos <= 3;
        }).length;
        const poles = results.filter(result => parseInt(result?.Results?.[0]?.grid, 10) === 1).length;
        const dnf = results.filter(result => {
          const status = result?.Results?.[0]?.status;
          return status !== "Finished" && !status.toLowerCase().includes("+1 lap") && !status.toLowerCase().includes("+2 laps");
        }).length;
        return { wins, podiums, poles, dnf };
      }
      return { wins: 0, podiums: 0, poles: 0, dnf: 0 };
    } catch (error) {
      console.error("Ошибка загрузки результатов:", error);
      return { wins: 0, podiums: 0, poles: 0, dnf: 0 };
    }
  }, []);

  useEffect(() => {
    async function loadStats() {
      if (!pilot || !selectedYear) return;
      setLoadingStats(true);
      const normalizedPilotName = normalizeName(pilot.Driver.familyName);
      const [results, standings] = await Promise.all([
        fetchPilotResults(normalizedPilotName, selectedYear),
        fetchPilotStandings(normalizedPilotName, selectedYear)
      ]);
      setSeasonStats({ ...results, ...standings });
      setLoadingStats(false);
    }
    loadStats();
  }, [pilot, selectedYear, fetchPilotResults, fetchPilotStandings]);

  return { seasonStats, loadingStats, statsError };
}
