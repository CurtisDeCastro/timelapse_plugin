const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

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

    try {
      const response = await axios.request(config);
      const imageBuffer = Buffer.from(response.data);
      
      await fs.writeFile(`./public/media/frames/frame_${timeframe}.png`, imageBuffer);
      console.log(`downloadPNG.js - Frame ${timeframe} downloaded and saved.`);
    } catch (error) {
      console.log(error);
      throw new Error("Failed to download PNG");
    }
}

module.exports = downloadPNG;
