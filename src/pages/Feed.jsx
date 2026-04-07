import { useEffect, useState } from "react";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import WorkoutCard from "../components/Workouts/WorkoutCard";
import "./Feed.css";

export default function Feed() {
  const { currentUser, userProfile } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likingId, setLikingId] = useState(null);

  useEffect(() => {
    if (userProfile === null) return;
    const uids = [currentUser.uid, ...(userProfile?.friends || [])].slice(0, 30);

    // No orderBy — avoids requiring a composite index. Sort client-side instead.
    const q = query(
      collection(db, "workouts"),
      where("uid", "in", uids)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort by workoutDate desc, then createdAt desc for same-day ordering
        docs.sort((a, b) => {
          if (b.workoutDate !== a.workoutDate) {
            return b.workoutDate.localeCompare(a.workoutDate);
          }
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
        setWorkouts(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Feed query error:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [currentUser, userProfile]);

  async function toggleLike(workout) {
    if (likingId === workout.id) return;
    setLikingId(workout.id);
    const liked = workout.likes?.includes(currentUser.uid);
    await updateDoc(doc(db, "workouts", workout.id), {
      likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
    if (!liked && workout.uid !== currentUser.uid) {
      await addDoc(collection(db, "notifications"), {
        uid: workout.uid,
        type: "like",
        actorName: userProfile?.displayName || "",
        actorHandle: userProfile?.handle || "",
        actorMonsterType: userProfile?.monsterType || "goblin",
        workoutId: workout.id,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    setLikingId(null);
  }

  return (
    <div className="feed-page">
      <h1>Feed</h1>
      {loading ? (
        <div className="feed-skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="feed-card-skel" />
          ))}
        </div>
      ) : error ? (
        <div className="feed-error">
          <p>Couldn't load workouts.</p>
          <p className="feed-error-detail">{error}</p>
        </div>
      ) : workouts.length === 0 ? (
        <p className="muted">No activity yet. Add some buddies and start logging!</p>
      ) : (
        <div className="feed-list">
          {workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              currentUid={currentUser.uid}
              onLike={toggleLike}
              likingId={likingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
