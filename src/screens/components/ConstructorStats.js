import React from 'react';

const ConstructorStats = ({ position, points, wins, podiums, poles }) => {
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
      <div style={{ width: "65px", textAlign: "center" }}>
        <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>{position}</span>
        <div style={{ color: "#B9B9B9", fontSize: "10px", fontFamily: "Inter", fontWeight: "600" }}>ПОЗИЦИЯ</div>
      </div>
      <div style={{ width: "65px", textAlign: "center" }}>
        <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>{points}</span>
        <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ОЧКОВ</div>
      </div>
      <div style={{ width: "65px", textAlign: "center" }}>
        <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>{wins}</span>
        <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОБЕД</div>
      </div>
      <div style={{ width: "65px", textAlign: "center" }}>
        <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>{podiums}</span>
        <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОДИУМОВ</div>
      </div>
      <div style={{ width: "65px", textAlign: "center" }}>
        <span style={{ color: "white", fontSize: "16px", fontFamily: "Inter", fontWeight: "600" }}>{poles}</span>
        <div style={{ color: "#B9B9B9", fontSize: "10px" }}>ПОУЛОВ</div>
      </div>
    </div>
  );
};

export default ConstructorStats;