const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001; 
const cors = require('cors');
app.use(bodyParser.json()); 
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

      let timestamp = new Date(Date.now()).toISOString();
      console.log(timestamp);
  
      const s3 = new AWS.S3({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: region,
      });

      const filenameWithTimestamp =  fileName.split('.')[0].replace(' ','_')+'_('+timestamp+').'+fileName.split('.')[1];
  
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
