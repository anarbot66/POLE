import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../recources/images/logo-250.png";
import { db } from '../../firebase'; // Импорт Firestore
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const Auth = ({ user }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const uploadToImgBB = async (imageUrl) => {
    try {
      // Если imageUrl пустой, можно вернуть пустую строку или задать дефолтное изображение
      if (!imageUrl) {
        return "";
      }
      const formData = new FormData();
      formData.append("image", imageUrl);
      formData.append("key", "YOUR_IMGBB_API_KEY"); // Вставьте ваш API-ключ от ImgBB

      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return data.data.url; // Возвращаем ссылку на загруженное фото
    } catch (error) {
      console.error("Ошибка загрузки фото:", error);
      return imageUrl; // При ошибке возвращаем оригинальное значение
    }
  };

  const handleContinue = async () => {
    if (isChecked) {
      setIsLoading(true); // Делаем кнопку неактивной
      try {
        // Аутентификация пользователя через Firebase Auth
        const userCredential = await signInAnonymously(auth);
        const firebaseUser = userCredential.user;

        if (user && user.name) {
          console.log("Начинаем проверку и сохранение данных в Firestore");

          const q = query(collection(db, "users"), where("username", "==", user.name));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            const photoUrl = await uploadToImgBB(user.photoUrl);
            await setDoc(doc(db, "users", firebaseUser.uid), {
              username: user.name,
              firstName: user.firstName,
              lastName: user.lastName,
              photoUrl: photoUrl,
              uid: firebaseUser.uid
            });
          } else {
            console.log("Пользователь уже существует");
          }
        }
        navigate("/feed");
      } catch (error) {
        console.error("Ошибка аутентификации или сохранения пользователя в Firestore: ", error);
        setErrorMessage(`Ошибка: ${error.message}`);
      } finally {
        setIsLoading(false); // Возвращаем активное состояние кнопки
      }
    } else {
      console.log("Checkbox не отмечен, данные не сохраняются.");
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1D1D1F',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Inter',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          backgroundColor: '#1D1D1F'
        }}
      >
        <div
          style={{
            width: 250,
            height: 300,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 25,
            display: 'inline-flex',
            backgroundColor: '#212124',
            padding: 20,
            borderRadius: 10,
          }}
        >
          <img
            style={{ alignSelf: 'fill', height: "120px" }}
            src={logo}
            alt="Logo"
          />
          <div
            style={{
              alignSelf: 'stretch',
              textAlign: 'center',
              color: 'white',
              fontSize: 13,
              fontWeight: '500',
              wordWrap: 'break-word'
            }}
          >
            Авторизация
          </div>
          {errorMessage && (
            <div
              style={{
                color: 'red',
                fontSize: 12,
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              {errorMessage}
            </div>
          )}
          <div
            style={{
              height: 33,
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              gap: 3,
              display: 'flex'
            }}
          >
            <div
              style={{
                alignSelf: 'stretch',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                display: 'inline-flex'
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                style={{ width: 20, height: 20, borderRadius: 5 }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: 164,
                  height: 8,
                  color: 'white',
                  fontSize: 10,
                  fontWeight: '500',
                  wordWrap: 'break-word'
                }}
              >
                Я согласен на обработку данных
              </div>
            </div>
            <div
              style={{
                color: '#005BD2',
                fontSize: 10,
                fontFamily: 'Inter',
                fontWeight: '500',
                wordWrap: 'break-word',
                cursor: 'pointer'
              }}
              onClick={() => window.open('https://t.me/+tpR8KgDWWXk4NDdi')}
            >
              Что это значит?
            </div>
          </div>
          <div
            style={{
              alignSelf: 'stretch',
              height: 100,
              background: isChecked && !isLoading ? '#0077FF' : 'grey',
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              display: 'inline-flex',
              cursor: isChecked && !isLoading ? 'pointer' : 'not-allowed'
            }}
            onClick={!isLoading ? handleContinue : null}
          >
            <div
              style={{
                color: 'white',
                fontSize: 13,
                fontFamily: 'Inter',
                fontWeight: '500',
                wordWrap: 'break-word'
              }}
            >
              {isLoading ? "Загрузка..." : "Продолжить"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
