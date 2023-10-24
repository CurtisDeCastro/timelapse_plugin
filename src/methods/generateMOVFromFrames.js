const fs = require('fs').promises;

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

async function generateMOVFromFrames(outputPath, times) {

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

module.exports = generateMOVFromFrames;