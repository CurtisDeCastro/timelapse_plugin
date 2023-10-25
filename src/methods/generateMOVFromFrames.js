const fs = require('fs').promises;
const path = require('path');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

async function generateMOVFromFrames(outputPath, times) {
    const frameListAbsolutePath = path.resolve('./public/media/assets/frameList.txt')

    // const frameListPath = '../../public/media/assets/frameList.txt';
    // const frameListPath = './public/media/assets/frameList.txt';

    const framePaths = times.map((time) => {
        let frameAbsolutePath = path.resolve(`./public/media/frames/frame_${time}.png`);
        let pathName = `file '${frameAbsolutePath}'`;
        console.log("generateMOV - pathName", pathName);
        return pathName;
    }).join('\n');
    await fs.writeFile(frameListAbsolutePath, framePaths).then(() => console.log("SUCCESSFULLY UPDATED frameList.txt"));

    return new Promise((resolve, reject) => {
        console.log("MAKING MOVIE");
        ffmpeg()
            .input(frameListAbsolutePath)
            .inputOptions(['-f concat', '-safe 0'])
            .inputFPS(5)  // Set this to your desired frame rate
            .videoCodec('libx264')  // Using the x264 codec for .mov format
            .toFormat('mp4')
            .on('end', resolve)
            .on('stderr', console.error)
            .on('error', (err) => {
                console.error("FFmpeg error:", err);
                reject(err);
            })
            .save(outputPath);
    });
}

module.exports = generateMOVFromFrames;