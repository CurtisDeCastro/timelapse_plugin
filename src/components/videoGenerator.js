import axios from 'axios';

// Destructure the props in the function parameter
function VideoGenerator(times) {
  console.log("VG TIMES", times);

  const handleGenerateVideo = async () => {
      try {
        const response = await axios.post('http://localhost:3001/generateVideo', times);
        // handleVideoSrcUpdate(response.data.path);
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
