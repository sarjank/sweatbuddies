import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">💪 Sweat Buddies</Link>
      {currentUser && (
        <div className="navbar-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/log">Log Workout</Link>
          <Link to="/friends">Friends</Link>
          <Link to="/feed">Feed</Link>
          <Link to="/profile">Profile</Link>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      )}
    </nav>
  );
}
