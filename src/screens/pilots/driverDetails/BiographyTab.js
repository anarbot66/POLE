import React from "react";

const BiographyTab = ({ childhood, waytoformula, career }) => {
  return (
    <div
    style={{borderRadius: '15px', display: 'flex', gap: '10px', flexDirection: 'column', overflowY: 'auto', padding: '5px', fontSize: '14px'}}
    >
      <h1 style={{fontSize: '15px'}}>Детство</h1>
      <div style={{background: '#141416', padding: "15px", borderRadius: '15px'}}><p style={{fontSize: '13px'}}>{childhood}</p></div>
      <h2 style={{fontSize: '15px'}}>Путь в формулу-1</h2>
      <div style={{background: '#141416', padding: "15px", borderRadius: '15px'}}><p style={{fontSize: '13px'}}>{waytoformula}</p></div>
      <h3 style={{fontSize: '15px'}}>Карьера</h3>
      <div style={{background: '#141416', padding: "15px", borderRadius: '15px'}}><p style={{fontSize: '13px'}}>{career}</p></div>
    </div>
  );
};

export default BiographyTab;
