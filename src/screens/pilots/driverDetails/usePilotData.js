// usePilotData.js
import { useState, useEffect } from "react";
import pilotStats from "../../recources/json/driversData.json";
import biographies from "../../recources/json/bio";
import seasonsData from "../../recources/json/seasons";
import { normalizeName, formatDriverName, driverTranslations, driverToConstructor } from "./constants";

export function usePilotData(lastName) {
  const [pilot, setPilot] = useState(null);
  const [biography, setBiography] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lastName) return;
    const stats = pilotStats[lastName];
    if (stats) {
      const constructorName = driverToConstructor[lastName] || "Unknown";
      const fullName = formatDriverName(lastName);
      const translatedName = driverTranslations[fullName] || fullName;
      const pilotObj = {
        Driver: {
          givenName: fullName.split(" ")[0] || "",
          familyName: fullName.split(" ")[1] || fullName,
          translatedName,
          nationality: stats.nationality
        },
        Constructors: [{ name: constructorName }],
        position: stats.pos,
        points: stats.point,
        extraStats: { ...stats }
      };
      setPilot(pilotObj);

      const bio = biographies[lastName]?.biography || "Биография не найдена";
      setBiography(bio);

      const pilotSeasons = seasonsData[lastName] || [];
      setSeasons(pilotSeasons);
    } else {
      setError("Пилот не найден");
    }
    setLoading(false);
  }, [lastName]);

  return { pilot, biography, seasons, loading, error };
}
