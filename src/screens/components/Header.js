import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import UserStats from '../user/components/UserStats';
import './Header.css';

const Header = ({ currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const visibleRoutes = ['/races', '/standings', '/services', "/favorites", "/profile", "/activity"];
  const isVisible = visibleRoutes.includes(location.pathname);

  return (
    <CSSTransition
      in={isVisible}
      timeout={300}
      classNames="fade"
      unmountOnExit
    >
      <div className="topHeaderGlass" style={{borderRadius: '15px', position: 'fixed', width: "calc(100% - 30px)", top: 10, left: 15, right: 15, padding: 15}}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: 15,
        }}
      >
        <img
          onClick={() => navigate('/profile')}
          src={currentUser.photoUrl || 'https://placehold.co/80x80'}
          alt="Avatar"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            alignContent: 'right',
          }}
        />
        <span style={{ color: 'white', padding: '5px', width: '100%' }}>
          {currentUser.name}
        </span>
        {currentUser && <UserStats uid={currentUser.uid} />}
        </div>
      </div>
    </CSSTransition>
  );
};

export default Header;
