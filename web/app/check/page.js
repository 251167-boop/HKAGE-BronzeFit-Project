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
  try {
    const res = await fetch(path, { cache: "no-store" });
    const data = await res.json();
    return { ok: !!data.ok, msg: data.message || "Checked." };
  } catch (e) {
    return { ok: false, msg: "Service not reachable." };
  }
}

export default function CheckPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const runChecks = async () => {
    setLoading(true);
    const [camera, unihiker, ollama] = await Promise.all([
      checkCamera(),
      checkApi("/api/unihiker?ping=1"),
      checkApi("/api/ollama")
    ]);
    const allOk = camera.ok && unihiker.ok && ollama.ok;
    setResult({ camera, unihiker, ollama, allOk });
    setLoading(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>System Check</h1>
          {loading && <p>Running system checks...</p>}
          {!loading && result && (
            <>
              <p className={result.camera.ok ? "status-ok" : "status-bad"}>
                Camera: {result.camera.msg}
              </p>
              <p className={result.unihiker.ok ? "status-ok" : "status-bad"}>
                Unihiker: {result.unihiker.msg}
              </p>
              <p className={result.ollama.ok ? "status-ok" : "status-bad"}>
                Ollama: {result.ollama.msg}
              </p>
              <div className="row">
                <div>
                  {result.allOk ? (
                    <button className="btn btn-primary" onClick={() => router.push("/session")}>
                      Start Exercise
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={runChecks}>
                      Retry Check
                    </button>
                  )}
                </div>
                {!result.allOk && (
                  <div>
                    <button className="btn btn-outline" onClick={() => router.push("/session")}>
                      Continue Anyway
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
