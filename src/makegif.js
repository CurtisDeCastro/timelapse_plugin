const GIFEncoder = require('gif-encoder-2');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;

// Initialize GIF Encoder
const encoder = new GIFEncoder(800, 1035);
encoder.setDelay(100);
encoder.start();


async function Main() {

    // Function to add frame to GIF
    async function addFrameToGIF(filePath) {
        const canvas = createCanvas(800, 1035);
        const ctx = canvas.getContext('2d');
        const img = await loadImage(filePath);
        ctx.drawImage(img, 0, 0, 800, 1035);
        encoder.addFrame(ctx);
    }

    // Main function to create GIF
    async function createGIF() {
        let times = [];
        for (let i = 1990; i <= 2018; i++){
            times.push(i.toString());
        }
        // Sequentially fetch each chart and save it as a PNG
        for (const time of times) {
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
    createGIF().catch(err => console.log(err));
}

Main();