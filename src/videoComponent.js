// VideoComponent.jsx
import React, { useState } from 'react';
import ReactPlayer from 'react-player';

function VideoComponent() {
    const [url, setUrl] = useState('./babyNameDiversity.gif');
    const [playbackRate, setPlaybackRate] = useState(1.0);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('gif', file);

        const response = await fetch('http://localhost:3001/convert', {
            method: 'POST',
            body: formData,
        });

        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        setUrl(videoUrl);
    };

    return (
        <div>
            <input type="file" accept=".gif" onChange={handleFileChange} />
            {url && (
                <div>
                    <ReactPlayer
                        url={url}
                        controls
                        playbackRate={playbackRate}
                        width="100%"
                        height="auto"
                    />
                    <div>
                        <label>
                            Playback Speed:
                            <select
                                value={playbackRate}
                                onChange={(e) =>
                                    setPlaybackRate(parseFloat(e.target.value))
                                }
                            >
                                <option value="0.5">0.5x</option>
                                <option value="0.75">0.75x</option>
                                <option value="1">1x</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2">2x</option>
                            </select>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoComponent;
