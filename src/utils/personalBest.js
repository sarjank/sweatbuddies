import { collection, query, where, getDocs } from "firebase/firestore";

export function getISOWeekRange(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export async function hasPBThisWeek(uid, db) {
  const { start, end } = getISOWeekRange();
  const q = query(
    collection(db, "workouts"),
    where("uid", "==", uid),
    where("isPersonalBest", "==", true),
    where("workoutDate", ">=", start),
    where("workoutDate", "<=", end)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
