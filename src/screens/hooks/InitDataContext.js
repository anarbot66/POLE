import React, { createContext, useContext } from 'react';

const InitDataContext = createContext(null);

// Хук для удобного доступа к контексту
export const useInitData = () => useContext(InitDataContext);

export default InitDataContext;
