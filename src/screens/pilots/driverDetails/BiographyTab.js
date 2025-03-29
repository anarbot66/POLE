import React from "react";

const BiographyTab = ({ biography }) => {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#212124",
        borderRadius: "8px",
        fontSize: "14px",
        color: "white",
        padding: "10px"
      }}
    >
      <p>{biography}</p>
    </div>
  );
};

export default BiographyTab;
