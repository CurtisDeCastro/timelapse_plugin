const fs = require('fs');
const path = require('path');

async function clearDirectory(directory) {
    // Check if directory exists
    if (fs.existsSync(directory)) {
        const files = await fs.promises.readdir(directory); // Note that we use fs.promises here
  
        for (const file of files) {
            const filePath = path.join(directory, file);
            await fs.promises.unlink(filePath); // Again, using fs.promises
        }
    } else {
        console.warn(`Directory ${directory} does not exist!`);
    }
}

module.exports = clearDirectory;