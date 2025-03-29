import React from "react";

const cardBaseStyle = {
  padding: 15,
  background: "#212124",
  borderRadius: 12,
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "flex-start",
  gap: 6,
  display: "inline-flex",
};

const textBaseStyle = {
  flex: "1 1 0",
  textAlign: "right",
  justifyContent: "flex-end",
  display: "flex",
  flexDirection: "column",
  color: "white",
  fontSize: 18,
  fontFamily: "Inter",
  fontWeight: "400",
  wordWrap: "break-word",
};

const MenuCard = ({
  onClick,
  icon,
  label,
  containerStyle = {},
  textStyle = {},
}) => {
  return (
    <div onClick={onClick} style={{ ...cardBaseStyle, ...containerStyle }}>
      {icon}
      <div style={{ ...textBaseStyle, ...textStyle }}>{label}</div>
    </div>
  );
};

export default MenuCard;
