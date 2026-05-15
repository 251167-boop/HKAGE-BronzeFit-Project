"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

async function checkCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, msg: "Browser camera API not available." };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true, msg: "Camera connected." };
  } catch (e) {
    return { ok: false, msg: "Camera permission denied or not available." };
  }
}

async function checkApi(path) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(path, { cache: "no-store", signal: controller.signal });
    const data = await res.json();
    return { ok: !!data.ok, msg: data.message || "Checked." };
  } catch (e) {
    return {
      ok: false,
      msg: e?.name === "AbortError" ? "Service check timed out." : "Service not reachable."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function CheckPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const runChecks = async () => {
    setLoading(true);
    const [camera, unihiker, aiCoach] = await Promise.all([
      checkCamera(),
      checkApi("/api/unihiker?ping=1"),
      checkApi("/api/ollama")
    ]);
    const allOk = camera.ok && unihiker.ok && aiCoach.ok;
    setResult({ camera, unihiker, aiCoach, allOk });
    setLoading(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <main className="page fade-in">
      <div className="container">
        <div className="card check-card">
          <h1 className="title">System Check</h1>
          {loading && (
            <div className="loading-container">
              <div className="loading"></div>
              <p>Running system checks...</p>
            </div>
          )}
          {!loading && result && (
            <>
              <div className="check-grid">
                <div className={`check-item ${result.camera.ok ? "ok" : "bad"}`}>
                  <div className="check-icon">{result.camera.ok ? "✓" : "✗"}</div>
                  <div>
                    <div className="check-label">Camera</div>
                    <div className="check-msg">{result.camera.msg}</div>
                  </div>
                </div>
                <div className={`check-item ${result.unihiker.ok ? "ok" : "bad"}`}>
                  <div className="check-icon">{result.unihiker.ok ? "✓" : "✗"}</div>
                  <div>
                    <div className="check-label">Unihiker</div>
                    <div className="check-msg">{result.unihiker.msg}</div>
                  </div>
                </div>
                <div className={`check-item ${result.aiCoach.ok ? "ok" : "bad"}`}>
                  <div className="check-icon">{result.aiCoach.ok ? "✓" : "✗"}</div>
                  <div>
                    <div className="check-label">NVIDIA AI</div>
                    <div className="check-msg">{result.aiCoach.msg}</div>
                  </div>
                </div>
              </div>
              <div className="check-actions">
                {result.allOk ? (
                  <button className="btn btn-primary btn-large" onClick={() => router.push("/exercises")}>
                    <span>Choose Exercise</span>
                    <span className="btn-icon">→</span>
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={runChecks}>
                    Retry Check
                  </button>
                )}
                {!result.allOk && (
                  <button className="btn btn-outline" onClick={() => router.push("/exercises")}>
                    Continue Anyway
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
