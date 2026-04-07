import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, getDoc, getDocs, collection, query, where,
  updateDoc, arrayUnion, arrayRemove, deleteDoc,
  addDoc, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import MonsterAvatar from "../components/MonsterAvatar/MonsterAvatar";
import { getUserByHandle } from "../utils/handle";
import { GOAL_OPTIONS, evaluateGoal, crewGoalMet, currentWeekRange, currentPeriodKey } from "../utils/crewGoals";
import "./CrewDetail.css";

export default function CrewDetail() {
  const { crewId } = useParams();
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const [crew, setCrew] = useState(null);
  const [members, setMembers] = useState([]); // full profile objects
  const [weekWorkouts, setWeekWorkouts] = useState({}); // { uid: workouts[] }
  const [loading, setLoading] = useState(true);

  // Add member state
  const [handleInput, setHandleInput] = useState("");
  const [searchResult, setSearchResult] = useState(null); // null | false | profile
  const [searching, setSearching] = useState(false);
  const [addingUid, setAddingUid] = useState(null);

  // Goal edit state
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalIdx, setGoalIdx] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const [message, setMessage] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    load();
  }, [crewId]);

  async function load() {
    setLoading(true);
    const crewSnap = await getDoc(doc(db, "crews", crewId));
    if (!crewSnap.exists()) { navigate("/crews"); return; }
    const crewData = { id: crewSnap.id, ...crewSnap.data() };
    setCrew(crewData);

    // Load member profiles
    const profileSnaps = await Promise.all(
      crewData.members.map((uid) => getDoc(doc(db, "users", uid)))
    );
    const profiles = profileSnaps
      .filter((s) => s.exists())
      .map((s) => s.data());
    setMembers(profiles);

    // Load this week's workouts for all members — no range filter to avoid composite index
    const { start, end } = currentWeekRange();
    if (crewData.members.length > 0) {
      const wSnap = await getDocs(query(
        collection(db, "workouts"),
        where("uid", "in", crewData.members.slice(0, 30))
      ));
      const byUid = {};
      wSnap.docs.forEach((d) => {
        const w = d.data();
        if (!w.workoutDate || w.workoutDate < start || w.workoutDate > end) return;
        if (!byUid[w.uid]) byUid[w.uid] = [];
        byUid[w.uid].push(w);
      });
      setWeekWorkouts(byUid);
    }
    setLoading(false);
  }

  async function handleAddMember(e) {
    e.preventDefault();
    const handle = handleInput.trim().replace(/^@/, "").toLowerCase();
    if (!handle) return;
    setSearching(true);
    setSearchResult(null);
    const user = await getUserByHandle(handle, db);
    setSearchResult(user === null ? false : user);
    setSearching(false);
  }

  async function confirmAdd(profile) {
    if (crew.members.includes(profile.uid)) {
      return flash("Already in this crew.");
    }
    setAddingUid(profile.uid);
    const batch = writeBatch(db);
    batch.update(doc(db, "crews", crewId), {
      members: arrayUnion(profile.uid),
    });
    batch.update(doc(db, "users", profile.uid), {
      crews: arrayUnion(crewId),
    });
    // Notify existing members
    for (const memberUid of crew.members) {
      const notifRef = doc(collection(db, "notifications"));
      batch.set(notifRef, {
        uid: memberUid,
        type: "crew_member_joined",
        actorName: profile.displayName,
        actorHandle: profile.handle || "",
        actorMonsterType: profile.monsterType || "goblin",
        crewName: crew.name,
        crewId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
    flash(`${profile.displayName} added to the crew!`);
    setHandleInput("");
    setSearchResult(null);
    setAddingUid(null);
    load();
  }

  async function handleSaveGoal() {
    setSavingGoal(true);
    const goal = goalIdx !== "" ? GOAL_OPTIONS[Number(goalIdx)] : null;
    await updateDoc(doc(db, "crews", crewId), { goal: goal || null });

    // If all members now meet the new goal, write a crew award
    if (goal) {
      const allMet = crewGoalMet(goal, weekWorkouts, crew.members);
      if (allMet) {
        await writeCrewAward(crew, goal);
      }
    }
    setSavingGoal(false);
    setEditingGoal(false);
    load();
  }

  async function writeCrewAward(crewData, goal) {
    const periodKey = currentPeriodKey(goal.period);
    // Avoid duplicate awards for same crew + period
    const existing = await getDocs(
      query(
        collection(db, "crew_awards"),
        where("crewId", "==", crewId),
        where("periodKey", "==", periodKey)
      )
    );
    if (!existing.empty) return;

    const batch = writeBatch(db);
    const awardRef = doc(collection(db, "crew_awards"));
    batch.set(awardRef, {
      crewId,
      crewName: crewData.name,
      goal,
      memberUids: crewData.members,
      periodKey,
      createdAt: serverTimestamp(),
    });
    // Notify all members
    for (const uid of crewData.members) {
      const notifRef = doc(collection(db, "notifications"));
      batch.set(notifRef, {
        uid,
        type: "crew_goal_met",
        crewName: crewData.name,
        crewId,
        goalLabel: goal.label,
        actorMonsterType: null,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  async function handleLeave() {
    if (!window.confirm(`Leave "${crew.name}"?`)) return;
    setLeaving(true);
    const batch = writeBatch(db);
    batch.update(doc(db, "crews", crewId), {
      members: arrayRemove(currentUser.uid),
    });
    batch.update(doc(db, "users", currentUser.uid), {
      crews: arrayRemove(crewId),
    });
    await batch.commit();
    await fetchUserProfile(currentUser.uid);
    navigate("/crews");
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${crew.name}" for everyone?`)) return;
    setLeaving(true);
    const batch = writeBatch(db);
    // Remove crewId from all members' users docs
    for (const uid of crew.members) {
      batch.update(doc(db, "users", uid), {
        crews: arrayRemove(crewId),
      });
    }
    batch.delete(doc(db, "crews", crewId));
    await batch.commit();
    await fetchUserProfile(currentUser.uid);
    navigate("/crews");
  }

  function flash(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  if (loading) {
    return (
      <div className="crew-detail-page">
        <div className="crew-detail-skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="crew-member-skel" />
          ))}
        </div>
      </div>
    );
  }

  if (!crew) return null;

  const isCreator = crew.createdBy === currentUser.uid;
  const allMet = crew.goal
    ? crewGoalMet(crew.goal, weekWorkouts, crew.members)
    : false;

  return (
    <div className="crew-detail-page">
      {/* Header */}
      <div className="crew-detail-header">
        <button className="crew-back-btn" onClick={() => navigate("/crews")}>‹ Crews</button>
        <h1>{crew.name}</h1>
        {crew.goal && (
          <span className="crew-goal-pill">{crew.goal.label}</span>
        )}
      </div>

      {message && <div className="crew-flash">{message}</div>}

      {/* Weekly goal progress */}
      {crew.goal && (
        <section className="crew-section">
          <h2 className="crew-section-title">This Week's Goal</h2>
          {allMet && (
            <div className="crew-all-met">🏆 Everyone crushed it this week!</div>
          )}
          <div className="crew-progress-list">
            {members.map((m) => {
              const ws = weekWorkouts[m.uid] || [];
              const { met, progress, target } = evaluateGoal(crew.goal, ws);
              const pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
              return (
                <div key={m.uid} className="crew-progress-row">
                  <MonsterAvatar monsterType={m.monsterType} size="sm" />
                  <div className="crew-progress-info">
                    <div className="crew-progress-name">
                      {m.uid === currentUser.uid ? "You" : m.displayName}
                    </div>
                    <div className="crew-progress-bar-wrap">
                      <div
                        className={`crew-progress-bar${met ? " crew-progress-bar--met" : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`crew-progress-stat${met ? " crew-progress-stat--met" : ""}`}>
                    {met ? "✓" : `${progress}/${target}`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Members */}
      <section className="crew-section">
        <h2 className="crew-section-title">Members ({members.length})</h2>
        <div className="crew-members-list">
          {members.map((m) => (
            <div key={m.uid} className="crew-member-row">
              <MonsterAvatar monsterType={m.monsterType} size="sm" />
              <div className="crew-member-info">
                <span className="crew-member-name">
                  {m.uid === currentUser.uid ? "You" : m.displayName}
                  {m.uid === crew.createdBy && (
                    <span className="crew-creator-badge">creator</span>
                  )}
                </span>
                {m.handle && <span className="crew-member-handle">@{m.handle}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add member */}
      <section className="crew-section">
        <h2 className="crew-section-title">Add Member</h2>
        <form className="crew-add-form" onSubmit={handleAddMember}>
          <div className="handle-search-wrap">
            <span className="handle-at">@</span>
            <input
              type="text"
              placeholder="theirhandle"
              value={handleInput}
              onChange={(e) => { setHandleInput(e.target.value.replace(/^@/, "")); setSearchResult(null); }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" disabled={searching} className="btn-search">
            {searching ? "…" : "Find"}
          </button>
        </form>
        {searchResult === false && (
          <p className="crew-not-found">No user found with that handle.</p>
        )}
        {searchResult && (
          <div className="crew-search-result">
            <MonsterAvatar monsterType={searchResult.monsterType} size="sm" />
            <div className="crew-sr-info">
              <strong>{searchResult.displayName}</strong>
              <span className="crew-member-handle">@{searchResult.handle}</span>
            </div>
            {crew.members.includes(searchResult.uid) ? (
              <span className="crew-already-in">Already in crew</span>
            ) : (
              <button
                className="btn-add-buddy"
                onClick={() => confirmAdd(searchResult)}
                disabled={addingUid === searchResult.uid}
              >
                Add
              </button>
            )}
          </div>
        )}
      </section>

      {/* Goal management */}
      <section className="crew-section">
        <div className="crew-section-row">
          <h2 className="crew-section-title">Goal</h2>
          <button className="crew-edit-btn" onClick={() => setEditingGoal(!editingGoal)}>
            {editingGoal ? "Cancel" : "Change"}
          </button>
        </div>
        {!editingGoal ? (
          <p className="crew-current-goal">
            {crew.goal ? crew.goal.label : <span className="crew-no-goal">No goal set</span>}
          </p>
        ) : (
          <div className="crew-goal-edit">
            <select
              className="crew-select"
              value={goalIdx}
              onChange={(e) => setGoalIdx(e.target.value)}
            >
              <option value="">No goal</option>
              {GOAL_OPTIONS.map((g, i) => (
                <option key={i} value={i}>{g.label}</option>
              ))}
            </select>
            <button className="btn-crew-submit" onClick={handleSaveGoal} disabled={savingGoal}>
              {savingGoal ? "Saving…" : "Save Goal"}
            </button>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="crew-section crew-danger-zone">
        {isCreator ? (
          <button className="btn-danger" onClick={handleDelete} disabled={leaving}>
            Delete Crew
          </button>
        ) : (
          <button className="btn-danger btn-danger--secondary" onClick={handleLeave} disabled={leaving}>
            Leave Crew
          </button>
        )}
      </section>
    </div>
  );
}
