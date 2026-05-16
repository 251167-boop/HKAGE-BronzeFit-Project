"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const LAST_SESSION_KEY = "silverfit:lastSessionAt";

export default function HomePage() {
  const router = useRouter();
  const [showReminder, setShowReminder] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) return null;

  return (
    <main className="page fade-in">
      <div className="container">
        <div className="card hero-card">
          <div className="hero-badge">TODAY'S WELLNESS</div>
          <h1 className="title hero-title">Start your exercise session today</h1>
          <p className="subtitle hero-subtitle">
            Build stronger muscles and better balance in a safe and guided way.
          </p>
          {showReminder && (
            <div className="reminder-banner">
              <span className="reminder-icon">⚠️</span>
              <span>{reminderText}</span>
            </div>
          )}
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={() => router.push("/check")}>
              <span>Start Session</span>
              <span className="btn-icon">→</span>
            </button>
            <Link href="/chat" className="btn btn-outline">
              <span>AI Chat</span>
            </Link>
            <Link href="/family" className="btn btn-outline">
              <span>Family Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
