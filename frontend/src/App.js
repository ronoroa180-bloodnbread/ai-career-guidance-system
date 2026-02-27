import React, { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    interests: "",
    math: "",
    aptitude: "",
    personality: "",
    financial: "low",
    location: "urban",
    language: "english"
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appReady, setAppReady] = useState(false);

  const toReadableText = (value) => {
    if (value == null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
      return value
        .map((item) => toReadableText(item))
        .filter(Boolean)
        .join(" | ");
    }
    if (typeof value === "object") {
      const preferredKeys = ["text", "label", "name", "value", "title", "step", "milestone", "description", "details", "action"];
      const preferredText = preferredKeys
        .map((key) => toReadableText(value[key]))
        .filter(Boolean)
        .join(" - ");
      if (preferredText) return preferredText;

      return Object.values(value)
        .map((item) => toReadableText(item))
        .filter(Boolean)
        .join(" - ");
    }
    return String(value).trim();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = {
      name: form.name,
      age: Number(form.age) || null,
      interests: form.interests.split(",").map((i) => i.trim().toLowerCase()),
      marks: { math: Number(form.math) },
      aptitude: form.aptitude.split(",").map((a) => a.trim().toLowerCase()),
      personality: form.personality.split(",").map((p) => p.trim().toLowerCase()),
      financial: form.financial,
      location: form.location,
      language: form.language
    };

    try {
      const res = await fetch("http://localhost:5000/career-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const normalizeRoadmapItem = (item) => {
        const timeline = toReadableText(item?.timeline || item?.phase || item?.duration || item?.time || "");
        const title = toReadableText(item?.title || item?.step || item?.milestone || item?.goal || item?.heading || "");
        const details = toReadableText(item?.details || item?.action || item?.description || item?.task || item?.note || "");
        const merged = [timeline, title, details].filter(Boolean).join(" - ");
        if (merged) return merged;
        return toReadableText(item);
      };

      if (Array.isArray(data?.ai_advice?.roadmap)) {
        data.ai_advice.roadmap = data.ai_advice.roadmap.map((item) => normalizeRoadmapItem(item));
      }
      setResult(data);
    } catch (error) {
      setResult({
        matches: [],
        ai_advice: {
          recommended_career: "Unavailable",
          reason: "Could not connect to the career guidance server.",
          roadmap: ["Start backend server", "Check API URL", "Try again"],
          skills: ["Communication", "Problem solving"]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRoadmapItem = (item) => {
    const timeline = toReadableText(item?.timeline || item?.phase || item?.duration || item?.time || "");
    const title = toReadableText(item?.title || item?.step || item?.milestone || item?.goal || item?.heading || "");
    const details = toReadableText(item?.details || item?.action || item?.description || item?.task || item?.note || "");
    const merged = [timeline, title, details].filter(Boolean).join(" - ");
    if (merged) return merged;
    return toReadableText(item);
  };

  return (
    <div className="app">
      {!appReady && (
        <div className="startup-loader" aria-live="polite">
          <div className="startup-content">
            <div className="startup-ring" />
            <h2>AI Career Navigator</h2>
            <p>Preparing your guidance workspace...</p>
          </div>
        </div>
      )}

      <div className="background-orb orb-one" aria-hidden="true" />
      <div className="background-orb orb-two" aria-hidden="true" />

      <div className="card">
        <header className="hero">
          <p className="eyebrow">Personalized Guidance</p>
          <h1>AI Career Navigator</h1>
          <p className="subtitle">
            Enter your academic and personal profile to discover high-fit career paths with an actionable learning roadmap.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Student Name
            <input name="name" placeholder="e.g. Adarsh" required onChange={handleChange} />
          </label>

          <label>
            Age
            <input name="age" type="number" min="10" max="80" placeholder="e.g. 17" required onChange={handleChange} />
          </label>

          <label>
            Math Marks (%)
            <input name="math" type="number" placeholder="e.g. 82" required onChange={handleChange} />
          </label>

          <label className="full-width">
            Interests
            <input
              name="interests"
              placeholder="coding, machines, art"
              required
              onChange={handleChange}
            />
          </label>

          <label className="full-width">
            Aptitude
            <input
              name="aptitude"
              placeholder="logic, creativity, practical"
              onChange={handleChange}
            />
          </label>

          <label className="full-width">
            Personality
            <input
              name="personality"
              placeholder="analytical, social, leader"
              onChange={handleChange}
            />
          </label>

          <label>
            Financial Support
            <select name="financial" onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            Location
            <select name="location" onChange={handleChange}>
              <option value="urban">Urban</option>
              <option value="rural">Rural</option>
            </select>
          </label>

          <label className="full-width">
            Preferred Language
            <select name="language" onChange={handleChange}>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
            </select>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Analyzing Profile..." : "Analyze Career"}
          </button>
        </form>

        {loading && <div className="loading">We are mapping the best-fit career options for your profile.</div>}

        {result && (
          <section className="result">
            <h2>Top Career Matches</h2>
            {result.matches?.length ? (
              result.matches.map((m, i) => (
                <div key={i} className="match" style={{ animationDelay: `${i * 90}ms` }}>
                  <div className="match-head">
                    <strong>{m.career}</strong>
                    <span>{m.score}</span>
                  </div>
                  <div className="score-track">
                    <div className="score-fill" style={{ width: `${Math.min(Number(m.score), 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="empty">No matches returned from the API.</p>
            )}

            {result.ai_advice && (
              <div className="advice-panel">
                <h2>AI Recommendation</h2>
                <p>
                  <b>Career:</b> {result.ai_advice.recommended_career}
                </p>
                <p>
                  <b>Reason:</b> {result.ai_advice.reason}
                </p>
                {result.ai_advice.aptitude_reasoning && (
                  <p>
                    <b>Aptitude Reasoning:</b> {result.ai_advice.aptitude_reasoning}
                  </p>
                )}

                <h3>Roadmap</h3>
                <ul>
                  {result.ai_advice.roadmap?.map((r, i) => (
                    <li key={i}>{formatRoadmapItem(r)}</li>
                  ))}
                </ul>

                <h3>Skills to Develop</h3>
                <ul>
                  {result.ai_advice.skills?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>

                {result.ai_advice.resources?.length > 0 && (
                  <>
                    <h3>Learning Resources</h3>
                    <ul>
                      {result.ai_advice.resources.map((resource, i) => (
                        <li key={i}>{resource}</li>
                      ))}
                    </ul>
                  </>
                )}

                {result.ai_advice.govt_schemes?.length > 0 && (
                  <>
                    <h3>Government Schemes</h3>
                    <ul>
                      {result.ai_advice.govt_schemes.map((scheme, i) => (
                        <li key={i}>{scheme}</li>
                      ))}
                    </ul>
                  </>
                )}

                {result.ai_advice.safety_notes?.length > 0 && (
                  <>
                    <h3>Safety Notes</h3>
                    <ul>
                      {result.ai_advice.safety_notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
