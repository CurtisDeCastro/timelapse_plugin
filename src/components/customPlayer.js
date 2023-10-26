import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import VideoGenerator from "./videoGenerator.js";
import './styles/CustomPlayer.css';

function CustomPlayer(props) {
  // Destructure props
  const { url, metaData, videoGeneratorProps } = props;

  // State declarations
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [loop, setLoop] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showIcon, setShowIcon] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [progressInterval, setProgressInterval] = useState(1000);

  // References
  const playerRef = useRef(null);

  // Constants
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Calculate progress interval based on metadata and duration
  useEffect(() => {
    if (duration && metaData && metaData.frameCount) {
      const frameDuration = duration / metaData.frameCount;
      setProgressInterval(frameDuration * 1000);
    } else {
      setProgressInterval(100); // Default value
    }
  }, [duration, metaData]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        setPlaying((prevPlaying) => !prevPlaying);
        e.preventDefault();
      }

      const currentRateIndex = playbackRates.indexOf(playbackRate);
      if (e.code === "ArrowUp" && currentRateIndex < playbackRates.length - 1) {
        setPlaybackRate(playbackRates[currentRateIndex + 1]);
        e.preventDefault();
      }

      if (e.code === "ArrowDown" && currentRateIndex > 0) {
        setPlaybackRate(playbackRates[currentRateIndex - 1]);
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [playbackRate]);

  // Debugging purposes
  useEffect(() => {
    console.log("Current played value:", played);
  }, [played]);

  // Handlers
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

    const timeout = setTimeout(() => {
      setHovered(false);
    }, 1500);

    setHoverTimeout(timeout);
  };

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
          height: '100%',  // Assuming controls height is approximately 50px
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
        <button 
          style={{ backgroundColor: loop ? '#007BFF' : '#CCCCCC', color: loop ? 'white' : 'black' }}
          onClick={(e) => { setLoop(!loop); setPlaying(!loop); e.currentTarget.blur(); }}
        >
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
        {url && <VideoGenerator {...videoGeneratorProps} />}
        <a href={url} target="_blank" rel="noopener noreferrer">Download</a>
      </div>
    </div>
  );
}

// Default props for the CustomPlayer component
CustomPlayer.defaultProps = {
  metaData: {
    frameCount: 0
    // Other default properties for metaData can be added here
  }
};

export default CustomPlayer;
