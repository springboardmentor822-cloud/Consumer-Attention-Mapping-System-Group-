import { useState } from "react";
import api from "../api/client";
import Layout from "../components/Layout";

export default function VideoUpload() {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [processedVideo, setProcessedVideo] = useState("");

  const handleUpload = async () => {
    if (!video) {
      alert("Please select a video.");
      return;
    }

    const formData = new FormData();
    formData.append("file", video);

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post(
        "/cameras/upload-video",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(response.data.message);

      setProcessedVideo(
        "http://127.0.0.1:8000/" + response.data.output_file
      );
    } catch (err) {
      console.log(err);
      setMessage("Upload Failed");
    }

    setLoading(false);
  };

  return (
    <Layout title="Video Upload">
      <div className="max-w-xl mx-auto bg-white shadow rounded-lg p-6">

        <h2 className="text-2xl font-bold mb-6">
          Consumer Attention Mapping
        </h2>

        <input
          type="file"
          accept=".mp4,.avi,.mov"
          onChange={(e) => setVideo(e.target.files[0])}
          className="mb-4"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded"
        >
          {loading ? "Processing..." : "Upload Video"}
        </button>

        <p className="mt-4 text-green-600">
          {message}
        </p>

        {processedVideo && (
          <div className="mt-6">
            <h3 className="font-bold mb-2">
              Processed Video
            </h3>

            <video
              width="700"
              controls
            >
              <source
                src={processedVideo}
                type="video/mp4"
              />
            </video>
          </div>
        )}
      </div>
    </Layout>
  );
}