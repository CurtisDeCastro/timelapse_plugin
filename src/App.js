import React, { useRef, useState } from 'react';
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
    { name: 'Element ID (optional)', type: 'text'},
]);

const VideoPlayer = () => {
    const config = useConfig();
    const sigmaData = useElementData(config.source);
    const times = sigmaData[client.config.getKey("Timeframe")];
    const clientId = sigmaData[client.config.getKey("Client ID*")];
    const clientSecret = sigmaData[client.config.getKey("Client Secret*")];
    const workbookId = sigmaData[client.config.getKey("Workbook ID*")];
    const elementId = sigmaData[client.config.getKey("Element ID (optional)")];
    // const videoSrc = 'public/media/videos/timelapse_2010-2018.mp4';
    const videoRef = useRef(null);
    
    const [videoSrc, setVideoSrc] = useState('');

    const handleVideoSrcUpdate = (path) => {
        setVideoSrc(path);
    };


    if (times) {
    console.log("Times in App.js:", times);
      return (
        <VideoGenerator times={times} />
      )
    }

    return (
        <div>
            <video
                ref={videoRef}
                width="1920"
                height="1080"
                src={videoSrc}
                controls={true}
            />
        </div>
    )
};

export default VideoPlayer;
