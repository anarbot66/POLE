import React from "react";

const ConstructorBiography = ({ create, peak, now }) => {
  return (
    <div
    style={{borderRadius: '15px', display: 'flex', gap: '10px', flexDirection: 'column', overflowY: 'auto', padding: '5px', fontSize: '14px'}}
    >
      <h1 style={{fontSize: '15px'}}>Создание команды</h1>
      <div style={{background: '#141416', padding: "15px", borderRadius: '15px'}}><p style={{fontSize: '13px'}}>{create}</p></div>
      <h2 style={{fontSize: '15px'}}>Пик</h2>
      <div style={{background: '#141416', padding: "15px", borderRadius: '15px'}}><p style={{fontSize: '13px'}}>{peak}</p></div>
      <h3 style={{fontSize: '15px'}}>Команда сейчас</h3>
      <div style={{background: '#141416', padding: "15px", borderRadius: '15px'}}><p style={{fontSize: '13px'}}>{now}</p></div>
    </div>
  );
};

export default ConstructorBiography;
