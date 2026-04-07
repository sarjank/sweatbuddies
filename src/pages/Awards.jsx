import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import MonsterAvatar from "../components/MonsterAvatar/MonsterAvatar";
import {
  AWARD_DEFS,
  computeAwardsForAll,
  monthLabel,
  currentYearMonth,
  prevMonth,
  nextMonth,
  monthPrefix,
} from "../utils/awards";
import "./Awards.css";

// Always render all awards — compute from AWARD_DEFS so grayed-out ones always show
function buildDefaultAwards() {
  return AWARD_DEFS.map((def) => ({ ...def, won: false, earners: [] }));
}

export default function Awards() {
  const { currentUser, userProfile } = useAuth();
  const now = currentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [awards, setAwards] = useState(buildDefaultAwards());
  const [crewAwards, setCrewAwards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    setLoading(true);
    fetchAwards();
  }, [year, month, currentUser, userProfile]);

  async function fetchAwards() {
    const uids = [currentUser.uid, ...(userProfile?.friends || [])].slice(0, 30);
    const prefix = monthPrefix(year, month);

    // Always start with the full locked set so page is never blank
    let computedAwards = buildDefaultAwards();
    let crewAwardDocs = [];

    try {
      // Fetch all workouts for the group — no range filter to avoid composite index.
      // Filter by month client-side.
      const wSnap = await getDocs(query(
        collection(db, "workouts"),
        where("uid", "in", uids)
      ));
      const workouts = wSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((w) => w.workoutDate?.startsWith(prefix));

      // Build profile map from workout data + current user
      const profileMap = {
        [currentUser.uid]: {
          uid: currentUser.uid,
          displayName: userProfile?.displayName || "",
          handle: userProfile?.handle || "",
          monsterType: userProfile?.monsterType || "goblin",
        },
      };
      for (const w of workouts) {
        if (!profileMap[w.uid]) {
          profileMap[w.uid] = {
            uid: w.uid,
            displayName: w.displayName,
            handle: w.handle,
            monsterType: w.monsterType,
          };
        }
      }

      computedAwards = computeAwardsForAll(workouts, currentUser.uid, profileMap);
    } catch (err) {
      console.warn("Awards: workout query failed, showing all awards locked.", err);
      // Keep the default locked awards — don't crash the page
    }

    try {
      const caSnap = await getDocs(query(
        collection(db, "crew_awards"),
        where("memberUids", "array-contains", currentUser.uid)
      ));
      crewAwardDocs = caSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((ca) => ca.periodKey?.startsWith(prefix));
    } catch (err) {
      console.warn("Awards: crew_awards query failed, skipping crew awards.", err);
    }

    // Won awards at top, locked below — always show all
    const sorted = [
      ...computedAwards.filter((a) => a.won),
      ...computedAwards.filter((a) => !a.won),
    ];

    setAwards(sorted);
    setCrewAwards(crewAwardDocs);
    setLoading(false);
  }

  const isFuture = year > now.year || (year === now.year && month > now.month);
  function goPrev() { const p = prevMonth(year, month); setYear(p.year); setMonth(p.month); }
  function goNext() { if (isFuture) return; const n = nextMonth(year, month); setYear(n.year); setMonth(n.month); }

  return (
    <div className="awards-page">
      <div className="awards-header-row">
        <h1>Awards This Month</h1>
      </div>

      <div className="awards-month-row">
        <button className="awards-month-btn" onClick={goPrev}>‹</button>
        <span className="awards-month-label">{monthLabel(year, month)}</span>
        <button className="awards-month-btn" onClick={goNext} disabled={isFuture}>›</button>
      </div>

      {loading ? (
        <div className="awards-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="award-card-skel" />
          ))}
        </div>
      ) : (
        <>
          {awards.filter((a) => a.won).length === 0 && (
            <p className="awards-none-yet">No awards earned yet — keep logging!</p>
          )}

          <div className="awards-list">
            {awards.map((award) => (
              <div
                key={award.id}
                className={`award-card${award.won ? " award-card--won" : " award-card--locked"}`}
              >
                <div
                  className="award-icon-wrap"
                  style={award.won
                    ? { background: award.color + "22", borderColor: award.color + "55" }
                    : {}}
                >
                  <span
                    className="award-icon-emoji"
                    style={award.won ? {} : { filter: "grayscale(1) opacity(0.3)" }}
                  >
                    {award.icon}
                  </span>
                </div>

                <div className="award-body">
                  <span className={`award-label${award.won ? "" : " award-label--locked"}`}>
                    {award.label}
                  </span>
                  <span className="award-desc">{award.description}</span>

                  {award.earners?.length > 0 && (
                    <div className="award-earners">
                      {award.earners.slice(0, 6).map((p) => (
                        <div key={p.uid} className="award-earner" title={p.displayName}>
                          <MonsterAvatar monsterType={p.monsterType} size="sm" />
                        </div>
                      ))}
                      {award.earners.length > 6 && (
                        <span className="award-earners-more">+{award.earners.length - 6}</span>
                      )}
                    </div>
                  )}
                </div>

                {award.won ? (
                  <div className="award-badge-dot" style={{ background: award.color }} />
                ) : (
                  <span className="award-locked-icon">🔒</span>
                )}
              </div>
            ))}
          </div>

          {crewAwards.length > 0 && (
            <div className="crew-awards-section">
              <h2 className="crew-awards-title">Crew Awards</h2>
              <div className="awards-list">
                {crewAwards.map((ca) => (
                  <div key={ca.id} className="award-card award-card--crew">
                    <div className="award-icon-wrap" style={{ background: "#fbbf2422", borderColor: "#fbbf2455" }}>
                      <span className="award-icon-emoji">🏅</span>
                    </div>
                    <div className="award-body">
                      <span className="award-label">{ca.crewName}</span>
                      <span className="award-desc">{ca.goal?.label}</span>
                      <span className="award-desc crew-award-members">
                        All {ca.memberUids?.length} members completed this goal
                      </span>
                    </div>
                    <div className="award-badge-dot" style={{ background: "#fbbf24" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
