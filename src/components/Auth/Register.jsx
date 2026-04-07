import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validateHandle, checkHandleAvailable } from "../../utils/handle";
import { db } from "../../firebase";
import "./Auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState(null); // null | "checking" | "available" | "taken" | "invalid"
  const [handleError, setHandleError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  function onHandleChange(e) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
    setHandle(val);
    setHandleStatus("checking");
    setHandleError("");
    clearTimeout(debounceTimer.current);
    if (!val) { setHandleStatus(null); return; }
    debounceTimer.current = setTimeout(() => checkHandle(val), 500);
  }

  async function checkHandle(val) {
    const { valid, error: valError } = validateHandle(val);
    if (!valid) {
      setHandleStatus("invalid");
      setHandleError(valError);
      return;
    }
    setHandleStatus("checking");
    const available = await checkHandleAvailable(val, db);
    setHandleStatus(available ? "available" : "taken");
    setHandleError(available ? "" : "That handle is already taken.");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (handleStatus !== "available") return setError("Please choose a valid, available handle.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await register(email, password, name, handle);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed.");
    }
    setLoading(false);
  }

  const handleIndicator =
    handleStatus === "checking" ? <span className="handle-checking">checking…</span>
    : handleStatus === "available" ? <span className="handle-ok">✓ available</span>
    : handleStatus === "taken" || handleStatus === "invalid" ? <span className="handle-err">{handleError}</span>
    : null;

  return (
    <div className="auth-container">
      <div className="auth-hero">
        <img
          src="/sweatbuddies/Fluffy monster hits the gym.png"
          alt="SweatBuddies"
          className="auth-monster"
        />
        <h1 className="auth-brand">SweatBuddies</h1>
        <p className="auth-subtitle">Create your account and start crushing it.</p>
      </div>
      <div className="auth-card">
        <h3>Create Account</h3>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="handle-field">
            <div className="handle-input-wrap">
              <span className="handle-at">@</span>
              <input
                type="text"
                placeholder="yourhandle"
                value={handle}
                onChange={onHandleChange}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="handle-hint">{handleIndicator}</div>
          </div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading || handleStatus !== "available"} className="btn-primary">
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
