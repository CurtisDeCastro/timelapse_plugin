const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001; 
const cors = require('cors');
app.use(bodyParser.json()); 
app.use(express.json());
app.use(cors({origin: 'http://localhost:3000'}));
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Import custom methods
const clearDirectory = require('./methods/clearDirectory.js');
const generateTimelapseFromWorkbookData = require('./methods/generateTimelapseFromWorkbookData.js');


app.post('/generate-presigned-url', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    try {
      const { accessKey, secretKey, bucketName, region, workbookId, nodeId, fileName } = req.body;

      let timestamp = new Date(Date.now()).toISOString().replace(/[:.-]/g, '_');

      console.log(timestamp);
  
      const s3 = new AWS.S3({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: region,
      });

      const filenameWithTimestamp = encodeURIComponent(fileName.split('.')[0].replace(' ', '_') + `_(${timestamp}).mp4`);
  
      const params = {
        Bucket: bucketName,
        Key: `${workbookId}/${filenameWithTimestamp}`,  // or any other filename
        ContentType: 'video/mp4',
        ACL: 'public-read',  // Adjust as needed
      };

      if(nodeId) {
        params.Key = `${workbookId}/${nodeId}/${filenameWithTimestamp}`;
      };
  
      const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
      res.json({ url: presignedUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

app.get('/get-video-source', (req, res) => {
    const filePath = path.join(__dirname, '../public/media/assets/VideoSourcePath.txt');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Send the file contents
        res.send(data);
    });
});

app.post('/get-latest-video', async (req, res) => {

  const { workbookId, elementId, accessKey, secretKey, bucketName, region } = req.body;

  console.log(req.body)

  // Set up AWS credentials
  AWS.config.update({
    region,
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  });

  // Create an S3 client
  const s3 = new AWS.S3();

  // Construct the prefix based on WorkbookId and optional NodeId
  const prefix = `${workbookId}/${elementId ? `${elementId}/` : ''}`;

  // Define the parameters for listing objects
  const params = {
    Bucket: bucketName,
    Prefix: prefix,
  };
  if (params.Bucket) {
    try {
      console.log(params)
      // List objects in the specified S3 bucket and prefix
      const data = await s3.listObjectsV2(params).promise();

      // Filter and sort to find the most recently created video
      const latestVideo = data.Contents
                              .filter(item => item.Key.endsWith('.mp4'))
                              .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))[0];

      if (latestVideo) {
        // Construct the S3 URL
        const url = `https://${bucketName}.s3.${region}.amazonaws.com/${latestVideo.Key}`;
        res.json({ src: url, generated: true });
      } else {
        res.status(404).json({ error: 'No videos found' });
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      res.status(500).json({ error: 'Error fetching videos' });
    }
  }
  
});

app.post('/generateVideo', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    
    const props = req.body;

    try {
        clearDirectory(path.join(__dirname, '../public/media/frames/'))
        let generatedVideoPath = await generateTimelapseFromWorkbookData(props);
        console.log(generatedVideoPath);
        
        let outputPath = path.join(__dirname, '../public/media/assets/VideoSourcePath.txt');

        // Ensure the directory exists
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        // Write to the file
        fs.writeFileSync(outputPath, generatedVideoPath.split('public')[1], 'utf8');
        
        res.status(200).send([{path: generatedVideoPath}, { message: "Video generated successfully!" }]);
    } catch (error) {
        console.error("Error while generating video:", error);
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
