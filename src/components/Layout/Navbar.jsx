import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import "./Navbar.css";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      where("read", "==", false)
    );
    return onSnapshot(q, (snap) => setUnread(snap.size));
  }, [currentUser]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">💪 SweatBuddies</Link>
      {currentUser && (
        <div className="navbar-right">
          <Link to="/notifications" className="navbar-bell" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <button className="navbar-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="navbar-dropdown">
              <Link to="/friends" onClick={() => setMenuOpen(false)}>Buddies</Link>
              <Link to="/crews" onClick={() => setMenuOpen(false)}>Crews</Link>
              <Link to="/awards" onClick={() => setMenuOpen(false)}>Awards</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button onClick={handleLogout}>Log out</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
