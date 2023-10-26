import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import './styles/CustomPlayer.css';

function CustomPlayer(props) {
  CustomPlayer.defaultProps = {
    metaData: {
      frameCount: 0
      // You can add other default properties for metaData here
    }
  };

  const { url, metaData } = props;
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [loop, setLoop] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showIcon, setShowIcon] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [progressInterval, setProgressInterval] = useState(1000);
  const playerRef = useRef(null);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    if (duration && metaData && metaData.frameCount) {
      const frameDuration = duration / metaData.frameCount;
      setProgressInterval(frameDuration * 1000);
    } else {
      setProgressInterval(100); // Default value
    }
  }, [duration, metaData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        setPlaying((prevPlaying) => !prevPlaying);
        e.preventDefault();
      }

      if (e.code === "ArrowUp") {
        const currentRateIndex = playbackRates.indexOf(playbackRate);
        if (currentRateIndex < playbackRates.length - 1) {
          setPlaybackRate(playbackRates[currentRateIndex + 1]);
        }
        e.preventDefault();
      }

      if (e.code === "ArrowDown") {
        const currentRateIndex = playbackRates.indexOf(playbackRate);
        if (currentRateIndex > 0) {
          setPlaybackRate(playbackRates[currentRateIndex - 1]);
        }
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [playbackRate]);

  useEffect(() => {
    if (duration && metaData.frameCount) {
      const frameDuration = duration / metaData.frameCount;
      setProgressInterval(frameDuration * 1000);
    } else {
      setProgressInterval(100);
    }
  }, [duration, metaData]);

  const handleDuration = (value) => {
    setDuration(value);
  };

  const handleSeekChange = (e) => {
    const value = parseFloat(e.target.value);
    console.log(`duration: ${duration}, value: ${value}`);
    
    if (metaData && metaData.frameCount) {
      const frameNumber = Math.floor(value * metaData.frameCount);
      if (frameNumber === metaData.frameCount - 1) { // Last frame
        const lastFrameDuration = duration / metaData.frameCount;
        const timeForLastFrame = duration - lastFrameDuration;
        setPlayed(timeForLastFrame / duration);
        playerRef.current.seekTo(timeForLastFrame, "seconds");
      } else {
        setPlayed(value);
        playerRef.current.seekTo(value * duration, "seconds");
      }
    }
    // Calculate which frame the current value corresponds to

  };
  
  const handleProgress = (state) => {
    if (state.played < 0.99) { // Prevents played from being 1
      setPlayed(state.played);
    }
  };

  const togglePlayPause = () => {
    setPlaying(prev => !prev);
    setShowIcon(true);
    setTimeout(() => setShowIcon(false), 1500);
  };

  const showControls = () => {
    setHovered(true);
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }

    // Hide the controls after 2 seconds of mouse inactivity
    const timeout = setTimeout(() => {
        setHovered(false);
    }, 1500);

    setHoverTimeout(timeout);
  };

  useEffect(() => {
    console.log("Current played value:", played);
  }, [played]);

  return (
    <div 
      style={{ position: 'relative', paddingBottom: '56.25%', height: 0, width: '100%' }}
      onMouseMove={showControls} // Detect mouse movements here
    >
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls={false}
        onProgress={handleProgress}
        progressInterval={progressInterval}
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        loop={loop}
        playbackRate={playbackRate}
        onDuration={handleDuration}
      />

      {/* Overlay Div */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 50px)',  // Assuming controls height is approximately 50px
          cursor: 'pointer'
        }}
        onClick={togglePlayPause}
      ></div>

      {/* Play/Pause Icon */}
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

      <div 
        className={`controls-container ${hovered ? 'hovered' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button onClick={(e) => { setPlaying(!playing); e.currentTarget.blur(); }}>
          {playing ? "Pause" : "Play"}
        </button>
        <button onClick={(e) => { setLoop(!loop); e.currentTarget.blur(); }}>
          {loop ? "Unloop" : "Loop"}
        </button>
        <label style={{ margin: '0 16px' }}>
          Speed:
          <select value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}>
            {playbackRates.map(rate => (
              <option key={rate} value={rate}>{rate}x</option>
            ))}
          </select>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step="any"
          value={played}
          onChange={handleSeekChange}
          style={{ flexGrow: 1, margin: '0 16px' }}
        />
        <a href={url} target="_blank" rel="noopener noreferrer">Download</a>
      </div>
    </div>
  );
}

export default CustomPlayer;
