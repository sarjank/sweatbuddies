import { useEffect, useState } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  writeBatch, doc, limit
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import MonsterAvatar from "../components/MonsterAvatar/MonsterAvatar";
import "./Notifications.css";

const TYPE_LABELS = {
  like: (n) => `@${n.actorHandle || n.actorName} liked your workout`,
  friend_request: (n) => `@${n.actorHandle || n.actorName} sent you a buddy request`,
  friend_accepted: (n) => `@${n.actorHandle || n.actorName} accepted your buddy request`,
  personal_best: (n) => `@${n.actorHandle || n.actorName} hit a Personal Best! 🏆`,
  crew_member_joined: (n) => `@${n.actorHandle || n.actorName} joined ${n.crewName} 🤝`,
  crew_goal_met: (n) => `🏅 ${n.crewName} crushed the goal: ${n.goalLabel}!`,
  crew_nudge: (n) => `⚡ ${n.crewName} is counting on you — log a workout!`,
};

const TYPE_ICONS = {
  crew_goal_met: "🏅",
  crew_nudge: "⚡",
  crew_member_joined: "🤝",
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, async (snap) => {
      const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setLoading(false);

      // Mark all unread as read
      const unread = snap.docs.filter((d) => !d.data().read);
      if (unread.length) {
        const batch = writeBatch(db);
        unread.forEach((d) => batch.update(doc(db, "notifications", d.id), { read: true }));
        await batch.commit();
      }
    });
    return unsub;
  }, [currentUser]);

  function timeAgo(ts) {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="notifs-page">
      <h1>Notifications</h1>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="muted">No notifications yet. Get out there and sweat!</p>
      ) : (
        <div className="notifs-list">
          {notifications.map((n) => (
            <div key={n.id} className={`notif-card${n.read ? "" : " notif-card--unread"}`}>
              {TYPE_ICONS[n.type] ? (
                <span className="notif-crew-icon">{TYPE_ICONS[n.type]}</span>
              ) : (
                <MonsterAvatar monsterType={n.actorMonsterType} size="sm" />
              )}
              <div className="notif-body">
                <p className="notif-text">
                  {TYPE_LABELS[n.type]?.(n) || "New notification"}
                </p>
                <span className="notif-time">{timeAgo(n.createdAt)}</span>
              </div>
              {!n.read && <span className="notif-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
