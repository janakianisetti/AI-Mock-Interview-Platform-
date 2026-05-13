import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  LogOut,
  Mic,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Upload
} from "lucide-react";
import { api, getApiError } from "./api.js";
import { canUseSpeech, getSpeechRecognition } from "./speech.js";

const difficulties = ["Beginner", "Intermediate", "Advanced"];

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuth(data.user);
    } catch (error) {
      setError(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-row">
          <div className="brand-mark">
            <Bot size={26} />
          </div>
          <div>
            <h1>InterviewAce AI</h1>
            <p>Placement interview practice with role-based AI feedback.</p>
          </div>
        </div>

        <div className="auth-grid">
          <div className="auth-copy">
            <span className="eyebrow">Deploy-ready placement project</span>
            <h2>Practice technical, resume, and HR rounds in one reliable platform.</h2>
            <div className="trust-list">
              <p><ShieldCheck size={18} /> JWT auth and protected interview history</p>
              <p><FileText size={18} /> Resume-based question generation</p>
              <p><BarChart3 size={18} /> Scores, feedback, ideal answers, and progress</p>
            </div>
          </div>

          <form className="form-card" onSubmit={submit}>
            <div className="segmented">
              <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
                Login
              </button>
              <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
                Sign up
              </button>
            </div>

            {mode === "register" && (
              <label>
                Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
            )}
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength="6"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="primary" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              {mode === "login" ? "Enter dashboard" : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [roles, setRoles] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedRole, setSelectedRole] = useState("Java Developer");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [useResume, setUseResume] = useState(false);
  const [resumePreview, setResumePreview] = useState("");
  const [interview, setInterview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState("");
  const [notice, setNotice] = useState("");

  const currentQuestion = interview?.questions?.[currentIndex];
  const averageScore = useMemo(() => {
    const completed = history.filter((item) => item.overall_score);
    if (!completed.length) return 0;
    return Math.round(completed.reduce((sum, item) => sum + Number(item.overall_score), 0) / completed.length);
  }, [history]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [rolesRes, historyRes, resumeRes] = await Promise.all([
        api.get("/api/roles"),
        api.get("/api/interviews/history"),
        api.get("/api/resumes/latest")
      ]);
      setRoles(rolesRes.data.roles);
      setHistory(historyRes.data.interviews);
      if (resumeRes.data.resume?.extracted_text) {
        setResumePreview(resumeRes.data.resume.extracted_text.slice(0, 220));
      }
    } catch (error) {
      setNotice(getApiError(error));
    }
  }

  async function uploadResume(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("resume", file);
    setLoading("resume");
    setNotice("");
    try {
      const { data } = await api.post("/api/resumes", body);
      setResumePreview(data.preview);
      setUseResume(true);
      setNotice("Resume uploaded and ready for personalized questions.");
    } catch (error) {
      setNotice(getApiError(error));
    } finally {
      setLoading("");
    }
  }

  async function startInterview() {
    setLoading("start");
    setFeedback(null);
    setAnswer("");
    setNotice("");
    try {
      const { data } = await api.post("/api/interviews/start", {
        role: selectedRole,
        difficulty,
        useResume
      });
      setInterview(data.interview);
      setCurrentIndex(0);
    } catch (error) {
      setNotice(getApiError(error));
    } finally {
      setLoading("");
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || !currentQuestion) return;
    setLoading("answer");
    setFeedback(null);
    try {
      const { data } = await api.post(
        `/api/interviews/${interview.id}/questions/${currentQuestion.id}/answer`,
        { answer }
      );
      setFeedback(data.feedback);
    } catch (error) {
      setNotice(getApiError(error));
    } finally {
      setLoading("");
    }
  }

  async function nextQuestion() {
    setAnswer("");
    setFeedback(null);
    if (currentIndex < interview.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    await api.post(`/api/interviews/${interview.id}/complete`);
    setInterview(null);
    setCurrentIndex(0);
    await loadInitialData();
    setNotice("Interview completed. Your dashboard has been updated.");
  }

  function startVoiceInput() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setNotice("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setAnswer((prev) => `${prev} ${event.results[0][0].transcript}`.trim());
    };
    recognition.start();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-row compact">
          <div className="brand-mark"><Bot size={22} /></div>
          <div>
            <h1>InterviewAce AI</h1>
            <p>Welcome, {user.name}</p>
          </div>
        </div>
        <button className="icon-text" onClick={onLogout}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      {notice && <div className="notice">{notice}</div>}

      <section className="stats-row">
        <div>
          <span>{history.length}</span>
          <p>Total interviews</p>
        </div>
        <div>
          <span>{averageScore || "--"}</span>
          <p>Average score</p>
        </div>
        <div>
          <span>{resumePreview ? "Ready" : "None"}</span>
          <p>Resume status</p>
        </div>
      </section>

      <div className="workspace">
        <section className="setup-panel">
          <h2>Interview setup</h2>
          <label>
            Role
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              {roles.map((role) => (
                <option key={role.name} value={role.name}>{role.name}</option>
              ))}
            </select>
          </label>

          <div className="role-skills">
            {(roles.find((role) => role.name === selectedRole)?.skills || []).map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>

          <label>
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {difficulties.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="upload-box">
            <Upload size={20} />
            <span>{loading === "resume" ? "Uploading resume..." : "Upload PDF or TXT resume"}</span>
            <input type="file" accept=".pdf,.txt" onChange={uploadResume} />
          </label>

          <label className="toggle-row">
            <input type="checkbox" checked={useResume} onChange={(e) => setUseResume(e.target.checked)} disabled={!resumePreview} />
            Use resume for questions
          </label>

          {resumePreview && <p className="resume-preview">{resumePreview}</p>}

          <button className="primary full" onClick={startInterview} disabled={loading === "start"}>
            {loading === "start" ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
            Start mock interview
          </button>
        </section>

        <section className="interview-panel">
          {!interview ? (
            <div className="empty-state">
              <Bot size={42} />
              <h2>Start a role-based interview</h2>
              <p>Select a role, optionally upload a resume, and begin a scored placement practice session.</p>
            </div>
          ) : (
            <>
              <div className="question-header">
                <span>Question {currentIndex + 1} of {interview.questions.length}</span>
                <strong>{currentQuestion.category}</strong>
              </div>
              <h2>{currentQuestion.question}</h2>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here. Use the mic button if your browser supports speech input."
              />
              <div className="answer-actions">
                <button className="secondary" onClick={startVoiceInput} disabled={!canUseSpeech()}>
                  <Mic size={18} /> Voice
                </button>
                <button className="primary" onClick={submitAnswer} disabled={loading === "answer" || !answer.trim()}>
                  {loading === "answer" ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                  Submit answer
                </button>
              </div>

              {feedback && (
                <div className="feedback-card">
                  <div className="score-ring">
                    <span>{feedback.score}</span>
                    <p>{feedback.level}</p>
                  </div>
                  <div className="feedback-content">
                    <h3>AI feedback</h3>
                    <p>{feedback.hrFeedback}</p>
                    <h4>Strengths</h4>
                    <ul>{feedback.strengths?.map((item) => <li key={item}>{item}</li>)}</ul>
                    <h4>Improve</h4>
                    <ul>{feedback.improvements?.map((item) => <li key={item}>{item}</li>)}</ul>
                    <h4>Ideal answer</h4>
                    <p>{feedback.idealAnswer}</p>
                    <button className="primary" onClick={nextQuestion}>
                      <CheckCircle2 size={18} />
                      {currentIndex === interview.questions.length - 1 ? "Finish interview" : "Next question"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="history-panel">
        <h2>Interview history</h2>
        <div className="history-list">
          {history.length === 0 && <p>No interviews yet.</p>}
          {history.map((item) => (
            <div className="history-item" key={item.id}>
              <div>
                <strong>{item.role}</strong>
                <p>{item.difficulty} - {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <span>{item.overall_score ? `${item.overall_score}/100` : item.status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return user ? <Dashboard user={user} onLogout={logout} /> : <AuthScreen onAuth={setUser} />;
}
