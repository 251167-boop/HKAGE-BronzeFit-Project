"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const LAST_SESSION_KEY = "silverfit:lastSessionAt";

export default function HomePage() {
  const router = useRouter();
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const last = Number(localStorage.getItem(LAST_SESSION_KEY) || 0);
    const now = Date.now();
    const inactiveOver24h = !last || now - last > 24 * 60 * 60 * 1000;
    setShowReminder(inactiveOver24h);
  }, []);

  const reminderText = useMemo(
    () =>
      "You have not completed an exercise session in over 24 hours. Please stay active today.",
    []
  );

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1 className="title">Start your exercise session today</h1>
          <p className="subtitle">
            Build stronger muscles and better balance in a safe and guided way.
          </p>
          {showReminder && <p className="status-warn">{reminderText}</p>}
          <button className="btn btn-primary" onClick={() => router.push("/check")}>
            Start Session
          </button>
        </div>
      </div>
    </main>
  );
}
