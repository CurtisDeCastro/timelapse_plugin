import React from 'react';

const SaveVideo = ({ videoSrc, AwsAccessKey, secretKey, bucketName, region, workbookId, nodeId, fileName }) => {
  const handleUpload = async () => {
    try {
      // Fetch presigned URL from the server
      const response = await fetch('http://localhost:3001/generate-presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessKey: AwsAccessKey,
          secretKey,
          bucketName,
          region,
          workbookId,
          nodeId, 
          fileName
        }),
      });
      const { url } = await response.json();

      // Fetch the video file from the provided videoSrc
      const videoResponse = await fetch(videoSrc);
      const videoBlob = await videoResponse.blob();

      // Upload the video file to S3 using the presigned URL
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: videoBlob,
        headers: {
          'Content-Type': 'video/mp4',
        },
      });

      if (uploadResponse.ok) {
        console.log('Video uploaded successfully!');
      } else {
        console.error('Failed to upload video:', uploadResponse.statusText);
      }
    } catch (error) {
      console.error('An error occurred:', error.message);
    }
  };

  return (
    <button onClick={handleUpload}>Save Video to S3</button>
  );
};

export default SaveVideo;
