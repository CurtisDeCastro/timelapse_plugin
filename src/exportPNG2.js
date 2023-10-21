// Import required libraries
const axios = require('axios');
const GIFEncoder = require('gif-encoder-2');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;
const qs = require('qs');

// Initialize variables
const clientId = 'f83f31de8eb7c696d2e7f9ad1deeaab4b6873e5dea33183ae4b35b46a1cf26ca';
const apiToken = 'a3570c4e6f799eefebb9420ef0c347d8eb2298449aa4ee505f9fcc3c41b1138a5510138c27fe5fcfd5f5ae6dc6c7667551392f99e8f7f3a6d4be711d3ce4e92e';
const endpointUrl = 'https://api.sigmacomputing.com';
const elementId = 'W57dA_aYUo';
const workbookId = '5pk17PBfdW3CKyZ2QJbMxY';

let times = [];
for (let x = 1990; x <= 2018; x++) {
    times.push(x.toString())
}

// Initialize GIF Encoder
const encoder = new GIFEncoder(1600, 2070);
encoder.setDelay(500);
encoder.start();

// Function to add frame to GIF
async function addFrameToGIF(filePath) {
    const canvas = createCanvas(1600, 2070);
    const ctx = canvas.getContext('2d');
    const img = await loadImage(filePath);
    ctx.drawImage(img, 0, 0, 1600, 2070);
    encoder.addFrame(ctx);
}

// Function to obtain a session token from Sigma Computing API
async function obtainSessionToken(clientId, apiToken, endpointUrl) {
    let data = qs.stringify({
      'grant_type': 'client_credentials',
      'client_id': clientId,
      'client_secret': apiToken 
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
        "elementId": elementId,
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
async function pollForDownload(queryId, timeframe, token, maxAttempts = 40, interval = 1000) {
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

    let token = await obtainSessionToken(clientId, apiToken, endpointUrl);

    for (const time of times) {
        console.log(time);
        try {
            let queryId = await fetchQueryId(elementId, time, token);
            if (!queryId) {
                console.error("Invalid queryId received");
                continue; // Continue to the next year if there's an issue with the current one
            }
            await pollForDownload(queryId, time, token);
        } catch (error) {
            console.error("Error in Main:", error.message);
        }
    }
    // Main function to create GIF
    async function createGIF(times) {
        console.log(times, typeof times)
        // Sequentially fetch each chart and save it as a PNG
        for (const time of times) {
        console.log(time)
        await addFrameToGIF(`./frames/frame_${time}.png`);
        }
    
        // Finish and save GIF
        encoder.finish();
        const gifBuffer = encoder.out.getData();
    
        // Save GIF to local file system
        await fs.writeFile('./timelapse.gif', gifBuffer);
    
        console.log('GIF has been saved as timelapse.gif');
    }
    
    // Run the script
    createGIF(times).catch(err => console.log(err));
}

Main(times);
