"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const exerciseVisuals = {
  "Wall Push-Up": "🤲",
  "Standing Lunge": "🚶",
  "Single-Leg Balance": "⚖️",
  "Lying Supine Exercises": "🛌",
  "Half-Kneeling Stretches": "🧘"
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRatingCategory(score) {
  if (score >= 90) return "Excellent Health";
  if (score >= 75) return "Good Health";
  if (score >= 60) return "Fair Health";
  if (score >= 40) return "Needs Improvement";
  return "Consult Doctor";
}

function getConsecutiveDays(sessions) {
  const uniqueDays = [...new Set(sessions.map((session) => session.createdAt.slice(0, 10)))];
  if (uniqueDays.length === 0) return 0;

  let streak = 1;
  let current = new Date(uniqueDays[0]);

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const next = new Date(uniqueDays[index]);
    const diffDays = Math.round((current - next) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
      current = next;
    } else {
      break;
    }
  }

  return streak;
}

function buildChartPoints(sessions) {
  if (sessions.length === 0) return "";

  const values = sessions.map((session) => Number(session.avgHeartRate || 0));
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 60);
  const range = Math.max(1, max - min);

  return sessions
    .map((session, index) => {
      const x = (index / Math.max(1, sessions.length - 1)) * 100;
      const y = 90 - ((Number(session.avgHeartRate || 0) - min) / range) * 60;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function FamilyPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        setSessions(data?.sessions || []);
      } catch (error) {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const latest = sessions[0];
  const chartSessions = useMemo(() => sessions.slice(0, 6).reverse(), [sessions]);
  const chartPoints = useMemo(() => buildChartPoints(chartSessions), [chartSessions]);
  const durationMinutes = latest ? Math.max(1, Math.round((latest.durationSec || 0) / 60)) : 0;
  const durationProgress = latest ? clamp(Math.round((durationMinutes / 60) * 100), 0, 100) : 0;
  const overallScore = latest ? clamp(Math.round(latest.score || 0), 0, 100) : 0;
  const overallCategory = latest?.scoreCategory || getRatingCategory(overallScore);
  const caloriesProgress = latest ? clamp(Math.round(((latest.calories || 0) / 300) * 100), 0, 100) : 0;
  const consecutiveDays = getConsecutiveDays(sessions);
  const latestExercise = latest?.exercise || "General exercise";
  const poseEmoji = exerciseVisuals[latestExercise] || "🏃";

  const statusTitle =
    overallScore >= 75 ? "Real-time status" : "Needs attention";
  const statusLabel =
    overallCategory;
  const statusText =
    overallScore >= 75
      ? `${latestExercise} is trending well. The latest health score indicates steady exercise, reasonable pacing, and good overall wellness.`
      : `${latestExercise} is mostly on track, but the latest health score suggests posture, consistency, or recovery still need attention. Reviewing the session notes before the next workout is recommended.`;

  return (
    <main className="page fade-in">
      <div className="container family-container">
        <div className="card family-card">
          <div className="family-topbar">
            <div>
              <h1 className="title family-title">Family Dashboard</h1>
              <p className="family-subtitle">A clearer wellness snapshot for caregivers and loved ones.</p>
            </div>
            <Link href="/exercises" className="btn btn-primary">
              Start New Exercise
            </Link>
          </div>
          {loading && (
            <div className="loading-container">
              <div className="loading"></div>
              <p>Loading latest session...</p>
            </div>
          )}
          {!loading && !latest && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No session data yet.</p>
              <Link href="/" className="btn btn-primary">
                Start First Session
              </Link>
            </div>
          )}
          {!loading && latest && (
            <>
              <div className="session-header family-session-header">
                <div>
                  <div className="session-date">
                    {new Date(latest.createdAt).toLocaleDateString()}
                  </div>
                  <div className="session-time">
                    {new Date(latest.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="family-session-chip">
                  {latestExercise}
                </div>
              </div>

              <div className="family-grid">
                <section className="family-panel family-duration-panel">
                  <div className="family-panel-label">Exercise Duration</div>
                  <div className="family-duration-top">
                    <div>
                      <div className="family-big-number">{durationMinutes}</div>
                      <div className="family-unit">minute</div>
                    </div>
                    <div
                      className="family-progress-ring"
                      style={{ "--progress": `${durationProgress}%` }}
                    >
                      <div className="family-progress-inner">
                        <strong>{durationProgress}%</strong>
                        <span>target</span>
                      </div>
                    </div>
                  </div>
                  <div className="family-divider" />
                  <div className="family-kcal-row">
                    <div>
                      <div className="family-panel-label">Calories</div>
                      <div className="family-kcal-value">{latest.calories} <span>kcal</span></div>
                    </div>
                    <div className="family-target-note">Today's target: {caloriesProgress}%</div>
                  </div>
                  <div className="family-progress-bar">
                    <span style={{ width: `${caloriesProgress}%` }} />
                  </div>
                </section>

                <section className="family-panel family-pose-panel">
                  <div className="family-panel-heading">
                    <div className="family-panel-title">Pose Capture</div>
                    <Link href="/exercises" className="family-inline-link">
                      View all
                    </Link>
                  </div>
                  <div className="family-pose-stage">
                    <div className="family-pose-emoji">{poseEmoji}</div>
                    <div className="family-pose-caption">
                      <span className="family-dot ok" />
                      <span>{latestExercise}</span>
                      <span>{overallScore}/100 health score</span>
                    </div>
                  </div>
                </section>

                <section className="family-panel family-status-panel">
                  <div className="family-status-header">
                    <div>
                      <div className="family-panel-title">{statusTitle}</div>
                      <div className="family-status-label">{statusLabel}</div>
                    </div>
                    <span className="family-live-dot" />
                  </div>
                  <p className="family-status-text">{statusText}</p>
                  <div className="family-mini-stats">
                    <div className="family-mini-stat">
                      <div className="family-mini-icon">↗</div>
                      <strong>{latest.avgHeartRate}</strong>
                      <span>average heart rate</span>
                    </div>
                    <div className="family-mini-stat">
                      <div className="family-mini-icon">〰</div>
                      <strong>{overallScore}</strong>
                      <span>overall health score</span>
                    </div>
                    <div className="family-mini-stat">
                      <div className="family-mini-icon">⚡</div>
                      <strong>{consecutiveDays}</strong>
                      <span>consecutive days</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="family-grid family-grid-secondary">
                <section className="family-panel family-analysis-panel">
                  <div className="family-panel-heading">
                    <div className="family-panel-title">AI Analysis</div>
                  </div>
                  <div className="family-analysis-content">
                    <div className="family-analysis-text">
                      {latest.report || "No report available."}
                    </div>
                    <div className="family-analysis-avatar">🤖</div>
                  </div>
                </section>

                <section className="family-panel family-history-panel">
                  <div className="family-history-header">
                    <div className="family-panel-title">Heart Rate History</div>
                    <div className="family-history-average">
                      Today's average <strong>{latest.avgHeartRate}</strong> BPM
                    </div>
                  </div>
                  <div className="family-history-body">
                    <div className="family-chart-shell">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="family-chart">
                        <line x1="0" y1="20" x2="100" y2="20" className="family-chart-grid" />
                        <line x1="0" y1="40" x2="100" y2="40" className="family-chart-grid" />
                        <line x1="0" y1="60" x2="100" y2="60" className="family-chart-grid" />
                        <line x1="0" y1="80" x2="100" y2="80" className="family-chart-grid" />
                        <polyline points={chartPoints} className="family-chart-line" />
                        {chartSessions.map((session, index) => {
                          const values = chartSessions.map((entry) => Number(entry.avgHeartRate || 0));
                          const max = Math.max(...values, 100);
                          const min = Math.min(...values, 60);
                          const range = Math.max(1, max - min);
                          const x = (index / Math.max(1, chartSessions.length - 1)) * 100;
                          const y = 90 - ((Number(session.avgHeartRate || 0) - min) / range) * 60;
                          return <circle key={session.id} cx={x} cy={y} r="1.8" className="family-chart-dot" />;
                        })}
                      </svg>
                    </div>
                    <div className="family-history-list">
                      {sessions.slice(0, 4).map((session) => (
                        <div className="family-history-item" key={session.id}>
                          <span className="family-dot ok" />
                          <div>
                            <strong>{session.exercise || "Exercise session"}</strong>
                            <span>{new Date(session.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                          </div>
                          <div className="family-history-bpm">
                            {session.avgHeartRate} <span>BPM</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <div className="family-actions">
                <Link href="/" className="btn btn-outline">
                  Back Home
                </Link>
                <Link href="/exercises" className="btn btn-primary">
                  Choose Exercise
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
