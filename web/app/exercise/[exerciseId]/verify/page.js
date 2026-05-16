"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExerciseById } from "../../../../lib/exercise-data";
import {
  createPoseLandmarker,
  detectPoseForVideo,
  drawPoseCanvas,
  getCalibrationFeedback,
  getPrimaryLandmarks
} from "../../../../lib/pose-utils";

export default function ExerciseVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const exercise = getExerciseById(params.exerciseId);

  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const frameRef = useRef(null);
  const poseRef = useRef(null);
  const streamRef = useRef(null);
  const validFrameCountRef = useRef(0);
  const lastValidAtRef = useRef(0);
  const autoRedirectTimeoutRef = useRef(null);
  const hasRedirectedRef = useRef(false);

  const [cameraState, setCameraState] = useState("loading");
  const [positionStatus, setPositionStatus] = useState("checking");
  const [guidance, setGuidance] = useState("Loading camera and pose tracking...");
  const [canContinue, setCanContinue] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const stopTracking = () => {
    if (autoRedirectTimeoutRef.current) {
      clearTimeout(autoRedirectTimeoutRef.current);
      autoRedirectTimeoutRef.current = null;
    }
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function prepareCameraAndPose() {
      try {
        const [stream, poseLandmarker] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user"
            },
            audio: false
          }),
          createPoseLandmarker()
        ]);

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        poseRef.current = poseLandmarker;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraState("ready");
      } catch (error) {
        setCameraState("error");
        setPositionStatus("invalid");
        setGuidance("Camera access is needed before calibration can continue.");
      }
    }

    prepareCameraAndPose();

    return () => {
      cancelled = true;
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (cameraState !== "ready") return undefined;

    let cancelled = false;

    const renderFrame = () => {
      if (cancelled) return;

      const video = videoRef.current;
      const canvas = overlayRef.current;
      const poseLandmarker = poseRef.current;

      if (!video || !canvas) {
        frameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const result = detectPoseForVideo(poseLandmarker, video, performance.now());
      const landmarks = getPrimaryLandmarks(result);
      const feedback = getCalibrationFeedback(landmarks);

      // TODO: Add exercise-specific calibration rules here if different poses need custom framing.
      setPositionStatus(feedback.positionStatus);

      if (feedback.positionStatus === "valid") {
        validFrameCountRef.current += 1;
        lastValidAtRef.current = Date.now();

        if (validFrameCountRef.current >= 8) {
          setCanContinue(true);
          setAlertMessage("");
          setGuidance("Great. Position confirmed. You can continue to the demo.");

          if (!hasRedirectedRef.current && !autoRedirectTimeoutRef.current) {
            autoRedirectTimeoutRef.current = setTimeout(() => {
              if (hasRedirectedRef.current) return;
              hasRedirectedRef.current = true;
              stopTracking();
              router.push(`/exercise/${exercise.id}/demo`);
            }, 900);
          }
        } else {
          setGuidance("Hold still for a moment while we confirm your position.");
        }
      } else {
        validFrameCountRef.current = 0;
        if (autoRedirectTimeoutRef.current) {
          clearTimeout(autoRedirectTimeoutRef.current);
          autoRedirectTimeoutRef.current = null;
        }

        if (Date.now() - lastValidAtRef.current > 1500) {
          setCanContinue(false);
        }

        setGuidance(feedback.message);
      }

      drawPoseCanvas({
        canvas,
        video,
        landmarks,
        zone: true
      });

      frameRef.current = requestAnimationFrame(renderFrame);
    };

    frameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [cameraState, exercise.id, router]);

  const getProceedAlertMessage = () => {
    if (cameraState === "error") {
      return "You need to allow camera access before you proceed.";
    }

    if (cameraState !== "ready") {
      return "You need to wait for the camera and pose tracking to finish loading before you proceed.";
    }

    if (positionStatus === "checking") {
      return "You need to hold still inside the blue zone while we confirm your position before you proceed.";
    }

    return `You need to ${guidance.charAt(0).toLowerCase()}${guidance.slice(1).replace(/\.$/, "")} before you proceed.`;
  };

  const handleContinue = () => {
    if (!canContinue) {
      setAlertMessage(getProceedAlertMessage());
      return;
    }

    setAlertMessage("");
    hasRedirectedRef.current = true;
    stopTracking();
    router.push(`/exercise/${exercise.id}/demo`);
  };

  return (
    <main className="page fade-in">
      <div className="container">
        <div className="card flow-card">
          <div className="flow-header">
            <div>
              <div className="hero-badge">POSITION VERIFICATION</div>
              <h1 className="title flow-title">Stand Inside the Blue Zone</h1>
              <p className="subtitle flow-subtitle">
                Please stand inside the blue zone so we can detect your posture correctly for{" "}
                {exercise.title}.
              </p>
            </div>
            <div className={`status-pill ${positionStatus}`}>{positionStatus}</div>
          </div>

          <div className="flow-layout">
            <section className="verify-camera-panel">
              <div className="verify-video-shell">
                <video ref={videoRef} className="verify-video" autoPlay playsInline muted />
                <canvas ref={overlayRef} className="verify-overlay" />
                {cameraState !== "ready" && (
                  <div className="verify-video-cover">
                    <div className="loading" />
                    <p>{cameraState === "error" ? "Unable to access camera." : "Starting webcam..."}</p>
                  </div>
                )}
              </div>
            </section>

            <aside className="verify-side-panel">
              <div className="flow-tip-card">
                <h3>Live Guidance</h3>
                <p>{guidance}</p>
              </div>
              <div className="flow-tip-card">
                <h3>Calibration Tips</h3>
                <ul className="flow-list">
                  {exercise.calibrationTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="flow-tip-card">
                <h3>Before You Continue</h3>
                <ul className="flow-list">
                  <li>Make sure your whole body is inside the frame.</li>
                  <li>Stand still for a moment so the skeleton can lock in.</li>
                  <li>Keep the room bright enough for the camera to see you.</li>
                </ul>
              </div>
            </aside>
          </div>

          <div className="flow-actions end">
            <button className="btn btn-outline" onClick={() => router.push("/exercises")}>
              Back to Exercises
            </button>
            <button
              className="btn btn-primary"
              aria-disabled={!canContinue}
              onClick={handleContinue}
            >
              Continue to Demo
            </button>
          </div>

          {alertMessage && (
            <div className="flow-alert" role="alert" aria-live="polite">
              {alertMessage}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
