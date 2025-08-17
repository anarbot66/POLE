// src/hooks/usePilotData.js
import { useState, useEffect } from "react";
import biographies from "../../recources/json/bio";
import seasonsData from "../../recources/json/seasons";
import {
  normalizeName,
  driverTranslations,
} from "./constants";

export function usePilotData(lastName) {
  const [pilot, setPilot] = useState(null);
  const [childhood, setChildhood] = useState("");
  const [waytoformula, setWaytoformula] = useState("");
  const [career, setCareer] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [firstRace, setFirstRace] = useState("");      // из локального JSON
  const [lastRaceData, setLastRaceData] = useState(null); // весь объект последней гонки
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lastName) return;

    const fetchFromApi = async () => {
      try {
        // 1) Текущее положение пилотов в 2025-м
        const resStandings = await fetch(
          "https://api.jolpi.ca/ergast/f1/2025/driverStandings.json"
        );
        if (!resStandings.ok) {
          throw new Error(`API error: ${resStandings.status}`);
        }
        const { MRData } = await resStandings.json();
        const standings =
          MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];

        // 2) Найти пилота по нормализованной фамилии
        const found = standings.find((item) =>
          normalizeName(item.Driver.familyName) === lastName
        );
        if (!found) {
          throw new Error(`Пилот "${lastName}" не найден в текущем сезоне`);
        }

        // 3) Собрать базовые данные пилота
        const constructorName = found.Constructors[0]?.name || "Unknown";
        const fullName = `${found.Driver.givenName} ${found.Driver.familyName}`;
        const translatedName =
          driverTranslations[found.Driver.familyName] || fullName;

        // 4) Запросить все результаты этого пилота в 2025-м
        const driverId = found.Driver.driverId;
        const resResults = await fetch(
          `https://api.jolpi.ca/ergast/f1/2025/drivers/${driverId}/results.json`
        );
        if (!resResults.ok) {
          throw new Error(`Results API error: ${resResults.status}`);
        }
        const jsonResults = await resResults.json();
        const races = jsonResults.MRData.RaceTable.Races || [];

        // 4.1) Сохранить весь объект последней гонки
        if (races.length > 0) {
          setLastRaceData(races[races.length - 1]);
        }

        // 5) Подсчитать поулы, подиумы и DNF
        const poles = races.filter((r) => r.Results?.[0]?.grid === "1").length;
        const podiums = races.filter((r) => {
          const pos = parseInt(r.Results?.[0]?.position, 10);
          return pos >= 1 && pos <= 3;
        }).length;
        const dnf = races.filter((r) => {
          const status = r.Results?.[0]?.status || "";
          return (
            status !== "Finished" &&
            !status.toLowerCase().includes("lap")
          );
        }).length;

        // 6) Собрать объект pilot
        const pilotObj = {
          Driver: {
            givenName: found.Driver.givenName,
            familyName: found.Driver.familyName,
            translatedName,
            nationality: found.Driver.nationality,
          },
          Constructors: [{ name: constructorName }],
          position: Number(found.position),
          points: Number(found.points),
          extraStats: {
            wins: Number(found.wins),
            poles,
            podiums,
            dnf,
          },
        };

        setPilot(pilotObj);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFromApi();
  }, [lastName]);

  // После загрузки pilot — подтянуть локальные данные: биография, сезоны и первая гонка
  useEffect(() => {
    if (!pilot) return;

    // firstRace из локального JSON
    const localFirst = biographies[lastName]?.firstRace;
    setFirstRace(localFirst || "");

    // Локальная биография
    const childhood = biographies[lastName]?.childhood || "Биография не найдена";
    setChildhood(childhood);

    const waytoformula = biographies[lastName]?.waytoformula || "Биография не найдена";
    setWaytoformula(waytoformula);

    const career = biographies[lastName]?.career || "Биография не найдена";
    setCareer(career);

    // Локальные сезоны
    const pilotSeasons = seasonsData[lastName] || {};
    setSeasons(pilotSeasons);
  }, [pilot, lastName]);

  return {
    pilot,
    seasons,
    firstRace,
    lastRaceData,
    loading,
    error,
    childhood,
    waytoformula,
    career
  };
}
