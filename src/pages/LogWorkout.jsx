import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, addDoc, serverTimestamp, doc, increment,
  writeBatch
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { todayDateStr } from "../utils/streak";
import { hasPBThisWeek } from "../utils/personalBest";
import { computeBadges } from "../utils/badges";
import "./LogWorkout.css";

const TYPES = [
  { key: "cardio", label: "Cardio", icon: "🏃" },
  { key: "weights", label: "Weights", icon: "🏋️" },
  { key: "both", label: "Both", icon: "🔥" },
];

export default function LogWorkout() {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const today = todayDateStr();
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const [workoutDate, setWorkoutDate] = useState(today);
  const [selectedType, setSelectedType] = useState(null);
  const [note, setNote] = useState("");
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [pbAllowed, setPbAllowed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function checkPB() {
      const has = await hasPBThisWeek(currentUser.uid, db);
      setPbAllowed(!has);
    }
    checkPB();
  }, [currentUser]);

  async function handleSelect(type) {
    if (loading) return;
    setSelectedType(type);
    setError("");
    setLoading(true);
    try {
      const newCount = (userProfile?.workoutCount || 0) + 1;
      const newBadges = computeBadges(newCount).map((b) => b.id);

      await addDoc(collection(db, "workouts"), {
        uid: currentUser.uid,
        displayName: userProfile?.displayName || currentUser.displayName,
        handle: userProfile?.handle || "",
        monsterType: userProfile?.monsterType || "goblin",
        type,
        note: note.trim(),
        workoutDate: workoutDate,
        createdAt: serverTimestamp(),
        isPersonalBest: pbAllowed && isPersonalBest,
        likes: [],
      });

      const batch = writeBatch(db);
      batch.update(doc(db, "users", currentUser.uid), {
        workoutCount: increment(1),
        badges: newBadges,
      });

      if (pbAllowed && isPersonalBest && userProfile?.friends?.length) {
        for (const friendUid of userProfile.friends) {
          const notifRef = doc(collection(db, "notifications"));
          batch.set(notifRef, {
            uid: friendUid,
            type: "personal_best",
            actorName: userProfile?.displayName || "",
            actorHandle: userProfile?.handle || "",
            actorMonsterType: userProfile?.monsterType || "goblin",
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
      await batch.commit();
      await fetchUserProfile(currentUser.uid);

      setSaved(true);
      setNote("");
      setIsPersonalBest(false);
      setSelectedType(null);
      setTimeout(() => {
        setSaved(false);
        navigate("/feed");
      }, 900);
    } catch (err) {
      setError("Failed to save. Please try again.");
      setSelectedType(null);
    }
    setLoading(false);
  }

  return (
    <div className="log-page">
      <h1>Log Workout</h1>

      <div className="log-date-row">
        <label className="log-date-label">Workout date</label>
        <input
          type="date"
          className="log-date-input"
          value={workoutDate}
          min={minDate}
          max={today}
          onChange={(e) => { setWorkoutDate(e.target.value); setSelectedType(null); }}
        />
      </div>

      {saved ? (
        <div className="log-saved">
          <span>✓</span> Workout logged!
        </div>
      ) : (
        <>
          <p className="log-prompt">What did you crush?</p>
          <div className="log-buttons">
            {TYPES.map(({ key, label }) => (
              <button
                key={key}
                className={`log-type-btn log-type-btn--${key}${selectedType === key ? " log-type-btn--active" : ""}`}
                onClick={() => handleSelect(key)}
                disabled={loading}
              >
                <span className={`log-monster-img log-monster-img--${key}`} aria-hidden="true" />
                <span className="log-type-label">{label}</span>
              </button>
            ))}
          </div>

          <div className="log-note-row">
            <textarea
              className="log-note"
              placeholder="Add a note… (optional, 140 chars)"
              value={note}
              maxLength={140}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            <span className="log-note-count">{note.length}/140</span>
          </div>

          {pbAllowed ? (
            <label className="log-pb-label">
              <input
                type="checkbox"
                checked={isPersonalBest}
                onChange={(e) => setIsPersonalBest(e.target.checked)}
              />
              <span>🏆 Mark as Personal Best this week</span>
            </label>
          ) : (
            <p className="log-pb-set">🏆 PB already set this week</p>
          )}

          {error && <div className="log-error">{error}</div>}
          <p className="log-hint">Tap a workout type above to log instantly.</p>
        </>
      )}
    </div>
  );
}
