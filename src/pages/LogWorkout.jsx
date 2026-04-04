import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import "./LogWorkout.css";

const WORKOUT_TYPES = ["Strength", "Cardio", "HIIT", "Yoga", "Cycling", "Running", "Swimming", "Other"];

export default function LogWorkout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Strength");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState([{ name: "", sets: "", reps: "", weight: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addExercise() {
    setExercises([...exercises, { name: "", sets: "", reps: "", weight: "" }]);
  }

  function updateExercise(index, field, value) {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  }

  function removeExercise(index) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Please enter a workout title.");
    setLoading(true);
    try {
      const filteredExercises = exercises.filter((ex) => ex.name.trim());
      await addDoc(collection(db, "workouts"), {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        title: title.trim(),
        type,
        duration: Number(duration) || 0,
        notes: notes.trim(),
        exercises: filteredExercises,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", currentUser.uid), {
        workoutCount: increment(1),
      });
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to save workout. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="log-page">
      <h1>Log Workout</h1>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit} className="log-form">
        <div className="form-row">
          <div className="form-group">
            <label>Workout Title</label>
            <input
              type="text"
              placeholder="e.g. Morning Push Day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {WORKOUT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Duration (min)</label>
            <input
              type="number"
              placeholder="45"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Exercises</label>
          <div className="exercises-list">
            {exercises.map((ex, i) => (
              <div key={i} className="exercise-row">
                <input
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={(e) => updateExercise(i, "name", e.target.value)}
                />
                <input
                  placeholder="Sets"
                  type="number"
                  value={ex.sets}
                  onChange={(e) => updateExercise(i, "sets", e.target.value)}
                  min="1"
                />
                <input
                  placeholder="Reps"
                  type="number"
                  value={ex.reps}
                  onChange={(e) => updateExercise(i, "reps", e.target.value)}
                  min="1"
                />
                <input
                  placeholder="Weight (lbs)"
                  type="number"
                  value={ex.weight}
                  onChange={(e) => updateExercise(i, "weight", e.target.value)}
                  min="0"
                />
                {exercises.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeExercise(i)}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addExercise} className="btn-add-exercise">+ Add Exercise</button>
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            placeholder="How did it go? Any PRs?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? "Saving..." : "Save Workout"}
        </button>
      </form>
    </div>
  );
}
