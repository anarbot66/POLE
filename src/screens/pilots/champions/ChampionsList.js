// ChampionsList.js
import React from "react";
import { useChampionsData } from "./useChampionsData";
import ChampionsCard from "./ChampionsCard";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";

const ChampionsList = ({ onChampionSelect }) => {
  const { champions, loading, error } = useChampionsData();
  const navigate = useNavigate();


  if (loading) return <div> </div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <div
        style={{
          width: "calc(100% - 30px)",
          margin: "0 auto",
          height: "100%",
          marginBottom: "80px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px"
        }}
      >
        
        <div style={{display: "flex",
        flexDirection: "column",
        gap: "19px", position: 'fixed', width: '100%', background: 'rgb(17, 17, 19)', left: '0', top: '0', padding: '20px 20px 20px 20px', zIndex: 100}}>
      <div style={{display: 'flex', width: "100%", gap: "10px", alignItems: "center"}}>
      <BackButton
        label="Назад"
        style={{}}
      />
      <span style={{ color: 'white', fontSize: '18px'}}>
          Чемпионы
        </span>
      </div>
      
      </div>
        <div style={{marginTop: '60px', display: "flex",
          flexDirection: "column",
          gap: "10px",}}>
        {champions.map((champion, index) => (
          <ChampionsCard
            key={index}
            champion={champion}
            onClick={onChampionSelect}
          />
        ))}
        </div>
      </div>
    </div>
  );
};

export default ChampionsList;
