// usePilotData.js
import { useState, useEffect } from "react";
import biographies from "../../recources/json/bio";
import seasonsData from "../../recources/json/seasons";
import {
  normalizeName,
  driverTranslations,
  driverToConstructor,
} from "./constants";

export function usePilotData(lastName) {
  const [pilot, setPilot] = useState(null);
  const [biography, setBiography] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lastName) return;

    const fetchFromApi = async () => {
      try {
        // 1) Запросим текущее положение пилотов в 2025-м
        const resStandings = await fetch(
          "https://api.jolpi.ca/ergast/f1/2025/driverStandings.json"
        );
        if (!resStandings.ok) {
          throw new Error(`API error: ${resStandings.status}`);
        }
        const jsonStandings = await resStandings.json();
        const standings =
          jsonStandings.MRData.StandingsTable.StandingsLists[0]
            ?.DriverStandings || [];

        // 2) Найдём нужного пилота по нормализованной фамилии
        const found = standings.find((item) =>
          normalizeName(item.Driver.familyName) === lastName
          
        );
        if (!found) {
          if (!found) {
            throw new Error(`Пилот с фамилией "${lastName}" не найден в текущем сезоне`);
          }          
        }

        // 3) Соберём базовый объект пилота
        const constructorName =
          found.Constructors[0]?.name || "Unknown";
        const fullName = `${found.Driver.givenName} ${found.Driver.familyName}`;
        const translatedName =
          driverTranslations[found.Driver.familyName] || fullName;

        // 4) Запросим все результаты этого пилота в 2025-м
        const driverId = found.Driver.driverId;
        const resResults = await fetch(
          `https://api.jolpi.ca/ergast/f1/2025/drivers/${driverId}/results.json`
        );
        if (!resResults.ok) {
          throw new Error(
            `Results API error: ${resResults.status}`
          );
        }
        const jsonResults = await resResults.json();
        const races =
          jsonResults.MRData.RaceTable.Races || [];

        // 5) Подсчитаем поулы, подиумы и DNF
        const poles = races.filter(
          (r) => r.Results?.[0]?.grid === "1"
        ).length;
        const podiums = races.filter((r) => {
          const pos = parseInt(r.Results?.[0]?.position, 10);
          return pos >= 1 && pos <= 3;
        }).length;
        const dnf = races.filter((r) => {
          const status = r.Results?.[0]?.status || "";
          // считаем DNF всё, что не "Finished" и не допущено как +n laps
          return (
            status !== "Finished" &&
            !status.toLowerCase().includes("lap")
          );
        }).length;

        // 6) Собираем объект с полным набором
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

  // Как только из API придёт pilot — подхватываем биографию и сезоны
  useEffect(() => {
    if (!pilot) return;

    // Локальная биография
    const bio =
      biographies[lastName]?.biography || "Биография не найдена";
    setBiography(bio);

    // Локальный список сезонов
    const pilotSeasons = seasonsData[lastName] || [];
    setSeasons(pilotSeasons);
  }, [pilot, lastName]);

  return { pilot, biography, seasons, loading, error };
}
