import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Импорт Firestore
import { collection, query, where, getDocs } from 'firebase/firestore'; // Импорт методов Firestore

const Profile = ({ user }) => {
  const [profileData, setProfileData] = useState({});

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user && user.name) {
        const q = query(collection(db, "users"), where("username", "==", user.name));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            setProfileData(doc.data());
          });
        }
      }
    };

    fetchProfileData();
  }, [user]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1D1D1F',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '10px'
      }}
    >
      <div
        style={{
          width: 340,
          height: 170,
          padding: 20,
          background: '#212124',
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
          src={profileData.photoUrl}
          alt="Not Found"
          style={{ width: 58, height: 58, background: '#D9D9D9', borderRadius: 5 }}
        />
        <div
          style={{
            color: 'white',
            fontSize: 15,
            fontFamily: 'Inter',
            fontWeight: '500',
            wordWrap: 'break-word',
            textAlign: 'center'
          }}
        >
          {profileData.username || 'Username'}
        </div>
        <div
          style={{
            color: 'white',
            fontSize: 15,
            fontFamily: 'Inter',
            fontWeight: '500',
            wordWrap: 'break-word',
            textAlign: 'center'
          }}
        >
          {profileData.firstName + profileData.lastName || 'Not found'}
        </div>
      </div>
    </div>
  );
};

export default Profile;