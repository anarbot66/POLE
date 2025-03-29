import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from '../../../firebase';
import logo from "../../recources/images/apex-logo.png";

const CreatorForm = ({ currentUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [existingApp, setExistingApp] = useState(null);
  
  const [telegramTag, setTelegramTag] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [tiktokLink, setTiktokLink] = useState('');
  const [vkLink, setVkLink] = useState('');
  const [channelAbout, setChannelAbout] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, "applications"), where("user_uid", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setExistingApp(querySnapshot.docs[0].data());
      }
      setLoading(false);
    };
    checkExistingApplication();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!telegramTag || !channelAbout) {
      alert("Пожалуйста, заполните обязательные поля: Telegram tag и описание канала");
      return;
    }
    try {
      await addDoc(collection(db, "applications"), {
        telegramTag,
        telegramLink,
        tiktokLink,
        vkLink,
        channelAbout,
        user_uid: currentUser.uid,
        createdAt: new Date(),
      });
      setMessage("Заявка успешно отправлена!");
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (error) {
      console.error("Ошибка при отправке заявки: ", error);
      alert("Ошибка при отправке заявки. Попробуйте еще раз.");
    }
  };

  if (loading) {
    return <p> </p>;
  }

  if (existingApp) {
    return <div  style={{display: "flex", flexDirection: "column", gap: 15, alignItems: 'center', justifyContent: "center", width: "100vw", height: "100vh"}}>
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M71.6428 22.3294C73.2686 20.6819 75.9047 20.6819 77.5306 22.3294C79.1365 23.9567 79.1562 26.5827 77.5897 28.2345L44.3264 67.5547C44.2944 67.5952 44.2602 67.6339 44.224 67.6706C42.5981 69.3181 39.9621 69.3181 38.3362 67.6706L18.0944 47.1593C16.4685 45.5118 16.4685 42.8407 18.0944 41.1931C19.7203 39.5456 22.3564 39.5456 23.9822 41.1931L41.1547 58.5942L71.5323 22.4556C71.5666 22.4113 71.6035 22.3692 71.6428 22.3294Z" fill="#00A80B"/>
      </svg>

      <p style={{color: "white"}}>Ваша заявка в обработке</p>
    </div>;
  }

  return (
    <div style={{padding: "10px", color: "white", marginBottom: 70}}>
      <div style={{justifyContent: "center",
      alignItems: "center", display: "flex", flexDirection: "column", gap: 20}}>
      <img src={logo} alt={""}
      style={{ width: "190px", height: "190px", objectFit: "cover"}} />
      <span>Хочешь стать креатором в Apex?</span>
      <span>Заполняй заявку ниже и жди ответа!</span>
      </div>
      <form style={{backgroundColor: "#212124", borderRadius: 10, marginTop: 20}} onSubmit={handleSubmit}>
        <div style={{padding: 10, gap: 25, display: "flex", flexDirection: "column"}}>
        <div style={{gap: 10, display: "flex", flexDirection: "column"}}>
          <label>Личный телеграм:</label>
          <input
            className="creatorFormInput"
            type="text"
            value={telegramTag}
            onChange={(e) => setTelegramTag(e.target.value)}
            required
          />
        </div>
        <div style={{gap: 10, display: "flex", flexDirection: "column"}}>
          <label>Ссылка на Telegram канал (не обязательно):</label>
          <input
          className="creatorFormInput"
            type="text"
            value={telegramLink}
            onChange={(e) => setTelegramLink(e.target.value)}
          />
        </div>
        <div style={{gap: 10, display: "flex", flexDirection: "column"}}>
          <label>Ссылка на TikTok (не обязательно):</label>
          <input
          className="creatorFormInput"
            type="text"
            value={tiktokLink}
            onChange={(e) => setTiktokLink(e.target.value)}
          />
        </div>
        <div style={{gap: 10, display: "flex", flexDirection: "column"}}>
          <label>Ссылка на VK (не обязательно):</label>
          <input
          className="creatorFormInput"
            type="text"
            value={vkLink}
            onChange={(e) => setVkLink(e.target.value)}
          />
        </div>
        <div style={{gap: 10, display: "flex", flexDirection: "column"}}>
          <label>О чем канал:</label>
          <textarea
          className="creatorFormInput"
            value={channelAbout}
            onChange={(e) => setChannelAbout(e.target.value)}
            required
          />
        </div>
        </div>
        <button style={{width: "100%", height: 60, textAlign: "center", alignItems: "center"}} type="submit">Отправить</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreatorForm;
