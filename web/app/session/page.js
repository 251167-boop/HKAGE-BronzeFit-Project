"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const HR_MIN = 78;
const HR_MAX = 132;
const LAST_SESSION_KEY = "silverfit:lastSessionAt";

export default function SessionPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const monitorRef = useRef({ outSince: null, emergencySent: false });
  const intervalRef = useRef({ hr: null, motion: null });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hr, setHr] = useState(0);
  const [wrongMoves, setWrongMoves] = useState(0);
  const [feedback, setFeedback] = useState("Align your posture and move steadily.");
  const [hrHistory, setHrHistory] = useState([]);

  const summaryScore = useMemo(() => {
    const total = hrHistory.length || 1;
    const ratio = wrongMoves / total;
    return Math.max(0, Math.round((10 - ratio * 10) * 10) / 10);
  }, [wrongMoves, hrHistory.length]);

  useEffect(() => {
    let localStream = null;
    async function startStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setRunning(true);
      } catch (e) {
        setFeedback("Cannot access camera. Please grant camera permission.");
      }
    }
    startStream();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      clearInterval(intervalRef.current.hr);
      clearInterval(intervalRef.current.motion);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current.hr = setInterval(async () => {
      try {
        const res = await fetch("/api/unihiker", { cache: "no-store" });
        const data = await res.json();
        if (data.ok && Number(data.hr) > 0) {
          const current = Number(data.hr);
          setHr(current);
          setHrHistory((prev) => [...prev, current].slice(-3600));
        }
      } catch (e) {
        // keep session alive if sensor is temporarily unavailable
      }
    }, 1000);

    return () => clearInterval(intervalRef.current.hr);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    let prev = null;
    intervalRef.current.motion = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return;

      const ctx = canvas.getContext("2d");
      canvas.width = 320;
      canvas.height = 180;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += data[i] + data[i + 1] + data[i + 2];
      }
      const brightness = sum / (data.length / 4);

      if (prev !== null) {
        const delta = Math.abs(brightness - prev);
        if (delta < 0.7) {
          setWrongMoves((v) => v + 1);
          setFeedback("Try moving a bit more clearly and stay centered in camera.");
        } else if (delta > 20) {
          setWrongMoves((v) => v + 1);
          setFeedback("Slow down slightly for safe and controlled movement.");
        } else {
          setFeedback("Great pace. Keep your movement smooth.");
        }
      }
      prev = brightness;
    }, 1200);

    return () => clearInterval(intervalRef.current.motion);
  }, [running]);

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
          message: `SilverFit Emergency: HR stayed out of safe range (${HR_MIN}-${HR_MAX}) for 6+ seconds. Current HR: ${hr} bpm.`
        })
      });
    }
  }, [hr, running, paused]);

  const endSession = () => {
    setRunning(false);
    localStorage.setItem(LAST_SESSION_KEY, String(Date.now()));
  };

  if (paused) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1 className="status-bad">Session Paused for Safety</h1>
            <p>Heart rate stayed out of range for 6+ seconds. Emergency message sent.</p>
            <button className="btn btn-primary" onClick={() => router.push("/")}>
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container row">
        <div className="col card">
          <h2 style={{ marginTop: 0 }}>Live Camera</h2>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 12 }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
        <div className="col card">
          <h2 style={{ marginTop: 0 }}>Session Monitor</h2>
          <p className={hr >= HR_MIN && hr <= HR_MAX ? "status-ok" : "status-bad"}>
            Heart Rate: <span className="mono">{hr || "--"} bpm</span>
          </p>
          <p>Safe Range: {HR_MIN}-{HR_MAX} bpm</p>
          <p>Wrong Moves: {wrongMoves}</p>
          <p>{feedback}</p>
          {!running ? (
            <div>
              <p>Session Complete. Score: {summaryScore}/10</p>
              <button className="btn btn-primary" onClick={() => router.push("/")}>
                Back to Home
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={endSession}>
              End Session
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
