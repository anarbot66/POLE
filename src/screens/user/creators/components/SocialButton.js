const SocialButton = ({ icon, link }) => {
    return (
      <div 
        style={{
          alignSelf: 'stretch',
          padding: 15,
          background: '#212124',
          borderRadius: 15,
          alignItems: 'center',
          gap: 9,
          display: 'inline-flex',
          cursor: 'pointer'
        }}
        onClick={() => window.open(link, '_blank')}
      >
        <div style={{ width: 20, height: 20 }}>
          {icon}
        </div>
        <div 
          style={{ 
            flex: '1 1 0',
            textAlign: 'right',
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            color: 'white', 
            fontSize: 14, 
            fontFamily: 'Inter', 
            fontWeight: '400', 
            wordWrap: 'break-word'
          }}
        >
          {link}
        </div>
      </div>
    );
  };
  
  export default SocialButton;