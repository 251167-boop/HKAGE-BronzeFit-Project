"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExerciseById } from "../../../../lib/exercise-data";

// Helper to detect YouTube URLs and extract video ID
function getYouTubeVideoId(url) {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/v\/([^?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function isYouTubeUrl(url) {
  return !!getYouTubeVideoId(url);
}

export default function ExerciseDemoPage() {
  const params = useParams();
  const router = useRouter();
  const exercise = getExerciseById(params.exerciseId);
  const [videoError, setVideoError] = useState(false);

  const goToSession = () => {
    router.push(`/session?exercise=${exercise.id}`);
  };

  const demoVideo = exercise?.demoVideo;
  const isYouTube = isYouTubeUrl(demoVideo);
  const youtubeId = isYouTube ? getYouTubeVideoId(demoVideo) : null;

  return (
    <main className="page fade-in">
      <div className="container">
        <div className="card flow-card demo-only-card">
          <div className="flow-header">
            <div>
              <div className="hero-badge">DEMO VIDEO</div>
              <h1 className="title flow-title">{exercise.title}</h1>
              <p className="subtitle flow-subtitle">
                Watch the movement first, then proceed when you are ready to follow the skeleton guide.
              </p>
            </div>
          </div>

          <div className="demo-only-stage">
            {isYouTube && youtubeId && !videoError ? (
              <div className="youtube-embed-container">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&rel=0`}
                  title={`${exercise.title} demonstration`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setVideoError(true)}
                />
              </div>
            ) : demoVideo && !isYouTube && !videoError ? (
              <video
                className="demo-only-video"
                src={demoVideo}
                autoPlay
                muted
                loop
                playsInline
                controls
                onError={() => setVideoError(true)}
              />
            ) : (
              <div className="demo-fallback">
                <div className="placeholder-icon">🎥</div>
                <h3>Demo Video Placeholder</h3>
                <p>
                  {videoError 
                    ? "The video could not be loaded. Please try again later."
                    : "A safe placeholder is shown because the exercise video is not available yet."}
                </p>
                {!videoError && (
                  <p className="demo-todo">
                    TODO: Add the actual demonstration video for {exercise.title}.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="demo-info-strip">
            <div className="flow-tip-card">
              <h3>What to copy</h3>
              <ul className="flow-list">
                {exercise.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flow-actions between">
            <button className="btn btn-outline" onClick={() => router.push(`/exercise/${exercise.id}/verify`)}>
              Back to Calibration
            </button>
            <div className="demo-cta-group">
              <button className="btn btn-outline demo-skip-btn" onClick={goToSession}>
                Skip
              </button>
              <button className="btn btn-primary demo-proceed-btn" onClick={goToSession}>
                Proceed to Exercise
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
