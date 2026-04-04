import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import "./Dashboard.css";

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      const q = query(
        collection(db, "workouts"),
        where("uid", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const snap = await getDocs(q);
      setRecentWorkouts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchRecent();
  }, [currentUser]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Hey, {userProfile?.displayName || currentUser.email} 👋</h1>
          <p className="dashboard-sub">Ready to sweat today?</p>
        </div>
        <Link to="/log" className="btn-cta">+ Log Workout</Link>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-num">{userProfile?.workoutCount || 0}</span>
          <span className="stat-label">Total Workouts</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{userProfile?.friends?.length || 0}</span>
          <span className="stat-label">Sweat Buddies</span>
        </div>
      </div>

      <h2 className="section-title">Recent Workouts</h2>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : recentWorkouts.length === 0 ? (
        <div className="empty-state">
          <p>No workouts yet. <Link to="/log">Log your first one!</Link></p>
        </div>
      ) : (
        <div className="workout-list">
          {recentWorkouts.map((w) => (
            <div key={w.id} className="workout-card">
              <div className="workout-info">
                <strong>{w.title}</strong>
                <span className="workout-type">{w.type}</span>
              </div>
              <div className="workout-meta">
                <span>{w.duration} min</span>
                <span className="workout-date">
                  {w.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
