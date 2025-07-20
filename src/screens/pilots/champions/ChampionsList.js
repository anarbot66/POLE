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
          marginBottom: "100px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px"
        }}
      >
        
        <div style={{position: 'fixed'}}>
      <BackButton
        label="Назад"
        style={{}}
      />
        
      </div>
        <div style={{marginTop: '50px', display: "flex",
          flexDirection: "column",
          gap: "15px",}}>
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
