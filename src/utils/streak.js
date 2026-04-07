// workoutDates: array of "YYYY-MM-DD" strings (may contain duplicates)
export function calcStreak(workoutDates) {
  if (!workoutDates || workoutDates.length === 0) return 0;
  const unique = [...new Set(workoutDates)].sort().reverse();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Streak only counts if user logged today or yesterday
  const mostRecent = new Date(unique[0] + "T00:00:00");
  const diffFromToday = Math.round((today - mostRecent) / 86400000);
  if (diffFromToday > 1) return 0;

  let streak = 0;
  let cursor = mostRecent;

  for (const dateStr of unique) {
    const d = new Date(dateStr + "T00:00:00");
    const diff = Math.round((cursor - d) / 86400000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

export function calcLongestStreak(workoutDates) {
  if (!workoutDates || workoutDates.length === 0) return 0;
  const unique = [...new Set(workoutDates)].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + "T00:00:00");
    const curr = new Date(unique[i] + "T00:00:00");
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else if (diff > 1) {
      current = 1;
    }
  }
  return longest;
}

export function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export function formatWorkoutDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const today = todayDateStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
