function PlayerOverlayDiv(props) {

  const { onClick, showIcon, playing } = props;

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      {showIcon && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '3em',
          color: 'white',
          opacity: 0.7,
          width: '2em',
          height: '2em',
          display: 'flex',              // Added to make this a flex container
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '10px', // This will give you rounded corners. Adjust the px value to your preference
          backgroundColor: 'rgba(128, 128, 128, 0.6)'
        }}>
          {playing ? '▶❚❚' : '❚❚'}
        </div>
      )}
    </div>
  );
}

export default PlayerOverlayDiv;