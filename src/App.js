import React, { useState, useEffect } from 'react';
import CustomPlayer from './components/customPlayer.js';
import VideoGenerator from "./components/videoGenerator.js";
import AWS from 'aws-sdk';
import axios from 'axios';

import {
	client,
	useConfig,
	useElementData,
} from "@sigmacomputing/plugin";

client.config.configureEditorPanel([
	{ name: "source", type: "element" },
	{ name: "Timeframe", type: "column", source: "source", allowMultiple: false, allowedTypes: [
    'boolean', 'datetime', 'number', 'integer', 'text', 'variant', 'link', 'error'
  ] },
  { name: 'Client Secret*', type: 'text', secure: true},
  { name: 'Client ID*', type: 'text', secure: true},
  { name: 'Workbook ID*', type: 'text'},
  { name: 'Element ID (optional)', type: 'text'},
  { name: 'Endpoint URL*', type: 'text'},
  { name: 'Video Source', type: 'text'},
  { name: 'AWS Access Key', type: 'text', secure: true },
  { name: 'AWS Secret Key', type: 'text', secure: true },
  { name: 'S3 Bucket Name', type: 'text' },
  { name: 'AWS Region', type: 'text' },
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
        accessKey: client.config.getKey('AWS Access Key'),
        secretKey: client.config.getKey('AWS Secret Key'),
        bucketName: client.config.getKey('S3 Bucket Name'),
        region: client.config.getKey('AWS Region'),
    }

    let {
      times, 
      clientId, 
      clientSecret, 
      workbookId, 
      elementId, 
      endpointUrl, 
      videoSource, 
      accessKey, 
      secretKey, 
      bucketName, 
      region, 
    } = workbookParams;

    
    const [videoSrc, setVideoSource] = useState(videoSource);

    useEffect(() => {
      if (!videoSource || !validURL(videoSource)) {
        axios.post('http://localhost:3001/get-latest-video', { workbookId, elementId, accessKey, secretKey, bucketName, region })
        .then(response => {
          setVideoSource(response.data.src);
        })
        .catch(error => {
          console.error('Error fetching the file:', error);
        })
      }
    }, [videoSource, workbookId, elementId, accessKey, secretKey, bucketName, region ]);

    useEffect(() => {
        console.log("video source: ", videoSrc);
      }, [videoSrc]);

    useEffect(() => {
        console.log('VideoPlayer mounted');
        return () => {
            console.log('VideoPlayer will unmount');
        };
    }, []);

    const handleVideoSrcUpdate = (path) => {
      console.log("changing video src to path: ", path.split('public')[1]);
      setVideoSource({ src: path.split('public')[1], generated: true });
  };

    if (times) {
      const metaData = {
        frameCount: times.length, 
        frameRange: [times[0], times[times.length-1]],
        videoSrc: videoSrc,
        accessKey,
        secretKey,
        bucketName,
        region,
        workbookId,
        nodeId: elementId,
        fileName: videoSrc
      };
      let videoGeneratorProps = {
        times: times.sort((a, b) => a - b), 
        clientId: clientId,
        clientSecret: clientSecret,
        workbookId: workbookId,
        elementId: elementId,
        endpointUrl: endpointUrl,
        handleVideoSrcUpdate: handleVideoSrcUpdate,
        s3Config: {
          accessKey: accessKey,
          secretKey: secretKey,
          region: region,
          bucketName: bucketName,
          videoSrc: videoSrc,
          AwsAccessKey: accessKey,
          nodeId: elementId,
          fileName: videoSrc,
          workbookId,
          elementId,
        }
      };
      return (
        <div style={{ width: '100%', height: '100%', background: 'transparent', marginTop: '0'}}>
            {videoSrc.length < 1 ?
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
              url={videoSrc} 
              playing={true} 
              controls={true} 
              width='100%' 
              height='100%'
              metaData={metaData}
              videoGeneratorProps={videoGeneratorProps}
            />
          </div>
      )
    } else if (!times && videoSrc) {
     return(
      <div style={{ width: '100%', height: '100%', background: 'transparent', marginTop: '0'}}>
        <CustomPlayer 
          url={videoSrc}
          playing={true} 
          controls={true} 
          width='100%' 
          height='100%'
        />
      </div>
    ) 
    } else {
      return (<p>Loading...</p>)
    }
};

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}

export default App;