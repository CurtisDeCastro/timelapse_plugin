import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import VideoGenerator from "./components/videoGenerator.js";
// import './App.css';

import {
	client,
	useConfig,
	useElementData,
} from "@sigmacomputing/plugin";

client.config.configureEditorPanel([
	{ name: "source", type: "element" },
	{ name: "Timeframe", type: "column", source: "source", allowMultiple: false, allowedTypes: ['boolean', 'datetime', 'number', 'integer', 'text', 'variant', 'link', 'error'] },
    { name: 'Client Secret*', type: 'text', secure: true},
    { name: 'Client ID*', type: 'text', secure: true},
    { name: 'Workbook ID*', type: 'text'},
    { name: 'Element ID (optional)', type: 'text'},
    { name: 'Endpoint URL*', type: 'text'},
]);

const VideoPlayer = () => {
    const config = useConfig();
    const sigmaData = useElementData(config.source);
    
    const requestParams = {
        times: sigmaData[client.config.getKey("Timeframe")],
        clientId: client.config.getKey("Client ID*"),
        clientSecret: client.config.getKey("Client Secret*"),
        workbookId: client.config.getKey("Workbook ID*"),
        elementId: client.config.getKey("Element ID (optional)"),
        endpointUrl: client.config.getKey("Endpoint URL*")
    }

    const {times, clientId, clientSecret, workbookId, elementId, endpointUrl } = requestParams;
    // const videoSrc = '/media/videos/timelapse_2010-2018.mp4';

    const [videoSrc, setVideoSrc] = useState('');

    useEffect(() => {
        console.log("video source: ", videoSrc);
      }, [videoSrc]);

    const handleVideoSrcUpdate = (path) => {
        console.log("changing video src to path: ",path);
        setVideoSrc('.'+path);
    };

    if (times && videoSrc.length === 0) {
      return (
        <VideoGenerator
          times={times} 
          clientId={clientId}
          clientSecret={clientSecret}
          workbookId={workbookId}
          elementId={elementId}
          endpointUrl={endpointUrl}
          handleVideoSrcUpdate={handleVideoSrcUpdate}
        />
      )
    }

    return (
        <div>
          <ReactPlayer 
            url={videoSrc} 
            playing={true} 
            controls={true} 
            width='1920' 
            height='1080' 
          />
        </div>
    )
};

export default VideoPlayer;
