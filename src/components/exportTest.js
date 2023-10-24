// Import required libraries
const axios = require('axios');
const GIFEncoder = require('gif-encoder-2');
const { clientId, clientSecret } = require('./credentials');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;
const qs = require('qs');


// Initialize variables. THESE ARE ALL TO BE REPLACED BY THE PLUGIN HOOKS
const endpointUrl = 'https://api.sigmacomputing.com';
const elementId = 'W57dA_aYUo';
const workbookId = '5pk17PBfdW3CKyZ2QJbMxY';
const gifWidth = 1600;
const gifHeight = 928;
const frameSpeed = 250;
let times = [];
for (let x = 1910; x <= 2018; x++) {
    times.push(x.toString())
}

// Initialize GIF Encoder
const encoder = new GIFEncoder(gifWidth, gifHeight);
encoder.setDelay(frameSpeed);
encoder.start();

// Function to add frame to GIF
async function addFrameToGIF(filePath) {
    const canvas = createCanvas(gifWidth, gifHeight);
    const ctx = canvas.getContext('2d');
    const img = await loadImage(filePath);
    ctx.drawImage(img, 0, 0, gifWidth, gifHeight);
    encoder.addFrame(ctx);
}

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

    console.log(`TIMEFRAME: ${timeframe}`,config);

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
            console.log(`QUERY ID: ${queryId}`, `TIMEFRAME: ${timeframe}`)
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

async function Main(times) {
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

    // Sequentially add frames to the GIF
    for (const time of times) {
        await addFrameToGIF(`./frames/frame_${time}.png`);
    }

    // Finish and save GIF
    encoder.finish();
    const gifBuffer = encoder.out.getData();

    // Save GIF to local file system
    let random = Math.random().toString().split(".")[1]
    let filepath = './timelapse_'+ random + '.gif';
    await fs.writeFile(filepath, gifBuffer);

    console.log(`GIF has been saved as ${filepath}`);
}

Main(times).catch(err => console.log(err));