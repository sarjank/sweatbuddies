import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import "./Feed.css";

export default function Feed() {
  const { currentUser, userProfile } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeed() {
      const uids = [currentUser.uid, ...(userProfile?.friends || [])];
      if (!uids.length) { setLoading(false); return; }

      // Firestore "in" supports up to 30 values
      const q = query(
        collection(db, "workouts"),
        where("uid", "in", uids.slice(0, 30)),
        orderBy("createdAt", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);
      setWorkouts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    if (userProfile !== null) fetchFeed();
  }, [currentUser, userProfile]);

  if (loading) return <div className="feed-page"><p>Loading feed...</p></div>;

  return (
    <div className="feed-page">
      <h1>Activity Feed</h1>
      {workouts.length === 0 ? (
        <p className="muted">No activity yet. Add some friends and start logging!</p>
      ) : (
        <div className="feed-list">
          {workouts.map((w) => (
            <div key={w.id} className="feed-card">
              <div className="feed-avatar">
                {w.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="feed-body">
                <div className="feed-top">
                  <strong>{w.displayName}</strong>
                  <span className="feed-type">{w.type}</span>
                </div>
                <p className="feed-title">{w.title}</p>
                <div className="feed-meta">
                  <span>{w.duration} min</span>
                  {w.exercises?.length > 0 && (
                    <span>{w.exercises.length} exercise{w.exercises.length > 1 ? "s" : ""}</span>
                  )}
                  <span className="feed-date">
                    {w.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
                {w.notes && <p className="feed-notes">"{w.notes}"</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
