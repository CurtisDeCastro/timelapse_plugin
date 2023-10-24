const checkDownloadStatus = require('./checkDownloadStatus.js');
const downloadPNG = require('./downloadPNG.js');

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

module.exports = pollForDownload;