"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitialMessage(latestSession) {
  if (latestSession) {
    return `Hello! I am your BronzeFit AI coach. I can help explain your latest ${latestSession.exercise || "exercise"} session, suggest safer pacing, and answer general wellness questions.`;
  }

  return "Hello! I am your BronzeFit AI coach. Ask me about exercise safety, posture, heart rate, or how to use BronzeFit.";
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("meta/llama-3.1-8b-instruct");
  const [latestSession, setLatestSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadLatestSession() {
      try {
        const response = await fetch("/api/sessions", { cache: "no-store" });
        const data = await response.json();
        const latest = data?.latest || null;
        setLatestSession(latest);
        setMessages([
          {
            id: 1,
            role: "assistant",
            content: getInitialMessage(latest),
            timestamp: formatTime(Date.now()),
          },
        ]);
      } catch (error) {
        setMessages([
          {
            id: 1,
            role: "assistant",
            content: getInitialMessage(null),
            timestamp: formatTime(Date.now()),
          },
        ]);
      } finally {
        setLoaded(true);
      }
    }

    loadLatestSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const quickQuestions = useMemo(() => {
    const exerciseTitle = latestSession?.exercise || "my latest exercise";
    const avgHeartRate = latestSession?.avgHeartRate || 0;
    const score = latestSession?.score || 0;

    return [
      `Please explain my latest ${exerciseTitle} session in simple words.`,
      `Was an average heart rate of ${avgHeartRate} BPM okay for me?`,
      `How can I improve my current BronzeFit score of ${score}?`,
      "Give me three safe exercise tips for older adults.",
    ];
  }, [latestSession]);

  const handleSend = async (text = inputValue) => {
    if (!text.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text.trim(),
      timestamp: formatTime(Date.now()),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputValue("");
    setIsTyping(true);

    const systemPrompt = `You are BronzeFit's AI wellness coach for older adults. Be gentle, practical, and easy to understand. Prioritize exercise safety, posture quality, pacing, hydration, rest, and encouragement. If session data is available, use it naturally without sounding clinical.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...(latestSession
              ? [
                  {
                    role: "system",
                    content: `Latest BronzeFit session summary: exercise=${latestSession.exercise || "unknown"}, avgHeartRate=${latestSession.avgHeartRate || 0}, peakHeartRate=${latestSession.peakHeartRate || 0}, durationSec=${latestSession.durationSec || 0}, score=${latestSession.score || 0}, report=${latestSession.report || "n/a"}`,
                  },
                ]
              : []),
            ...nextMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
        }),
      });

      const data = await response.json();
      const aiResponse =
        data?.choices?.[0]?.message?.content ||
        "I could not generate a response just now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: aiResponse,
          timestamp: formatTime(Date.now()),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "I could not reach the BronzeFit AI service right now. Please try again in a moment.",
          timestamp: formatTime(Date.now()),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="page fade-in chat-page-shell">
      <div className="container">
        <div className="card chat-card">
          <div className="chat-header">
            <div>
              <div className="hero-badge">AI COACH</div>
              <h1 className="title chat-title">BronzeFit AI Chat</h1>
              <p className="subtitle chat-subtitle">
                Ask for exercise guidance, session explanations, or general wellness help.
              </p>
            </div>
            <div className="chat-header-actions">
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="chat-select"
              >
                <option value="meta/llama-3.1-8b-instruct">Llama 3.1 8B</option>
                <option value="nvidia/llama-3.3-nemotron-super-49b-v1">Nemotron 49B</option>
                <option value="mistralai/mixtral-8x7b-instruct-v0.1">Mixtral 8x7B</option>
              </select>
              <Link href="/" className="btn btn-outline">
                Back Home
              </Link>
            </div>
          </div>

          <div className="chat-layout">
            <section className="chat-main-panel">
              <div className="chat-messages">
                {loaded &&
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`chat-message-row ${message.role === "user" ? "chat-message-row-user" : ""}`}
                    >
                      <div className={`chat-avatar ${message.role === "user" ? "chat-avatar-user" : "chat-avatar-ai"}`}>
                        {message.role === "user" ? "You" : "AI"}
                      </div>
                      <div className={`chat-bubble ${message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}>
                        <p>{message.content}</p>
                        <span>{message.timestamp}</span>
                      </div>
                    </div>
                  ))}

                {isTyping && (
                  <div className="chat-message-row">
                    <div className="chat-avatar chat-avatar-ai">AI</div>
                    <div className="chat-bubble chat-bubble-ai">
                      <p>Typing...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-quick-questions">
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    className="chat-quick-question"
                    onClick={() => handleSend(question)}
                    disabled={isTyping}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <div className="chat-input-row">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSend()}
                  placeholder="Ask the BronzeFit AI coach a question..."
                  className="chat-input"
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                >
                  Send
                </button>
              </div>
            </section>

            <aside className="chat-side-panel">
              <h3>Latest Session Snapshot</h3>
              <div className="chat-side-stat">
                <span>Exercise</span>
                <strong>{latestSession?.exercise || "No session yet"}</strong>
              </div>
              <div className="chat-side-stat">
                <span>Average Heart Rate</span>
                <strong>{latestSession ? `${latestSession.avgHeartRate} BPM` : "--"}</strong>
              </div>
              <div className="chat-side-stat">
                <span>Health Score</span>
                <strong>{latestSession ? `${latestSession.score}/100` : "--"}</strong>
              </div>
              <div className="chat-side-stat">
                <span>Duration</span>
                <strong>
                  {latestSession ? `${Math.max(1, Math.round((latestSession.durationSec || 0) / 60))} min` : "--"}
                </strong>
              </div>
              <p className="chat-side-note">
                The AI coach can use your latest BronzeFit session summary to explain progress and suggest safer next steps.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
