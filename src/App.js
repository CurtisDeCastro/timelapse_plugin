import React, { useState, useEffect } from 'react';
import CustomPlayer from './components/customPlayer.js';
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
  { name: 'Video Source', type: 'text'},
]);

const App = () => {
    const config = useConfig();
    const sigmaData = useElementData(config.source);
    
    const workbookParams = {
        times: sigmaData[client.config.getKey("Timeframe")],
        clientId: client.config.getKey("Client ID*"),
        clientSecret: client.config.getKey("Client Secret*"),
        workbookId: client.config.getKey("Workbook ID*"),
        elementId: client.config.getKey("Element ID (optional)"),
        endpointUrl: client.config.getKey("Endpoint URL*"),
        videoSource: client.config.getKey('Video Source'),
    }

    let {times, clientId, clientSecret, workbookId, elementId, endpointUrl, videoSource } = workbookParams;

    const [videoState, setVideoState] = useState({ src: videoSource, generated: false });

    useEffect(() => {
      fetch('http://localhost:3001/get-video-source')
          .then(response => response.text())
          .then(data => {
              setVideoState({ src: data, generated: true });
          })
          .catch(error => console.error('Error fetching the file:', error));
  }, []);


    useEffect(() => {
        console.log("video source: ", videoState.src);
        console.log("video generated?", videoState.generated);
      }, [videoState.src, videoState.generated]);

    useEffect(() => {
        console.log('VideoPlayer mounted');
        return () => {
            console.log('VideoPlayer will unmount');
        };
    }, []);

    const handleVideoSrcUpdate = (path) => {
      console.log("changing video src to path: ", path.split('public')[1]);
      setVideoState({ src: path.split('public')[1], generated: true });
  };

    if (times) {
      let videoGeneratorProps = {
        times: times.sort((a, b) => a - b), 
        clientId: clientId,
        clientSecret: clientSecret,
        workbookId: workbookId,
        elementId: elementId,
        endpointUrl: endpointUrl,
        handleVideoSrcUpdate: handleVideoSrcUpdate,
      };
      return (
        <div style={{ width: '100%', height: '100%' }}>
            {videoState.src.length < 1 ?
              <VideoGenerator
                times={times.sort((a, b) => a - b)} 
                clientId={clientId}
                clientSecret={clientSecret}
                workbookId={workbookId}
                elementId={elementId}
                endpointUrl={endpointUrl}
                handleVideoSrcUpdate={handleVideoSrcUpdate}
              /> : null
            }
            <CustomPlayer 
              url={videoState.src} 
              playing={true} 
              controls={true} 
              width='100%' 
              height='100%'
              metaData={{frameCount: times.length, frameRange: [times[0], times[times.length-1]]}}
              videoGeneratorProps={videoGeneratorProps}
            />
          </div>
      )
    } else if (!times && videoState.src) {
     return(
      <div>
        <CustomPlayer 
          url={videoState.src} 
          playing={true} 
          controls={true} 
          width='100%' 
          height='100%'
        />
      </div>
    ) 
    } else {
      return (<text>Loading...</text>)
    }
};

export default App;
