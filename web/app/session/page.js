"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getExerciseById } from "../../lib/exercise-data";
import {
  comparePoseToReference,
  createPoseLandmarker,
  detectPoseForVideo,
  drawPoseCanvas,
  drawReferenceCanvas,
  getPrimaryLandmarks
} from "../../lib/pose-utils";

const HR_MIN = 78;
const HR_MAX = 132;
const HIGH_BPM_ALERT_THRESHOLD = 120;
const LAST_SESSION_KEY = "silverfit:lastSessionAt";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toDayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function getCompletionBand(percent) {
  if (percent >= 100) return 20;
  if (percent >= 75) return 15;
  if (percent >= 50) return 10;
  if (percent >= 25) return 5;
  return 0;
}

function getMovementBand(percent) {
  if (percent >= 90) return 25;
  if (percent >= 75) return 20;
  if (percent >= 60) return 15;
  if (percent >= 40) return 10;
  return 5;
}

function getConsistencyBand(daysPerWeek) {
  if (daysPerWeek >= 7) return 15;
  if (daysPerWeek >= 5) return 12;
  if (daysPerWeek >= 3) return 9;
  if (daysPerWeek >= 1) return 5;
  return 0;
}

function getDurationBand(minutes) {
  if (minutes >= 30) return 10;
  if (minutes >= 20) return 7;
  if (minutes >= 10) return 5;
  if (minutes >= 5) return 3;
  return 0;
}

function getRecoveryBand(minutesToRecover) {
  if (minutesToRecover <= 5) return 5;
  if (minutesToRecover <= 10) return 3;
  if (minutesToRecover <= 15) return 1;
  return 0;
}

function getHeartRateBand(avgHeartRate, dangerousLevelTriggered) {
  if (dangerousLevelTriggered) {
    return 0;
  }

  if (avgHeartRate >= HR_MIN && avgHeartRate <= HR_MAX) {
    return 25;
  }

  const deviation =
    avgHeartRate < HR_MIN ? HR_MIN - avgHeartRate : avgHeartRate - HR_MAX;

  if (deviation <= 10) return 15;
  if (deviation <= 20) return 10;
  return 5;
}

function getRatingCategory(totalScore) {
  if (totalScore >= 90) return "Excellent Health";
  if (totalScore >= 75) return "Good Health";
  if (totalScore >= 60) return "Fair Health";
  if (totalScore >= 40) return "Needs Improvement";
  return "Consult Doctor";
}

function getWeeklyExerciseDays(previousSessions) {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);

  const uniqueDays = new Set([toDayKey(today)]);
  previousSessions.forEach((session) => {
    if (!session?.createdAt) return;
    const sessionDate = new Date(session.createdAt);
    if (sessionDate >= cutoff) {
      uniqueDays.add(toDayKey(session.createdAt));
    }
  });

  return uniqueDays.size;
}

function getRecoveryMinutes(heartRateTimeline) {
  if (!heartRateTimeline.length) return null;

  let peakIndex = 0;
  for (let index = 1; index < heartRateTimeline.length; index += 1) {
    if (heartRateTimeline[index].bpm > heartRateTimeline[peakIndex].bpm) {
      peakIndex = index;
    }
  }

  for (let index = peakIndex; index < heartRateTimeline.length; index += 1) {
    const sample = heartRateTimeline[index];
    if (sample.bpm >= HR_MIN && sample.bpm <= HR_MAX) {
      const elapsedMs = sample.timestamp - heartRateTimeline[peakIndex].timestamp;
      return elapsedMs / 60000;
    }
  }

  return null;
}

function buildHealthScore({
  avgHeartRate,
  currentRep,
  durationSec,
  targetReps,
  targetDuration,
  averagePoseSimilarity,
  weeklyExerciseDays,
  dangerousLevelTriggered,
  heartRateTimeline
}) {
  const repCompletionPercent = targetReps > 0 ? (currentRep / targetReps) * 100 : 0;
  const durationCompletionPercent = targetDuration > 0 ? (durationSec / targetDuration) * 100 : 0;
  const completionPercent = clamp(
    Math.round((repCompletionPercent + durationCompletionPercent) / 2),
    0,
    100
  );
  const movementAccuracyPercent = clamp(Math.round(averagePoseSimilarity), 0, 100);
  const durationMinutes = durationSec / 60;
  const recoveryMinutes = getRecoveryMinutes(heartRateTimeline);

  const breakdown = {
    heartRate: getHeartRateBand(avgHeartRate, dangerousLevelTriggered),
    exerciseCompletion: getCompletionBand(completionPercent),
    movementAccuracy: getMovementBand(movementAccuracyPercent),
    consistency: getConsistencyBand(weeklyExerciseDays),
    duration: getDurationBand(durationMinutes),
    recoveryRate: recoveryMinutes === null ? 0 : getRecoveryBand(recoveryMinutes)
  };

  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    total,
    category: getRatingCategory(total),
    completionPercent,
    movementAccuracyPercent,
    weeklyExerciseDays,
    recoveryMinutes,
    breakdown
  };
}

function SessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const referenceCanvasRef = useRef(null);
  const monitorRef = useRef({ outSince: null, emergencySent: false });
  const intervalRef = useRef({ hr: null, timer: null });
  const streamRef = useRef(null);
  const poseRef = useRef(null);
  const frameRef = useRef(null);
  const lastCorrectAtRef = useRef(0);
  const previousStatusRef = useRef("not_detected");
  const poseMetricsRef = useRef({ sum: 0, count: 0 });
  const heartRateTimelineRef = useRef([]);
  const highBpmAlertTriggeredRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hr, setHr] = useState(0);
  const [wrongMoves, setWrongMoves] = useState(0);
  const [feedback, setFeedback] = useState("Align your posture with the reference.");
  const [hrHistory, setHrHistory] = useState([]);
  const [report, setReport] = useState("");
  const [finalized, setFinalized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [currentRep, setCurrentRep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [poseScore, setPoseScore] = useState(0);
  const [postureStatus, setPostureStatus] = useState("not_detected");
  const [cameraState, setCameraState] = useState("loading");
  const [showReference, setShowReference] = useState(true);
  const [modelImageError, setModelImageError] = useState(false);

  // MQTT / UNIHIKER heart rate state
  const [unihikerStatus, setUnihikerStatus] = useState("waiting"); // waiting, connected, disconnected
  const [unihikerData, setUnihikerData] = useState(null);
  const [showHighBpmWarning, setShowHighBpmWarning] = useState(false);
  const mqttBridgeUrl = process.env.NEXT_PUBLIC_MQTT_BRIDGE_URL || "http://localhost:3001";

  // Draggable data box state
  const [dataBoxPos, setDataBoxPos] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, boxX: 0, boxY: 0 });
  const dataBoxRef = useRef(null);

  // Drag handlers
  const handleDragStart = useCallback((clientX, clientY) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      boxX: dataBoxPos.x,
      boxY: dataBoxPos.y
    };
  }, [dataBoxPos]);

  const handleDragMove = useCallback((clientX, clientY) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    // Get panel dimensions for boundary constraints
    const panel = document.querySelector('.exercise-webcam-panel');
    const boxWidth = dataBoxRef.current?.offsetWidth || 320;
    const boxHeight = dataBoxRef.current?.offsetHeight || 400;

    let newX = dragStartRef.current.boxX + deltaX;
    let newY = dragStartRef.current.boxY + deltaY;

    // Constrain within panel bounds
    if (panel) {
      const panelRect = panel.getBoundingClientRect();
      newX = Math.max(8, Math.min(newX, panelRect.width - boxWidth - 8));
      newY = Math.max(8, Math.min(newY, panelRect.height - boxHeight - 8));
    }

    setDataBoxPos({ x: newX, y: newY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const onMouseDown = useCallback((e) => {
    // Only start drag if clicking on the header/title area, not buttons
    if (e.target.closest('.overlay-actions') || e.target.closest('button')) return;
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  // Touch events
  const onTouchStart = useCallback((e) => {
    if (e.target.closest('.overlay-actions') || e.target.closest('button')) return;
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  // Global move/end listeners
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const exerciseId =
    searchParams.get("exercise") ||
    JSON.parse(typeof window !== "undefined" ? localStorage.getItem("selectedExercise") || "null" : "null")?.id ||
    "wall-push-up";
  const exercise = useMemo(() => getExerciseById(exerciseId), [exerciseId]);

  useEffect(() => {
    let cancelled = false;

    async function startSessionCamera() {
      try {
        const [stream, poseLandmarker] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
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
        setStartedAt(Date.now());
        setRunning(true);
        setCameraState("ready");
      } catch (e) {
        setCameraState("error");
        setFeedback("Cannot access camera. Please grant camera permission.");
      }
    }

    startSessionCamera();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      clearInterval(intervalRef.current.hr);
      clearInterval(intervalRef.current.timer);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current.timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current.timer);
  }, [running]);

  // MQTT Bridge SSE Connection for UNIHIKER heart rate
  useEffect(() => {
    if (!running) return;

    const eventSource = new EventSource(`${mqttBridgeUrl}/events`);

    eventSource.onopen = () => {
      setUnihikerStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "heartrate") {
          const bpm = data.payload.bpm;
          const sampleTimestamp = data.payload.timestamp
            ? Number(data.payload.timestamp) * 1000
            : Date.now();
          setUnihikerData(data.payload);
          setHr(bpm);
          setHrHistory((prev) => [...prev, bpm].slice(-3600));
          heartRateTimelineRef.current = [
            ...heartRateTimelineRef.current.slice(-3599),
            { bpm, timestamp: sampleTimestamp }
          ];
          // Show high BPM warning if bpm > 120
          if (bpm > HIGH_BPM_ALERT_THRESHOLD) {
            highBpmAlertTriggeredRef.current = true;
            setShowHighBpmWarning(true);
          } else {
            setShowHighBpmWarning(false);
          }
        }
      } catch (e) {
        // Ignore malformed messages
      }
    };

    eventSource.onerror = () => {
      setUnihikerStatus("disconnected");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [running, mqttBridgeUrl]);

  useEffect(() => {
    if (!running || cameraState !== "ready") return undefined;
    let cancelled = false;

    const renderFrame = () => {
      if (cancelled) return;

      const video = videoRef.current;
      const overlay = overlayRef.current;
      const poseLandmarker = poseRef.current;

      if (!video || !overlay) {
        frameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const result = detectPoseForVideo(poseLandmarker, video, performance.now());
      const landmarks = getPrimaryLandmarks(result);
      const comparison = comparePoseToReference(landmarks, exercise.referencePose);

      setPostureStatus(comparison.postureStatus);
      setPoseScore(comparison.similarity);
      setFeedback(comparison.message);

      drawPoseCanvas({
        canvas: overlay,
        video,
        landmarks,
        referencePose: showReference ? exercise.referencePose : null,
        postureStatus: comparison.postureStatus
      });

      if (
        comparison.postureStatus === "correct" &&
        previousStatusRef.current !== "correct" &&
        Date.now() - lastCorrectAtRef.current > 1500
      ) {
        lastCorrectAtRef.current = Date.now();
        setCurrentRep((prev) => prev + 1);
      }

      if (
        comparison.postureStatus === "incorrect" &&
        previousStatusRef.current !== "incorrect"
      ) {
        setWrongMoves((prev) => prev + 1);
      }

      if (comparison.postureStatus !== "not_detected") {
        poseMetricsRef.current.sum += comparison.similarity;
        poseMetricsRef.current.count += 1;
      }

      if (comparison.postureStatus !== "not_detected") {
        previousStatusRef.current = comparison.postureStatus;
      } else {
        previousStatusRef.current = "not_detected";
      }

      frameRef.current = requestAnimationFrame(renderFrame);
    };

    frameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [running, cameraState, exercise, showReference]);

  useEffect(() => {
    setModelImageError(false);
  }, [exercise.id]);

  useEffect(() => {
    const drawPanel = () => {
      drawReferenceCanvas({
        canvas: referenceCanvasRef.current,
        referencePose: exercise.referencePose,
        overlayPose: exercise.modelOverlayPose,
        showBackdrop: modelImageError || !exercise.modelImage
      });
    };

    drawPanel();
    window.addEventListener("resize", drawPanel);
    return () => window.removeEventListener("resize", drawPanel);
  }, [exercise, modelImageError]);

  useEffect(() => {
    if (!running || paused || hr <= 0) return;
    const inRange = hr >= HR_MIN && hr <= HR_MAX;
    const now = Date.now();
    if (inRange) {
      monitorRef.current.outSince = null;
      return;
    }
    if (!monitorRef.current.outSince) {
      monitorRef.current.outSince = now;
      return;
    }
    const elapsed = now - monitorRef.current.outSince;
    if (elapsed >= 6000 && !monitorRef.current.emergencySent) {
      monitorRef.current.emergencySent = true;
      setPaused(true);
      setRunning(false);
      fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `SilverFit Emergency: HR stayed out of safe range (${HR_MIN}-${HR_MAX}) for 6+ seconds. Current HR: ${hr} bpm. Exercise: ${exercise.title}`
        })
      });
    }
  }, [hr, running, paused, exercise.title]);

  const endSession = async () => {
    if (saving || finalized) return;
    setSaving(true);
    setRunning(false);
    localStorage.setItem(LAST_SESSION_KEY, String(Date.now()));

    const avgHeartRate = hrHistory.length
      ? Math.round(hrHistory.reduce((a, b) => a + b, 0) / hrHistory.length)
      : 0;
    const peakHeartRate = hrHistory.length ? Math.max(...hrHistory) : 0;
    const durationSec = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const calories = Math.max(0, Math.round((durationSec / 60) * 3.5));
    const averagePoseSimilarity = poseMetricsRef.current.count
      ? poseMetricsRef.current.sum / poseMetricsRef.current.count
      : poseScore;

    let previousSessions = [];
    try {
      const sessionsRes = await fetch("/api/sessions", { cache: "no-store" });
      const sessionsData = await sessionsRes.json();
      previousSessions = sessionsData?.sessions || [];
    } catch (e) {
      previousSessions = [];
    }

    const scoreDetails = buildHealthScore({
      avgHeartRate,
      currentRep,
      durationSec,
      targetReps: exercise.targetReps,
      targetDuration: exercise.targetDuration,
      averagePoseSimilarity,
      weeklyExerciseDays: getWeeklyExerciseDays(previousSessions),
      dangerousLevelTriggered:
        highBpmAlertTriggeredRef.current || monitorRef.current.emergencySent || peakHeartRate > HIGH_BPM_ALERT_THRESHOLD,
      heartRateTimeline: heartRateTimelineRef.current
    });
    const score = scoreDetails.total;

    let generatedReport = `Great job completing your ${exercise.title.toLowerCase()} session! Keep your posture aligned and move safely.`;
    let reportSource = "local";
    try {
      const aiRes = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: {
            exercise: exercise.title,
            avgHeartRate,
            peakHeartRate,
            wrongMoves,
            durationSec,
            score,
            currentRep,
            scoreCategory: scoreDetails.category,
            completionPercent: scoreDetails.completionPercent,
            movementAccuracyPercent: scoreDetails.movementAccuracyPercent,
            weeklyExerciseDays: scoreDetails.weeklyExerciseDays,
            recoveryMinutes: scoreDetails.recoveryMinutes,
            scoreBreakdown: scoreDetails.breakdown
          }
        })
      });
      const aiData = await aiRes.json();
      if (aiData?.report) {
        generatedReport = aiData.report;
        reportSource = aiData.ok ? "nvidia" : "local-fallback";
      }
    } catch (e) {
      // keep fallback report
    }

    setReport(
      reportSource === "nvidia"
        ? generatedReport
        : `${generatedReport}\n\nNote: NVIDIA AI report could not be used with the current API authorization, so this session is showing a local fallback summary.`
    );
    setFinalized(true);

    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: exercise.title,
          avgHeartRate,
          peakHeartRate,
          wrongMoves,
          durationSec,
          score,
          calories,
          currentRep,
          scoreCategory: scoreDetails.category,
          scoreBreakdown: scoreDetails.breakdown,
          completionPercent: scoreDetails.completionPercent,
          movementAccuracyPercent: scoreDetails.movementAccuracyPercent,
          weeklyExerciseDays: scoreDetails.weeklyExerciseDays,
          recoveryMinutes: scoreDetails.recoveryMinutes,
          report: generatedReport
        })
      });
    } catch (e) {
      // non-blocking for UX
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const postureLabel =
    postureStatus === "correct"
      ? "Good"
      : postureStatus === "incorrect"
        ? "Adjust"
        : postureStatus === "not_detected"
          ? "No Signal"
          : "Checking";

  // Emergency pause screen
  if (paused) {
    return (
      <main className="session-fullscreen emergency-screen">
        <div className="emergency-content">
          <div className="emergency-icon">🚨</div>
          <h1>Session Paused for Safety</h1>
          <p>Heart rate stayed out of range for 6+ seconds during {exercise.title}.</p>
          <p>An emergency message has been sent to your family contact.</p>
          <button className="btn-primary" onClick={() => router.push("/")}>
            Return to Home
          </button>
        </div>
      </main>
    );
  }

  // Loading screen while ending session
  if (saving) {
    return (
      <main className="session-fullscreen loading-screen">
        <div className="loading-content">
          <div className="spinner-large" />
          <h2>Generating Your Report...</h2>
          <p>Please wait while we analyze your session and prepare your personalized feedback.</p>
        </div>
      </main>
    );
  }

  // Session complete screen
  if (finalized) {
    // Parse markdown-like formatting from AI report
    const formatReport = (text) => {
      if (!text) return null;
      
      // Split by newlines and process each paragraph
      return text.split('\n').map((paragraph, idx) => {
        if (!paragraph.trim()) return null;
        
        // Handle **bold** text
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);
        const formattedParts = parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        
        return <p key={idx}>{formattedParts}</p>;
      }).filter(Boolean);
    };

    return (
      <main className="session-fullscreen complete-screen">
        <div className="complete-content">
          <h1>🎉 Session Complete!</h1>
          <div className="report-section">
            <h3>Your Exercise Report</h3>
            <div className="report-text">{formatReport(report)}</div>
          </div>
          <div className="complete-actions">
            <button className="btn-outline" onClick={() => router.push("/family")}>
              View Family Dashboard
            </button>
            <button className="btn-primary" onClick={() => router.push("/")}>
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Main exercise session screen
  return (
    <main className="session-fullscreen">
      {/* Left Half: Webcam */}
      <section className={`exercise-webcam-panel ${postureStatus}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="exercise-video-feed"
        />
        <canvas ref={overlayRef} className="exercise-pose-overlay" />

        {/* Transparent Data Overlay */}
        <div 
          className={`exercise-data-overlay ${isDragging ? 'dragging' : ''}`}
          ref={dataBoxRef}
          style={{ left: dataBoxPos.x, top: dataBoxPos.y }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <div className="overlay-badge">Live Tracking</div>
          <h2 className="overlay-title">{exercise.title}</h2>
          
          <div className="overlay-stats">
            <div className="stat-box">
              <span>Time</span>
              <strong>{formatTime(elapsedTime)}</strong>
            </div>
            <div className="stat-box">
              <span>Reps</span>
              <strong>{currentRep}</strong>
            </div>
            <div className="stat-box">
              <span>Posture</span>
              <strong className={`status-${postureStatus}`}>{postureLabel}</strong>
            </div>
            <div className="stat-box">
              <span>Heart Rate</span>
              <strong>{hr > 0 ? `${hr} bpm` : "--"}</strong>
            </div>
            <div className="stat-box unihiker-status-box">
              <span>Source</span>
              <strong className={`unihiker-status ${unihikerStatus}`}>
                {unihikerStatus === "connected" ? "UNIHIKER" : unihikerStatus === "waiting" ? "Waiting..." : "Disconnected"}
              </strong>
            </div>
            <div className="stat-box unihiker-status-box">
              <span>Status</span>
              <strong>{unihikerData?.status || "--"}</strong>
            </div>
          </div>

          <p className="overlay-feedback">{feedback}</p>

          <div className="overlay-actions">
            <button
              className="btn-demo-back"
              onClick={() => router.push(`/exercise/${exercise.id}/demo`)}
            >
              Back to Demo Video
            </button>
            <button className="btn-end" onClick={endSession}>
              End Session
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="exercise-legend">
          <span><i className="dot-live" /> Live skeleton</span>
          <span><i className="dot-reference" /> Model position</span>
        </div>

        {/* Loading/Error States */}
        {cameraState !== "ready" && (
          <div className="video-loading">
            <div className="spinner" />
            <p>{cameraState === "error" ? "Camera access denied" : "Initializing camera..."}</p>
          </div>
        )}

        {/* High BPM Warning Overlay */}
        {showHighBpmWarning && (
          <div className="high-bpm-warning-overlay">
            <div className="high-bpm-warning-content">
              <div className="warning-icon">⚠️</div>
              <h2>High Heart Rate Detected</h2>
              <p>Current BPM: <strong>{hr}</strong></p>
              <p className="warning-message">Please pause and rest.</p>
              <button className="btn-warning-dismiss" onClick={() => setShowHighBpmWarning(false)}>
                Dismiss Warning
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Right Half: Reference Image */}
      <section className="exercise-reference-panel">
        <div className="reference-image-container">
          {!modelImageError && exercise.modelImage ? (
            <img
              src={exercise.modelImage}
              alt={`${exercise.title} reference`}
              className="reference-exercise-image"
              onError={() => setModelImageError(true)}
            />
          ) : (
            <div className="reference-fallback">
              <p>Reference image for {exercise.title}</p>
            </div>
          )}
          <canvas ref={referenceCanvasRef} className="reference-skeleton-overlay" />
        </div>
        
        <div className="reference-label">
          <span className="label-badge">Reference Position</span>
          <h3>{exercise.title}</h3>
        </div>
      </section>
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <main className="session-fullscreen loading-screen">
          <div className="loading-content">
            <div className="spinner-large" />
            <p>Loading exercise session...</p>
          </div>
        </main>
      }
    >
      <SessionPageContent />
    </Suspense>
  );
}
