import React from "react";
import { useNavigate } from "react-router-dom";
import { usePilots } from "./usePilots";
import PilotCard from "./PilotCard";

const PilotsList = () => {
  const { pilots, error } = usePilots();
  const navigate = useNavigate();

  if (error) return <div>{error}</div>;
  if (!pilots.length) return null;

  return (
    <div style={{ width: "calc(100% - 30px)", margin: "0 auto", marginBottom: "100px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px", background: "#1D1D1F", paddingTop: "20px" }}>
      {pilots.map((pilot, index) => (
        <PilotCard key={index} pilot={pilot} onClick={() => navigate(`/pilot-details/${pilot.Driver.familyName.toLowerCase()}`)} />
      ))}
    </div>
  );
};

export default PilotsList;
