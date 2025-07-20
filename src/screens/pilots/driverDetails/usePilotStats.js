// usePilotStats.js
import { useState, useEffect, useCallback } from "react";
import { normalizeName } from "./constants";

export function usePilotStats(pilot, selectedYear) {
  const [seasonStats, setSeasonStats] = useState({
    position: "-",
    points: "-",
    wins: 0,
    podiums: 0,
    poles: 0,
    dnf: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // 1) Берём из driverStandings не только позицию и очки, но и driverId
  const fetchPilotStandings = useCallback(
    async (familyName, year) => {
      try {
        const res = await fetch(
          `https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`
        );
        if (!res.ok) throw new Error("Ошибка загрузки standings");
        const { MRData } = await res.json();
        const list =
          MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
        if (!list.length) throw new Error("Нет данных по standings");

        // ищем по driverId из pilot (для 2025) или по фамилии
        const normFam = normalizeName(familyName);
        const found = list.find(
          (d) =>
            d.Driver.driverId === pilot.Driver.driverId ||
            normalizeName(d.Driver.familyName) === normFam
        );
        if (!found) throw new Error("Пилот не найден в standings");

        return {
          driverId: found.Driver.driverId,
          position: found.position || "-",
          points: found.points || "-",
        };
      } catch (err) {
        console.error("Ошибка загрузки standings:", err);
        return { driverId: null, position: "-", points: "-" };
      }
    },
    [pilot]
  );

  // 2) По driverId считаем wins/podiums/poles/dnf
  const fetchPilotResults = useCallback(
    async (driverId, year) => {
      if (!driverId) {
        return { wins: 0, podiums: 0, poles: 0, dnf: 0 };
      }
      try {
        const res = await fetch(
          `https://api.jolpi.ca/ergast/f1/${year}/drivers/${driverId}/results.json`
        );
        if (!res.ok) throw new Error("Ошибка загрузки results");
        const { MRData } = await res.json();
        const races = MRData.RaceTable.Races || [];

        const wins = races.filter(
          (r) => parseInt(r.Results?.[0]?.position, 10) === 1
        ).length;
        const podiums = races.filter((r) => {
          const p = parseInt(r.Results?.[0]?.position, 10);
          return p >= 1 && p <= 3;
        }).length;
        const poles = races.filter(
          (r) => parseInt(r.Results?.[0]?.grid, 10) === 1
        ).length;
        const dnf = races.filter((r) => {
          const status = r.Results?.[0]?.status || "";
          return (
            status !== "Finished" &&
            !status.toLowerCase().includes("+1 lap") &&
            !status.toLowerCase().includes("+2 laps")
          );
        }).length;

        return { wins, podiums, poles, dnf };
      } catch (err) {
        console.error("Ошибка загрузки results:", err);
        return { wins: 0, podiums: 0, poles: 0, dnf: 0 };
      }
    },
    []
  );

  useEffect(() => {
    async function loadStats() {
      if (!pilot || !selectedYear) return;
      setLoadingStats(true);
      setStatsError(null);

      // Сначала standings → получаем driverId, position, points
      const { driverId, position, points } = await fetchPilotStandings(
        pilot.Driver.familyName,
        selectedYear
      );

      // Затем результаты по этому driverId
      const { wins, podiums, poles, dnf } = await fetchPilotResults(
        driverId,
        selectedYear
      );

      setSeasonStats({ position, points, wins, podiums, poles, dnf });
      setLoadingStats(false);
    }

    loadStats();
  }, [pilot, selectedYear, fetchPilotStandings, fetchPilotResults]);

  return { seasonStats, loadingStats, statsError };
}
