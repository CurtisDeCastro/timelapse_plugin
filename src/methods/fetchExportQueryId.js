const axios = require('axios');

// Function to fetch chart from Sigma Computing API
async function fetchExportQueryId(timeframe, sessionToken, workbookId, elementId) {
    let data = JSON.stringify({
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

    if (elementId) {
        data.elementId = elementId;
    }

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
       console.log(config.data);
       const response = await axios.request(config);
       let { queryId } = response.data;
       console.log("Export Query ID Attained: ", queryId);
       return queryId;
    } catch (error) {
       console.log(error);
       throw new Error("Failed to fetch query ID");
    }
}    

module.exports = fetchExportQueryId;