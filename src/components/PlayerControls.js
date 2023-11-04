import React, { useState, useEffect } from 'react';
import VideoGenerator from "./videoGenerator.js";

function PlayerControls(props) {
  const {
    playing, 
    setPlaying, 
    played, 
    setPlayed,
    duration, 
    metaData, 
    playerRef, 
    videoGeneratorProps, 
    url, 
    volume, 
    setVolume, 
    playbackRate, 
    setPlaybackRate,
    loop,
    setLoop,
  } = props;

  const [hovered, setHovered] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

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

  const handleSeekChange = (e) => {
    const value = parseFloat(e.target.value);
    
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

  return (
    <div 
      className={`controls-container d-flex align-items-center justify-content-between ${hovered ? 'hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0, 0, 0, 0.5)', padding: '20px 20px' }}
    >
      <button className="btn btn-outline-light" onClick={() => setPlaying(!playing)}>
        {playing ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
      </button>
      <button 
        className={`btn ${loop ? 'btn-primary' : 'btn-outline-light'}`}
        onClick={() => { setLoop(!loop); setPlaying(!loop); }}
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
    </div>
  );
}

export default PlayerControls;
