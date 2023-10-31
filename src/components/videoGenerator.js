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
          <button 
            className="btn btn-outline-light" 
            onClick={handleGenerateVideo}
          >
            <i className="fas fa-video" />
          </button>
      </div>
  );
}

export default VideoGenerator;