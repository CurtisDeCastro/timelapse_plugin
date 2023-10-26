const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001; 
const cors = require('cors');
app.use(bodyParser.json()); 
app.use(cors({origin: 'http://localhost:3000'}));
const fs = require('fs');
const path = require('path');

// Import custom methods
const clearDirectory = require('./methods/clearDirectory.js');
const generateTimelapseFromWorkbookData = require('./methods/generateTimelapseFromWorkbookData.js');

app.get('/get-video-source', (req, res) => {
    const filePath = path.join(__dirname, '../public/media/assets/VideoSourcePath.txt');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Send the file contents
        res.send(data);
    });
});

app.post('/generateVideo', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    
    const props = req.body;

    try {
        clearDirectory(path.join(__dirname, '../public/media/frames/'))
        let generatedVideoPath = await generateTimelapseFromWorkbookData(props);
        console.log(generatedVideoPath);
        
        let outputPath = path.join(__dirname, '../public/media/assets/VideoSourcePath.txt');

        // Ensure the directory exists
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        // Write to the file
        fs.writeFileSync(outputPath, generatedVideoPath.split('public')[1], 'utf8');
        
        res.status(200).send([{path: generatedVideoPath}, { message: "Video generated successfully!" }]);
    } catch (error) {
        console.error("Error while generating video:", error);
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
