import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-hero">
        <img
          src="/sweatbuddies/Fluffy monster hits the gym.png"
          alt="SweatBuddies"
          className="auth-monster"
        />
        <h1 className="auth-brand">SweatBuddies</h1>
        <p className="auth-subtitle">Welcome back! Let's get moving.</p>
      </div>
      <div className="auth-card">
        <h3>Sign In</h3>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
