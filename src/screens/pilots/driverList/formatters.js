export const normalizeName = (name) => {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };
  
  export const formatDriverName = (key) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  export const getFormattedDate = () => {
    const now = new Date();
    const day = now.getDate();
    const monthNames = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    return `${day} ${month} ${year}`;
  };
  