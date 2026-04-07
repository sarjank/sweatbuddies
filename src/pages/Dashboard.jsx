import { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import MonsterAvatar from "../components/MonsterAvatar/MonsterAvatar";
import { calcStreak, todayDateStr } from "../utils/streak";
import "./Dashboard.css";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const TYPE_ICONS = { cardio: "🏃", weights: "🏋️", both: "🔥" };
const TYPE_LABELS = { cardio: "Run", weights: "Lift", both: "Both" };

function getWeekDates(offsetWeeks = 0) {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function weekRangeLabel(weekDates) {
  const start = new Date(weekDates[0] + "T00:00:00");
  const end = new Date(weekDates[6] + "T00:00:00");
  const opts = { month: "short", day: "numeric" };
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString(undefined, { month: "short" })} ${start.getDate()}–${end.getDate()}`;
  }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [weekWorkouts, setWeekWorkouts] = useState([]);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayDateStr());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Crew filter
  const [crews, setCrews] = useState([]);
  const [activeCrew, setActiveCrew] = useState(null);

  const weekDates = getWeekDates(weekOffset);

  useEffect(() => {
    if (userProfile === null) return;
    loadCrews();
  }, [userProfile]);

  useEffect(() => {
    if (userProfile === null) return;
    // When changing weeks, select the most relevant date
    const today = todayDateStr();
    if (weekDates.includes(today)) {
      setSelectedDate(today);
    } else {
      setSelectedDate(weekDates[6]); // last day of past week
    }
    fetchData(activeCrew);
  }, [currentUser, userProfile, weekOffset, activeCrew]);

  async function loadCrews() {
    if (!userProfile) return;
    try {
      const q = query(
        collection(db, "crews"),
        where("members", "array-contains", currentUser.uid)
      );
      const snap = await getDocs(q);
      setCrews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.warn("Crews load failed:", e);
    }
  }

  async function fetchData(crewFilter) {
    setLoading(true);
    setError(null);
    try {
      const uids = crewFilter
        ? crewFilter.members.slice(0, 30)
        : [currentUser.uid, ...(userProfile?.friends || [])].slice(0, 30);

      const weekStart = weekDates[0];
      const weekEnd = weekDates[6];

      // Fetch all workouts for the group and own — no range/orderBy filters to
      // avoid requiring composite indexes. Filter and sort client-side.
      const [groupSnap, ownSnap] = await Promise.all([
        getDocs(query(collection(db, "workouts"), where("uid", "in", uids))),
        getDocs(query(collection(db, "workouts"), where("uid", "==", currentUser.uid))),
      ]);

      const allGroupDocs = groupSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const weekDocs = allGroupDocs
        .filter((w) => w.workoutDate >= weekStart && w.workoutDate <= weekEnd)
        .sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));

      const ownDocs = ownSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));

      setWeekWorkouts(weekDocs);
      setAllWorkouts(ownDocs);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleDeleteWorkout(workout) {
    if (!window.confirm("Delete this workout? This can't be undone.")) return;
    await deleteDoc(doc(db, "workouts", workout.id));
    await updateDoc(doc(db, "users", currentUser.uid), { workoutCount: increment(-1) });
    setWeekWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
    setAllWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
  }

  const streak = calcStreak(allWorkouts.map((w) => w.workoutDate).filter(Boolean));
  const thisWeekOwn = weekWorkouts.filter((w) => w.uid === currentUser.uid).length;
  const totalCount = userProfile?.workoutCount || allWorkouts.length;

  const byDate = {};
  weekWorkouts.forEach((w) => {
    if (!byDate[w.workoutDate]) byDate[w.workoutDate] = [];
    byDate[w.workoutDate].push(w);
  });

  const selectedWorkouts = byDate[selectedDate] || [];
  const sorted = [
    ...selectedWorkouts.filter((w) => w.uid === currentUser.uid),
    ...selectedWorkouts.filter((w) => w.uid !== currentUser.uid),
  ];

  function formatSelectedDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  const name = userProfile?.displayName || currentUser.email;
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="dash">
      {/* Profile header */}
      <div className="dash-header">
        <MonsterAvatar monsterType={userProfile?.monsterType} size="md" />
        <div className="dash-header-text">
          <h2>{name}</h2>
          {userProfile?.handle && <span className="dash-handle">@{userProfile.handle}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <div className="dstat">
          <span className="dstat-icon">🔥</span>
          <span className="dstat-val">{streak}</span>
          <span className="dstat-label">days</span>
          <span className="dstat-sub">Streak</span>
        </div>
        <div className="dstat">
          <span className="dstat-icon">🏆</span>
          <span className="dstat-val">{thisWeekOwn}</span>
          <span className="dstat-sub">This week</span>
        </div>
        <div className="dstat">
          <span className="dstat-icon">📅</span>
          <span className="dstat-val">{totalCount}</span>
          <span className="dstat-sub">Total</span>
        </div>
      </div>

      {/* Crew filter pills */}
      {crews.length > 0 && (
        <div className="crew-filter-row">
          <button
            className={`crew-pill${activeCrew === null ? " crew-pill--active" : ""}`}
            onClick={() => setActiveCrew(null)}
          >
            Everyone
          </button>
          {crews.map((c) => (
            <button
              key={c.id}
              className={`crew-pill${activeCrew?.id === c.id ? " crew-pill--active" : ""}`}
              onClick={() => setActiveCrew(activeCrew?.id === c.id ? null : c)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Week navigation */}
      <div className="week-nav">
        <button className="week-nav-btn" onClick={() => setWeekOffset(w => w - 1)}>‹</button>
        <span className="week-nav-label">
          {isCurrentWeek ? "This Week" : weekRangeLabel(weekDates)}
        </span>
        <button
          className="week-nav-btn"
          onClick={() => setWeekOffset(w => w + 1)}
          disabled={isCurrentWeek}
        >›</button>
      </div>

      {/* Weekly strip */}
      <div className="week-strip">
        {weekDates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const isToday = date === todayDateStr();
          const isSelected = date === selectedDate;
          const hasDot = !!byDate[date]?.length;
          const isFuture = date > todayDateStr();
          return (
            <button
              key={date}
              className={`week-day${isSelected ? " week-day--selected" : ""}${isToday && !isSelected ? " week-day--today" : ""}${isFuture ? " week-day--future" : ""}`}
              onClick={() => setSelectedDate(date)}
              disabled={isFuture}
            >
              <span className="wd-name">{DAY_NAMES[d.getDay()]}</span>
              <span className="wd-num">{d.getDate()}</span>
              <span className={`wd-dot${hasDot ? " wd-dot--on" : ""}`} />
            </button>
          );
        })}
      </div>

      {/* Daily check-ins */}
      <div className="checkins-header">
        <span className="checkins-date">{formatSelectedDate(selectedDate)}</span>
        {sorted.length > 0 && (
          <span className="checkins-badge">{sorted.length} check-in{sorted.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {error ? (
        <div className="dash-error">
          <p>Couldn't load data.</p>
          <p className="dash-error-detail">{error}</p>
        </div>
      ) : loading ? (
        <div className="checkins-skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="checkin-skel" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="checkins-empty">No check-ins for this day.</p>
      ) : (
        <div className="checkins-list">
          {sorted.map((w) => {
            const isMe = w.uid === currentUser.uid;
            return (
              <div key={w.id} className={`checkin${isMe ? " checkin--me" : ""}`}>
                <MonsterAvatar monsterType={w.monsterType || (isMe ? userProfile?.monsterType : null)} size="sm" />
                <span className="checkin-name">{isMe ? "You" : w.displayName}</span>
                {w.isPersonalBest && <span className="pb-badge">🏆</span>}
                <div className="checkin-type">
                  <span>{TYPE_ICONS[w.type] || "💪"}</span>
                  <span>{TYPE_LABELS[w.type] || w.type}</span>
                </div>
                {isMe && (
                  <button
                    className="checkin-delete-btn"
                    onClick={() => handleDeleteWorkout(w)}
                    aria-label="Delete workout"
                  >×</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
