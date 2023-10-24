import axios from 'axios';

function VideoGenerator(times) {
    
    const handleGenerateVideo = async () => {
        console.log(JSON.stringify(times));
        try {
          const response = await axios.post('http://localhost:3001/generateVideo', {times: times.times});
          console.log(response.data.message);
        } catch (error) {
          console.error("Error generating video:", error.response);
        }
    };

    return (
        <div>
            <button onClick={handleGenerateVideo}>Generate Video</button>
        </div>
    );
}

export default VideoGenerator;