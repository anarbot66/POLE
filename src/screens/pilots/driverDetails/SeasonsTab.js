import React from "react";

const SeasonsTab = ({ 
  seasons, 
  selectedYear, 
  onYearChange, 
  seasonStats, 
  loadingStats 
}) => {
  return (
    <div>
      <select
        value={selectedYear}
        onChange={onYearChange}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "2px solid #1D1D1F",
          backgroundColor: "#1D1D1F",
          fontSize: "14px",
          color: "white",
          cursor: "pointer",
          marginBottom: "10px"
        }}
      >
        {seasons.map((year, index) => (
          <option key={index} value={year}>
            {year}
          </option>
        ))}
      </select>
      {loadingStats ? (
        <div> </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            gap: "12px"
          }}
        >
          <div style={{ width: "65px", textAlign: "center" }}>
            <span
              style={{
                color: "white",
                fontSize: "16px",
                fontFamily: "Inter",
                fontWeight: "600"
              }}
            >
              {seasonStats.position}
            </span>
            <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОЗИЦИЯ</div>
          </div>
          <div style={{ width: "65px", textAlign: "center" }}>
            <span
              style={{
                color: "white",
                fontSize: "16px",
                fontFamily: "Inter",
                fontWeight: "600"
              }}
            >
              {seasonStats.points}
            </span>
            <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
          </div>
          <div style={{ width: "65px", textAlign: "center" }}>
            <span
              style={{
                color: "white",
                fontSize: "16px",
                fontFamily: "Inter",
                fontWeight: "600"
              }}
            >
              {seasonStats.wins}
            </span>
            <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
          </div>
          <div style={{ width: "65px", textAlign: "center" }}>
            <span
              style={{
                color: "white",
                fontSize: "16px",
                fontFamily: "Inter",
                fontWeight: "600"
              }}
            >
              {seasonStats.podiums || 0}
            </span>
            <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
          </div>
          <div style={{ width: "65px", textAlign: "center" }}>
            <span
              style={{
                color: "white",
                fontSize: "16px",
                fontFamily: "Inter",
                fontWeight: "600"
              }}
            >
              {seasonStats.poles || 0}
            </span>
            <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
          </div>
          <div style={{ width: "65px", textAlign: "center" }}>
            <span
              style={{
                color: "white",
                fontSize: "16px",
                fontFamily: "Inter",
                fontWeight: "600"
              }}
            >
              {seasonStats.dnf || 0}
            </span>
            <div style={{ color: "#B9B9B9", fontSize: "10px" }}>DNF</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonsTab;
