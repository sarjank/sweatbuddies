import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./BottomNav.css";

export default function BottomNav() {
  const { currentUser } = useAuth();
  const { pathname } = useLocation();
  if (!currentUser) return null;

  const active = (path) =>
    pathname === path || pathname.startsWith(path + "/") ? " bnav-item--active" : "";

  return (
    <nav className="bottom-nav">
      <Link to="/feed" className={`bnav-item${active("/feed")}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Feed</span>
      </Link>

      <Link to="/crews" className={`bnav-item${active("/crews")}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>Crews</span>
      </Link>

      <Link to="/log" className="bnav-fab" aria-label="Log workout">
        <span>+</span>
      </Link>

      <Link to="/awards" className={`bnav-item${active("/awards")}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
        <span>Awards</span>
      </Link>

      <Link to="/dashboard" className={`bnav-item${pathname === "/dashboard" || pathname === "/" ? " bnav-item--active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
        <span>Trends</span>
      </Link>
    </nav>
  );
}
