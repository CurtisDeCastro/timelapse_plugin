const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001; // or any other available port
const cors = require('cors');
app.use(bodyParser.json()); 
app.use(cors({origin: 'http://localhost:3000'}));

// Import required libraries
const axios = require('axios');
const { clientId, clientSecret } = require('../credentials');
const fs = require('fs').promises;
const qs = require('qs');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize variables. THESE ARE ALL TO BE REPLACED BY THE PLUGIN HOOKS
const endpointUrl = 'https://api.sigmacomputing.com';
const elementId = 'W57dA_aYUo';
const workbookId = '5pk17PBfdW3CKyZ2QJbMxY';
let times = [];

// Function to obtain session token from Sigma Computing API
async function getToken(clientId, clientSecret, endpointUrl) {
    let data = qs.stringify({
      'grant_type': 'client_credentials',
      'client_id': clientId,
      'client_secret': clientSecret 
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: endpointUrl + '/v2/auth/token',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    try {
      const response = await axios.request(config);
      console.log("TOKEN: ", response.data.access_token);
      return response.data.access_token;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to obtain session token");
    }
}

// Function to fetch chart from Sigma Computing API
async function fetchQueryId(elementId, timeframe, sessionToken) {
    let data = JSON.stringify({
        // "elementId": elementId,
        "format": {
            "type": "png"
        },
        "filters": {
            "timeframe": timeframe
        },
        "timeout": 5000,
        "rowLimit": 1000000,
        "offset": 0
    });

    console.log(`TIMEFRAME: ${timeframe}`,data);

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://api.sigmacomputing.com/v2/workbooks/${workbookId}/export`,
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        data : data
    };

    try {
       const response = await axios.request(config);
       console.log("QUERY ID: ", response.data.queryId);
       return response.data.queryId;
    } catch (error) {
       console.log(error);
       throw new Error("Failed to fetch query ID");
    }
}      

async function downloadPNG(queryId, timeframe, sessionToken) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.sigmacomputing.com/v2/query/${queryId}/download`,
        responseType: 'arraybuffer',
        headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
        }
    };

    console.log(`TIMEFRAME: ${timeframe}`);

    try {
      const response = await axios.request(config);
      const imageBuffer = Buffer.from(response.data);
      await fs.writeFile(`./frames/frame_${timeframe}.png`, imageBuffer);
      console.log("Image downloaded and saved.");
    } catch (error) {
      console.log(error);
      throw new Error("Failed to download PNG");
    }
}

// Polling function for downloadPNG
async function pollForDownload(queryId, timeframe, token, maxAttempts = 300, interval = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        let status = await checkDownloadStatus(queryId, token);

        if (status === 200) {
            console.log(`DOWNLOADING QUERY ID: ${queryId}`, `TIMEFRAME: ${timeframe}`)
            return await downloadPNG(queryId, timeframe, token);
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    console.error("Max polling attempts reached. Unable to download PNG.");
    throw new Error("Download PNG poll timeout.");
}

async function checkDownloadStatus(queryId, token) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.sigmacomputing.com/v2/query/${queryId}/download`,
        responseType: 'arraybuffer',
        headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const response = await axios.request(config);
        return response.status;
    } catch (error) {
        // Return the error status if available, otherwise return 0
        return error.response?.status || 0;
    }
}

async function generateMOVFromFrames(outputPath, framePattern, times) {

    const frameListPath = './frameList.txt';
    const framePaths = times.map(time => `file './frames/frame_${time}.png'`).join('\n');
    await fs.writeFile(frameListPath, framePaths);

    return new Promise((resolve, reject) => {
        console.log("MAKING MOVIE");
        ffmpeg()
            .input(frameListPath)
            .inputOptions(['-f concat', '-safe 0'])
            .inputFPS(5)  // Set this to your desired frame rate
            .videoCodec('libx264')  // Using the x264 codec for .mov format
            .toFormat('mp4')
            .on('end', resolve)
            .on('error', (err) => {
                console.error("FFmpeg error:", err);
                reject(err);
            })
            .save(outputPath);
    });
}

async function Main(times) {
    console.log("RUNNING MAIN", JSON.stringify(times))
    let token = await getToken(clientId, clientSecret, endpointUrl);

    // Obtain all the queryIds first, then download them concurrently
    const queryIds = await Promise.all(times.map(async time => {
        try {
            return await fetchQueryId(elementId, time, token);
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
    let outputPath = `./timelapse_${times[0]}-${times.reduce((a, b) => Math.max(a, b), -Infinity)}.mp4`;
    let framePattern = './frames/frame_%d.png';  // FFmpeg pattern for frames

    await generateMOVFromFrames(outputPath, framePattern, times);

    console.log(`Video has been saved as ${outputPath}`);
}

app.post('/generateVideo', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");  // Notice the double slashes after "http:"
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    times = req.body.times;

    try {
      console.log("TRYING TIMES", times)
      await Main(times);
      res.status(200).send({ message: "Video generated successfully!" });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
