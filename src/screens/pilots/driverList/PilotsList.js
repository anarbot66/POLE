// PilotsList.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { usePilots } from "./usePilots";
import PilotCard from "./PilotCard";

const PilotsList = () => {
  const { pilots, error } = usePilots();
  const navigate = useNavigate();

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!pilots.length) return <div> </div>;

  return (
    <div
      style={{
        width: "calc(100% - 30px)",
        margin: "0 auto",
        marginBottom: "60px",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        background: '#141416',
        borderRadius: '15px',
        padding: '15px 0px 15px 0px'
      }}
    >
      {pilots.map((pilot) => (
        <PilotCard
          key={pilot.Driver.familyName}
          pilot={pilot}
          onClick={() =>
            navigate(
              `/pilot-details/${pilot.Driver.familyName
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()}`
            )
          }
        />
      ))}
    </div>
  );
};

export default PilotsList;
