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
          opacity: 0.7
        }}>
          {playing ? '▶❚❚' : '❚❚'}
        </div>
      )}
    </div>
  );
}

export default PlayerOverlayDiv;