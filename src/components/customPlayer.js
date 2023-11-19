/* eslint-disable jsx-a11y/no-access-key */
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import VideoGenerator from "./videoGenerator.js";
import PlayerOverlayDiv from "./PlayerOverlayDiv.js";
import SaveVideo from './SaveVideo.js';
import './styles/CustomPlayer.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function CustomPlayer(props) {
  // Destructure props
  const { url, metaData, videoGeneratorProps } = props;

  console.log("URL:",url)

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
  const [volume, setVolume] = useState(0.8);
  const [showVolumeControl, setShowVolumeControl] = useState(false); // Add this line

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

    // ... useEffect to auto-hide the volume control ...
  useEffect(() => {
    let timeout;
    if (showVolumeControl) {
      timeout = setTimeout(() => setShowVolumeControl(false), 3000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [showVolumeControl]);

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
  }, [playbackRate, playbackRates]);

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

  const { videoSrc, accessKey, secretKey, bucketName, region, workbookId, nodeId, fileName } = metaData;

  return (
    <div 
      style={{ position: 'relative', paddingBottom: '56.25%', height: 0, width: '100%' }}
      onMouseMove={showControls}
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
        volume={volume}
      />
      <PlayerOverlayDiv onClick={togglePlayPause} playing={playing} showIcon={showIcon} />
      <div 
        className={`controls-container d-flex align-items-center justify-content-between ${hovered ? 'hovered' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0, 0, 0, 0.5)', padding: '20px 20px' }}
      >
        <button className="btn btn-outline-light" onClick={(e) => { setPlaying(!playing); e.currentTarget.blur(); }}>
          {playing ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
        </button>
        <button 
          className={`btn ${loop ? 'btn-primary' : 'btn-outline-light'}`}
          onClick={(e) => { setLoop(!loop); setPlaying(!loop); e.currentTarget.blur(); }}
        >
          <i className="fas fa-redo-alt"></i>
        </button>
        <div className="mx-3 d-flex align-items-center">
          <select className="custom-select btn-outline-light" style={{borderColor: 'white', color: 'white', backgroundColor: 'transparent'}} value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}>
            {playbackRates.map(rate => (
              <option key={rate} value={rate}>{rate}x</option>
            ))}
          </select>
        </div>
        <div className="mx-3 d-flex align-items-center position-relative">
          <button className="btn btn-outline-light" onClick={() => setShowVolumeControl(!showVolumeControl)}>
            <i className="fas fa-volume-up"></i>
          </button>
          {showVolumeControl && (
            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: '100%',
              marginLeft: '-50px',
              marginBottom: '10px',
              padding: '5px',
              backgroundColor: 'white',
              borderRadius: '5px',
              boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)'
            }}>
              <input
                type="range"
                min={0}
                max={1}
                step="any"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="custom-range"
                style={{ width: '100px' }}
              />
            </div>
          )}
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step="any"
          value={played}
          onChange={handleSeekChange}
          style={{ flexGrow: 1, margin: '0 16px' }}
          className="custom-range"
        />
        {url && <VideoGenerator {...videoGeneratorProps} />}
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light" download>
          <i className="fas fa-download"></i>
        </a>
        <SaveVideo 
          videoSrc={videoSrc}
          AwsAccessKey={accessKey}
          secretKey={secretKey}
          bucketName={bucketName}
          region={region}
          workbookId={workbookId}
          nodeId={nodeId}
          fileName={fileName}
        />
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
