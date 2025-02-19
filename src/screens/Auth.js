import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "./images/logo.png";
import { db } from '../firebase'; // Импортируем Firestore
import { doc, setDoc } from 'firebase/firestore'; // Импортируем необходимые методы Firestore
import { getAuth, signInAnonymously } from 'firebase/auth'; // Импортируем Firebase Auth

const Auth = ({ user }) => {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const handleContinue = async () => {
    if (isChecked) {
      try {
        // Аутентификация пользователя
        const userCredential = await signInAnonymously(auth);
        const firebaseUser = userCredential.user;

        // Сохраняем данные пользователя в Firestore
        if (user && user.id) {
          await setDoc(doc(db, "users", user.id.toString()), {
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            uid: firebaseUser.uid
          });
          console.log("Пользователь сохранен в Firestore");
        }
        navigate("/profile");
      } catch (error) {
        console.error("Ошибка аутентификации или сохранения пользователя в Firestore: ", error);
      }
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'white',
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
          backgroundColor: 'white'
        }}
      >
        <div
          style={{
            width: 250,
            height: 420,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 25,
            display: 'inline-flex',
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
          }}
        >
          <img
            style={{ alignSelf: 'fill', height: "100%" }}
            src={logo}
            alt="Placeholder"
          />
          <div
            style={{
              alignSelf: 'stretch',
              textAlign: 'center',
              color: 'black',
              fontSize: 13,
              fontWeight: '500',
              wordWrap: 'break-word'
            }}
          >
            Авторизация
          </div>
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
                  color: 'black',
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
              background: isChecked ? 'black' : 'grey',
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              display: 'inline-flex',
              cursor: isChecked ? 'pointer' : 'not-allowed'
            }}
            onClick={handleContinue}
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
              Продолжить
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;