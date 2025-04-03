// Функции для форматирования дат
export const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    const dayMonth = date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
    });
    const time = date.toLocaleString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dayMonth} в ${time}`;
  };
  
  export const getFormattedDate = () => {
    const now = new Date();
    const day = now.getDate();
    const monthNames = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    return `${day} ${month} ${year}`;
  };
  