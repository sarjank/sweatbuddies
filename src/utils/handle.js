import { collection, query, where, getDocs } from "firebase/firestore";

export function validateHandle(handle) {
  if (!handle) return { valid: false, error: "Handle is required." };
  if (handle.length < 3) return { valid: false, error: "Handle must be at least 3 characters." };
  if (handle.length > 30) return { valid: false, error: "Handle must be 30 characters or fewer." };
  if (!/^[a-z0-9._]+$/.test(handle)) return { valid: false, error: "Only lowercase letters, numbers, periods, and underscores." };
  if (/^[._]|[._]$/.test(handle)) return { valid: false, error: "Cannot start or end with a period or underscore." };
  if (/[_.]{2}/.test(handle)) return { valid: false, error: "No consecutive periods or underscores." };
  return { valid: true };
}

export async function checkHandleAvailable(handle, db) {
  const q = query(collection(db, "users"), where("handle", "==", handle));
  const snap = await getDocs(q);
  return snap.empty;
}

export async function getUserByHandle(handle, db) {
  const q = query(collection(db, "users"), where("handle", "==", handle.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
}

export function generateHandleFromName(displayName) {
  const base = (displayName || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "user";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return base + suffix;
}
