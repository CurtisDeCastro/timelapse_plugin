const axios = require('axios');
const GIFEncoder = require('gif-encoder-2');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;
const qs = require('qs');

// Initialize variables. THESE ARE ALL TO BE REPLACED BY THE PLUGIN HOOKS
const endpointUrl = 'https://api.sigmacomputing.com';
const gifWidth = 1600;
const gifHeight = 928;
const frameSpeed = 250;

async function addFrameToGIF(filePath, encoder) {
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
async function fetchQueryId(workbookId, nodeId, timeframe, sessionToken) {
    let data = JSON.stringify({
        "elementId": nodeId,
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

    if (nodeId === null){
        delete data.elementId;
    }

    console.log(`TIMEFRAME: ${timeframe}`,data);

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${endpointUrl}/v2/workbooks/${workbookId}/export`,
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
        url: `${endpointUrl}/v2/query/${queryId}/download`,
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
        url: `${endpointUrl}/v2/query/${queryId}/download`,
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

async function generateGif(clientId, clientSecret, workbookId, nodeId, timeframes) {
    const encoder = new GIFEncoder(gifWidth, gifHeight);

    encoder.setDelay(frameSpeed);
    encoder.start();

    let token = await getToken(clientId, clientSecret, endpointUrl);

    const queryIds = await Promise.all(timeframes.map(async time => {
        try {
            return await fetchQueryId(workbookId, nodeId, time, token);
        } catch (error) {
            console.error("Error fetching queryId:", error.message);
            return null;
        }
    }));

    const validQueryIds = queryIds.filter(Boolean);

    await Promise.all(validQueryIds.map((queryId, index) => {
        return pollForDownload(queryId, timeframes[index], token);
    }));

    for (const time of timeframes) {
        await addFrameToGIF(`./frames/frame_${time}.png`, encoder);
    }

    encoder.finish();
    const gifBuffer = encoder.out.getData();

    let random = Math.random().toString().split(".")[1];
    let filepath = './timelapse_'+ random + '.gif';
    await fs.writeFile(filepath, gifBuffer);

    console.log(`GIF has been saved as ${filepath}`);

    return filepath;  // Return the gif path
}

module.exports = generateGif;