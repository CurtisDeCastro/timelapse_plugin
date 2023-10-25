import axios from 'axios';

// Destructure the props in the function parameter
function VideoGenerator(props) {

  const handleGenerateVideo = async () => {
      try {
        const response = await axios.post('http://localhost:3001/generateVideo', props)
          .then((response) => (props.handleVideoSrcUpdate(response.data[0].path)));
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
