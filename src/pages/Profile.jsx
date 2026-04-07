import { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import MonsterAvatar from "../components/MonsterAvatar/MonsterAvatar";
import { calcStreak, calcLongestStreak, formatWorkoutDate } from "../utils/streak";
import { computeBadges } from "../utils/badges";
import "./Profile.css";

const TYPE_ICONS = { cardio: "🏃", weights: "🏋️", both: "🔥" };

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkouts() {
      const q = query(
        collection(db, "workouts"),
        where("uid", "==", currentUser.uid)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.workoutDate || "").localeCompare(a.workoutDate || ""));
      setWorkouts(docs);
      setLoading(false);
    }
    fetchWorkouts();
  }, [currentUser]);

  async function handleDeleteWorkout(workout) {
    if (!window.confirm("Delete this workout? This can't be undone.")) return;
    await deleteDoc(doc(db, "workouts", workout.id));
    await updateDoc(doc(db, "users", currentUser.uid), {
      workoutCount: increment(-1),
    });
    setWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
  }

  const dates = workouts.map((w) => w.workoutDate).filter(Boolean);
  const streak = calcStreak(dates);
  const longestStreak = calcLongestStreak(dates);
  const pbCount = workouts.filter((w) => w.isPersonalBest).length;
  const workoutCount = userProfile?.workoutCount || workouts.length;
  const badges = computeBadges(workoutCount);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <MonsterAvatar monsterType={userProfile?.monsterType} size="lg" />
        <div className="profile-header-text">
          <h1>{userProfile?.displayName}</h1>
          {userProfile?.handle && <p className="profile-handle">@{userProfile.handle}</p>}
          <p className="profile-email">{currentUser.email}</p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="profile-badges">
          {badges.map((b) => (
            <div key={b.id} className="badge-chip" title={b.label}>
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="profile-stats">
        <div className="pstat">
          <span className="pstat-num">{workoutCount}</span>
          <span className="pstat-label">Workouts</span>
        </div>
        <div className="pstat">
          <span className="pstat-num">{streak}</span>
          <span className="pstat-label">Streak</span>
        </div>
        <div className="pstat">
          <span className="pstat-num">{longestStreak}</span>
          <span className="pstat-label">Best Streak</span>
        </div>
        <div className="pstat">
          <span className="pstat-num">{pbCount}</span>
          <span className="pstat-label">Personal Bests</span>
        </div>
        <div className="pstat">
          <span className="pstat-num">{userProfile?.friends?.length || 0}</span>
          <span className="pstat-label">Buddies</span>
        </div>
      </div>

      <h2 className="section-title">Workout History</h2>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : workouts.length === 0 ? (
        <p className="muted">No workouts logged yet.</p>
      ) : (
        <div className="history-list">
          {workouts.map((w) => (
            <div key={w.id} className="history-card">
              <div className="history-left">
                <span className="history-icon">{TYPE_ICONS[w.type] || "💪"}</span>
                <div>
                  <span className="history-type">{w.type}</span>
                  {w.note && <p className="history-note">"{w.note}"</p>}
                </div>
                {w.isPersonalBest && <span className="pb-badge">🏆 PB</span>}
              </div>
              <div className="history-right">
                <span className="history-date">{formatWorkoutDate(w.workoutDate)}</span>
                <button
                  className="history-delete-btn"
                  onClick={() => handleDeleteWorkout(w)}
                  aria-label="Delete workout"
                >×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
