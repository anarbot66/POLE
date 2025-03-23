import React, { useEffect, useState } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../../../firebase';

const CreatorView = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "applications"));
      const apps = [];
      querySnapshot.forEach((doc) => {
        apps.push({ ...doc.data(), id: doc.id });
      });
      setApplications(apps);
    };

    fetchData();
  }, []);

  const openTelegram = (telegramTag) => {
    let username = telegramTag;
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    const url = `https://t.me/${username}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <h2>Список заявок</h2>
      {applications.map(app => (
        <div key={app.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
          <p><strong>Telegram Tag:</strong> {app.telegramTag}</p>
          {app.telegramLink && <p><strong>Telegram Link:</strong> {app.telegramLink}</p>}
          {app.tiktokLink && <p><strong>TikTok Link:</strong> {app.tiktokLink}</p>}
          {app.vkLink && <p><strong>VK Link:</strong> {app.vkLink}</p>}
          <p><strong>О канале:</strong> {app.channelAbout}</p>
          <button onClick={() => openTelegram(app.telegramTag)}>Ответить</button>
        </div>
      ))}
    </div>
  );
};

export default CreatorView;
