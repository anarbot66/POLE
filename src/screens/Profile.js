import React from 'react';

const Profile = ({ user }) => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'white', // Белый фон для всего контейнера
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Выравнивание блока с данными сверху
        paddingTop: '20px' // Отступ сверху для блока с данными
      }}
    >
      <div
        style={{
          width: 340,
          height: 128,
          padding: 20,
          background: 'white',
          borderRadius: 15,
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 12,
          display: 'inline-flex',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        <img
          src={user?.photo || 'https://placehold.co/58x58'}
          alt="User"
          style={{ width: 58, height: 58, background: '#D9D9D9', borderRadius: 5 }}
        />
        <div
          style={{
            color: 'black',
            fontSize: 15,
            fontFamily: 'Inter',
            fontWeight: '500',
            wordWrap: 'break-word'
          }}
        >
          {user?.name || 'Name Surname'}
        </div>
      </div>
    </div>
  );
};

export default Profile;