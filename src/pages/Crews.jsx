import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection, query, where, getDocs, addDoc, serverTimestamp,
  doc, updateDoc, arrayUnion,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import MonsterAvatar from "../components/MonsterAvatar/MonsterAvatar";
import { GOAL_OPTIONS } from "../utils/crewGoals";
import "./Crews.css";

export default function Crews() {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list"); // "list" | "create"

  // Create form state
  const [crewName, setCrewName] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(""); // index into GOAL_OPTIONS or ""
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    loadCrews();
  }, [currentUser]);

  async function loadCrews() {
    setLoading(true);
    const q = query(
      collection(db, "crews"),
      where("members", "array-contains", currentUser.uid)
    );
    const snap = await getDocs(q);
    const crewDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Fetch a sample of member profiles for avatar stacks
    const allUids = [...new Set(crewDocs.flatMap((c) => c.members))];
    const profileMap = {};
    // We already have own profile
    profileMap[currentUser.uid] = {
      uid: currentUser.uid,
      monsterType: userProfile?.monsterType,
      displayName: userProfile?.displayName,
    };

    await Promise.all(
      allUids
        .filter((uid) => uid !== currentUser.uid)
        .map(async (uid) => {
          const snap = await getDocs(
            query(collection(db, "users"), where("uid", "==", uid))
          );
          if (!snap.empty) profileMap[uid] = snap.docs[0].data();
        })
    );

    setCrews(crewDocs.map((c) => ({ ...c, _profiles: profileMap })));
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const name = crewName.trim();
    if (!name) return setCreateError("Crew name is required.");
    if (name.length > 40) return setCreateError("Max 40 characters.");
    setCreating(true);
    setCreateError("");

    const goal = selectedGoal !== "" ? GOAL_OPTIONS[Number(selectedGoal)] : null;

    try {
      const crewRef = await addDoc(collection(db, "crews"), {
        name,
        createdBy: currentUser.uid,
        members: [currentUser.uid],
        goal: goal || null,
        createdAt: serverTimestamp(),
      });
      // Add crew to user's crews array
      await updateDoc(doc(db, "users", currentUser.uid), {
        crews: arrayUnion(crewRef.id),
      });
      await fetchUserProfile(currentUser.uid);
      setCrewName("");
      setSelectedGoal("");
      setTab("list");
      loadCrews();
    } catch (err) {
      setCreateError("Failed to create crew. Please try again.");
    }
    setCreating(false);
  }

  return (
    <div className="crews-page">
      <h1>Crews</h1>

      <div className="crews-tabs">
        <button
          className={`tab-btn${tab === "list" ? " tab-btn--active" : ""}`}
          onClick={() => setTab("list")}
        >
          My Crews {crews.length > 0 && <span className="tab-badge">{crews.length}</span>}
        </button>
        <button
          className={`tab-btn${tab === "create" ? " tab-btn--active" : ""}`}
          onClick={() => setTab("create")}
        >
          + Create Crew
        </button>
      </div>

      {tab === "list" && (
        <div className="crews-list">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="crew-card-skel" />
            ))
          ) : crews.length === 0 ? (
            <div className="crews-empty">
              <p>You're not in any crews yet.</p>
              <button className="btn-create-crew" onClick={() => setTab("create")}>
                Create your first crew
              </button>
            </div>
          ) : (
            crews.map((crew) => (
              <Link to={`/crews/${crew.id}`} key={crew.id} className="crew-card">
                <div className="crew-card-top">
                  <span className="crew-name">{crew.name}</span>
                  {crew.goal && (
                    <span className="crew-goal-pill">{crew.goal.label}</span>
                  )}
                </div>
                <div className="crew-card-bottom">
                  <div className="crew-avatars">
                    {crew.members.slice(0, 4).map((uid) => {
                      const p = crew._profiles?.[uid];
                      return p ? (
                        <div key={uid} className="crew-avatar-wrap">
                          <MonsterAvatar monsterType={p.monsterType} size="sm" />
                        </div>
                      ) : null;
                    })}
                    {crew.members.length > 4 && (
                      <span className="crew-avatar-more">+{crew.members.length - 4}</span>
                    )}
                  </div>
                  <span className="crew-member-count">
                    {crew.members.length} member{crew.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "create" && (
        <form className="crew-create-form" onSubmit={handleCreate}>
          <div className="crew-field">
            <label className="crew-field-label">Crew name</label>
            <input
              type="text"
              className="crew-input"
              placeholder="e.g. Morning Monsters"
              value={crewName}
              maxLength={40}
              onChange={(e) => setCrewName(e.target.value)}
            />
            <span className="crew-char-count">{crewName.length}/40</span>
          </div>

          <div className="crew-field">
            <label className="crew-field-label">Crew goal <span className="crew-field-opt">(optional)</span></label>
            <select
              className="crew-select"
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
            >
              <option value="">No goal</option>
              {GOAL_OPTIONS.map((g, i) => (
                <option key={i} value={i}>{g.label}</option>
              ))}
            </select>
          </div>

          {createError && <p className="crew-error">{createError}</p>}

          <button type="submit" className="btn-crew-submit" disabled={creating}>
            {creating ? "Creating…" : "Create Crew"}
          </button>
        </form>
      )}
    </div>
  );
}
