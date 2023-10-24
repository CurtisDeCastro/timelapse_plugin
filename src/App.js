import React, { useRef, useState } from 'react';
import axios from 'axios';
import VideoGenerator from "./components/videoGenerator.js";

import './App.css';

import {
	client,
	useConfig,
	useElementColumns,
	useElementData,
} from "@sigmacomputing/plugin";

client.config.configureEditorPanel([
	{ name: "source", type: "element" },
	{ name: "Timeframe", type: "column", source: "source", allowMultiple: false, allowedTypes: ['boolean', 'datetime', 'number', 'integer', 'text', 'variant', 'link', 'error'] },
    { name: 'Client Secret*', type: 'text', secure: true},
    { name: 'Client ID*', type: 'text', secure: true},
    { name: 'Workbook ID*', type: 'text'},
    { name: 'Node ID (optional)', type: 'text'},
]);

const VideoPlayer = () => {
    // const times = client.config.getKey("Timeframe").split('-')[1].split("/")[0];
    const config = useConfig();
    const sigmaData = useElementData(config.source);
    const times = sigmaData[client.config.getKey("Timeframe")];
    console.log(times);
    // const videoSrc = 'public/media/videos/timelapse_2010-2018.mp4';
    const videoSrc = '';

    const videoRef = useRef(null);

    const [currentTime, setCurrentTime] = useState(0);


    const handleTimeUpdate = () => {
        setCurrentTime(videoRef.current.currentTime);
    };


    if (times) {
      return (<VideoGenerator times={times.sort()} />)
    }

    return (
        <div>
            <video
                ref={videoRef}
                width="1920"
                height="1080"
                onTimeUpdate={handleTimeUpdate}
                src={videoSrc}
                controls={true}
            />
        </div>
    )
};

export default VideoPlayer;
