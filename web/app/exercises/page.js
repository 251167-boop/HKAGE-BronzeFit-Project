"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import "./exercises.css";
import { EXERCISE_LIST } from "../../lib/exercise-data";

export default function ExerciseSelectionPage() {
  const router = useRouter();
  const [hoveredExercise, setHoveredExercise] = useState(null);

  const handleExerciseSelect = (exercise) => {
    localStorage.setItem("selectedExercise", JSON.stringify(exercise));
    router.push(`/exercise/${exercise.id}/verify`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner": return "#10b981";
      case "Intermediate": return "#f59e0b";
      case "Advanced": return "#ef4444";
      default: return "#475569";
    }
  };

  return (
    <main className="page fade-in">
      <div className="container">
        <div className="card exercise-card">
          <div className="exercise-header">
            <div className="hero-badge">CHOOSE YOUR WORKOUT</div>
            <h1 className="title hero-title">Select Your Exercise</h1>
            <p className="subtitle hero-subtitle">
              Choose an exercise that matches your comfort level and fitness goals. 
              Each exercise includes safety tips and demonstration videos.
            </p>
          </div>

          <div className="exercise-grid">
            {EXERCISE_LIST.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`exercise-item ${hoveredExercise === exercise.id ? 'hovered' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredExercise(exercise.id)}
                onMouseLeave={() => setHoveredExercise(null)}
                onClick={() => handleExerciseSelect(exercise)}
              >
                <div className="exercise-icon">
                  <span className="icon-emoji">{exercise.icon}</span>
                </div>
                
                <div className="exercise-content">
                  <h3 className="exercise-title">{exercise.title}</h3>
                  <p className="exercise-position">{exercise.position}</p>
                  <p className="exercise-benefits">{exercise.benefits}</p>
                  
                  <div className="exercise-meta">
                    <div className="meta-item">
                      <span className="meta-label">Difficulty:</span>
                      <span 
                        className="meta-value difficulty-badge"
                        style={{ backgroundColor: getDifficultyColor(exercise.difficulty) }}
                      >
                        {exercise.difficulty}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Duration:</span>
                      <span className="meta-value">{exercise.duration}</span>
                    </div>
                  </div>

                  <div className="exercise-actions">
                    <button className="btn btn-primary btn-small">
                      <span>Start Exercise</span>
                      <span className="btn-icon">→</span>
                    </button>
                  </div>
                </div>

                {/* Hover overlay with demo preview */}
                {hoveredExercise === exercise.id && (
                  <div className="exercise-preview">
                    <div className="preview-video">
                      <video 
                        src={exercise.demoVideo} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="preview-video-element"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="video-placeholder" style={{display: 'none'}}>
                        <span className="placeholder-icon">🎥</span>
                        <span>Demo Video</span>
                      </div>
                    </div>
                    <div className="preview-tips">
                      <h4>Safety Tips:</h4>
                      <ul>
                        {exercise.safetyTips.map((tip, tipIndex) => (
                          <li key={tipIndex}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="exercise-footer">
            <div className="safety-banner">
              <span className="safety-icon">🛡️</span>
              <div className="safety-content">
                <h4>Safety First</h4>
                <p>Always consult with your healthcare provider before starting any exercise program. Start slowly and listen to your body.</p>
              </div>
            </div>

            <div className="exercise-actions-footer">
              <button 
                className="btn btn-outline"
                onClick={() => router.push('/check')}
              >
                <span>← Back to System Check</span>
              </button>
              <Link href="/family" className="btn btn-outline">
                <span>Family Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
