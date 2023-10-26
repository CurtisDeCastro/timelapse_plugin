const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001; 
const cors = require('cors');
app.use(bodyParser.json()); 
app.use(cors({origin: 'http://localhost:3000'}));
const fs = require('fs');
const path = require('path');

// Import custom methods
const getToken = require('./methods/getToken.js');
const fetchExportQueryId = require('./methods/fetchExportQueryId.js');
const pollForDownload = require('./methods/pollForDownload.js');
const generateMOVFromFrames = require('./methods/generateMOVFromFrames.js');

// Need to work in the line below:
// async function Main(times, clientId, clientSecret, endpointUrl) {

async function generateTimelapseFromWorkbookData(props) {
    let { times, clientId, clientSecret, workbookId, elementId, endpointUrl } = props;

    times = times.sort((a, b) => a - b);

    let token = await getToken(clientId, clientSecret, endpointUrl);

    // Obtain all the queryIds first, then download them concurrently
    const queryIds = await Promise.all(times.map(async time => {
        try {
            return await fetchExportQueryId(time, token, workbookId, elementId);
        } catch (error) {
            console.error("Error fetching queryId:", error.message);
            return null; // Return null for failed attempts
        }
    }));

    // Filter out any null queryIds
    const validQueryIds = queryIds.filter(Boolean);

    // Download PNGs concurrently using Promise.all
    await Promise.all(validQueryIds.map((queryId, index) => {
        return pollForDownload(queryId, times[index], token);
    }));

    // Generate .mov from PNG frames
    let outputPath = `./public/media/videos/timelapse_${times[0]}-${times.reduce((a, b) => Math.max(a, b), -Infinity)}.mp4`;

    console.log('server.js - output path:', outputPath);

    await generateMOVFromFrames(outputPath, times);

    console.log(`Video has been saved as ${outputPath}`);
    return outputPath;
}

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
