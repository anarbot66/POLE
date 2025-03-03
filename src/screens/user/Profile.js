import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase'; // Импорт Firestore
import { doc, getDoc } from 'firebase/firestore';

const Profile = ({ user }) => {
  const { uid } = useParams(); // Получаем uid из URL
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Теперь используем uid из аутентификации Firebase (передается через props)
        const userDocRef = doc(db, 'users', user.uid); // Получаем ссылку на документ пользователя по uid Firebase
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          setUserData(docSnapshot.data());
        } else {
          console.log('Пользователь не найден');
        }
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchUserData();
    } else {
      console.log('Нет данных пользователя');
      navigate('/'); // Если нет uid, переходим на страницу входа
    }
  }, [user, uid, navigate]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1D1D1F',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          width: 300,
          height: 400,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#212124',
          padding: 20,
          borderRadius: 10,
        }}
      >
        <img
          src={userData?.photoUrl} // Если фото пользователя нет, показываем дефолтную аватарку
          alt="Avatar"
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: 20,
          }}
        />
        <div
          style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {userData?.firstName} {userData?.lastName}
        </div>
        <div
          style={{
            color: '#aaa',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center',
            marginTop: 5,
          }}
        >
          @{userData?.username}
        </div>
        <div
          style={{
            marginTop: 20,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <button
            style={{
              width: '100%',
              padding: '10px 20px',
              backgroundColor: '#0077FF',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/feed')} // Переход на ленту
          >
            Перейти в ленту
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
