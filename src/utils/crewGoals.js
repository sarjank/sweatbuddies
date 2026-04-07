/**
 * Pre-curated goal definitions shown in the crew create/edit UI.
 */
export const GOAL_OPTIONS = [
  { type: "workouts_per_week", target: 3, period: "week",  label: "3x workout per week" },
  { type: "workouts_per_week", target: 5, period: "week",  label: "5x workout per week" },
  { type: "cardio_per_week",   target: 3, period: "week",  label: "Cardio 3x per week" },
  { type: "weights_daily",     target: 1, period: "week",  label: "Weights every day" },
  { type: "any_daily",         target: 1, period: "month", label: "Work out every day this month" },
];

/**
 * Get ISO week key for a YYYY-MM-DD string, e.g. "2026-W14"
 */
function isoWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const thu = new Date(d);
  thu.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const yr = thu.getFullYear();
  const wk = Math.ceil(((thu - new Date(yr, 0, 1)) / 86400000 + 1) / 7);
  return `${yr}-W${wk}`;
}

/**
 * Get the Mon–Sun range for the current week as YYYY-MM-DD strings.
 */
export function currentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  };
}

/**
 * evaluateGoal(goal, workouts)
 *
 * goal     — the crew's goal object { type, target, period, label }
 * workouts — array of this user's workout docs for the relevant time window
 *            (caller should pre-filter to current week or month)
 *
 * Returns { met: boolean, progress: number, target: number }
 */
export function evaluateGoal(goal, workouts) {
  if (!goal) return { met: false, progress: 0, target: 0 };

  const { type, target } = goal;

  switch (type) {
    case "workouts_per_week": {
      // progress = total workouts in the window
      const progress = workouts.length;
      return { met: progress >= target, progress, target };
    }

    case "cardio_per_week": {
      const progress = workouts.filter(
        (w) => w.type === "cardio" || w.type === "both"
      ).length;
      return { met: progress >= target, progress, target };
    }

    case "weights_daily": {
      // Every calendar day in the week must have at least one weights/both session
      const { start, end } = currentWeekRange();
      const days = getDaysInRange(start, end);
      const activeDays = new Set(
        workouts
          .filter((w) => w.type === "weights" || w.type === "both")
          .map((w) => w.workoutDate)
      );
      const progress = days.filter((d) => activeDays.has(d)).length;
      return { met: progress >= days.length, progress, target: days.length };
    }

    case "any_daily": {
      // Every calendar day in the month must have at least one workout
      const activeDays = new Set(workouts.map((w) => w.workoutDate));
      const progress = activeDays.size;
      return { met: false, progress, target }; // target is days-in-month, caller sets it
    }

    default:
      return { met: false, progress: 0, target };
  }
}

/**
 * Check whether ALL members of a crew have met the goal for the current week.
 * workoutsByUid — { uid: workouts[] } map, already filtered to the time window
 * members       — array of uids
 * goal          — crew goal object
 */
export function crewGoalMet(goal, workoutsByUid, members) {
  if (!goal || members.length === 0) return false;
  return members.every((uid) => {
    const ws = workoutsByUid[uid] || [];
    return evaluateGoal(goal, ws).met;
  });
}

function getDaysInRange(start, end) {
  const days = [];
  let cur = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  while (cur <= endDate) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/**
 * Current period key for storing/querying crew awards.
 * week  → "2026-W14"
 * month → "2026-04"
 */
export function currentPeriodKey(period) {
  const today = new Date().toISOString().slice(0, 10);
  if (period === "week") return isoWeekKey(today);
  return today.slice(0, 7); // "YYYY-MM"
}
