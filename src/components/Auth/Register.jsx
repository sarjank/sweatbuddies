import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validateHandle, checkHandleAvailable } from "../../utils/handle";
import { db } from "../../firebase";
import "./Auth.css";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
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

  async function handleGoogle() {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch {
      setError("Google sign-in failed.");
    }
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
        <div className="auth-divider">or</div>
        <button onClick={handleGoogle} className="btn-google">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
