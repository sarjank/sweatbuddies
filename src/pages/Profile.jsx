import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import "./Profile.css";

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkouts() {
      const q = query(
        collection(db, "workouts"),
        where("uid", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setWorkouts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchWorkouts();
  }, [currentUser]);

  const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {userProfile?.displayName?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <h1>{userProfile?.displayName}</h1>
          <p className="profile-email">{currentUser.email}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="pstat">
          <span className="pstat-num">{userProfile?.workoutCount || 0}</span>
          <span className="pstat-label">Workouts</span>
        </div>
        <div className="pstat">
          <span className="pstat-num">{totalMinutes}</span>
          <span className="pstat-label">Total Minutes</span>
        </div>
        <div className="pstat">
          <span className="pstat-num">{userProfile?.friends?.length || 0}</span>
          <span className="pstat-label">Buddies</span>
        </div>
      </div>

      <h2>Workout History</h2>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : workouts.length === 0 ? (
        <p className="muted">No workouts logged yet.</p>
      ) : (
        <div className="history-list">
          {workouts.map((w) => (
            <div key={w.id} className="history-card">
              <div className="history-left">
                <strong>{w.title}</strong>
                <span className="type-badge">{w.type}</span>
              </div>
              <div className="history-right">
                <span>{w.duration} min</span>
                <span className="muted small">
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
