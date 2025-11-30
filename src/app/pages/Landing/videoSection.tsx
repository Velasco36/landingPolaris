import React from "react";
import VideoPlayer from "./VideoPlayer";
import "./videoSection.css";
import FramePlayer from "./VideoPlayer";

const VideoSection: React.FC = () => {
  return (
    <>
      <section className="video-section">
        {/* Fondo estático */}
        <div id="neural-network" />

        {/* Contenido principal */}
        <div className="video-section-content">
          <div className="video-section-inner">
            <h1 className="video-section-title">
              Tu Sección de Video
            </h1>
            <p className="video-section-subtitle">
              Con partículas animadas en fondo #000d46 y efectos neuronales flotantes.
            </p>
          </div>
        </div>
      </section>

      <FramePlayer />
    </>
  );
};

export default VideoSection;
