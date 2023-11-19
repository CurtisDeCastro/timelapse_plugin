const path = require('path');
const AWS = require('aws-sdk');
const fs = require('fs');

// Import custom methods
const getToken = require('./getToken.js');
const fetchExportQueryId = require('./fetchExportQueryId.js');
const pollForDownload = require('./pollForDownload.js');
const generateMOVFromFrames = require('./generateMOVFromFrames.js');
const clearDirectory = require('./clearDirectory.js');

async function generateTimelapseFromWorkbookData(props) {
    let { times, clientId, clientSecret, workbookId, elementId, endpointUrl, s3Config } = props;

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

    // Clear the frames directory before generating the .mov file
    console.log(path.join(__dirname, '../public/media/frames'));
    await clearDirectory(path.join(__dirname, '../public/media/frames'));

    // Generate .mov from PNG frames
    let outputPath = `./public/media/videos/timelapse_${times[0]}-${times.reduce((a, b) => Math.max(a, b), -Infinity)}.mp4`;

    console.log('generateTimelapse function - output path:', outputPath);

    await generateMOVFromFrames(outputPath, times).then(
        (result) => {
            const s3 = new AWS.S3({
                accessKeyId: s3Config.accessKeyId,
                secretAccessKey: s3Config.secretAccessKey,
                region: s3Config.region,
            });

            const fileContent = fs.readFileSync(outputPath);

            const params = {
                Bucket: s3Config.bucketName,
                Key: `${s3Config.workbookId}${s3Config.elementId ? '/' + s3Config.elementId : ''}/timelapse_${Math.min(...times)}-${Math.max(...times)}.mp4`,
                Body: fileContent,
                ACL: 'public-read',
                ContentType: 'video/mp4'
            };

            s3.upload(params, function(err, data) {
                if (err) {
                    throw err;
                }
                console.log(`File uploaded successfully. ${data.Location}`);
            });
        }
    )

    console.log(`Video has been saved as ${outputPath}`);
    return outputPath;
}

module.exports = generateTimelapseFromWorkbookData;