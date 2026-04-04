import { useState, useEffect } from "react";
import {
  collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import "./Friends.css";

export default function Friends() {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFriends();
  }, [userProfile]);

  async function loadFriends() {
    if (!userProfile?.friends?.length) return setFriends([]);
    const friendDocs = await Promise.all(
      userProfile.friends.map((uid) => getDoc(doc(db, "users", uid)))
    );
    setFriends(friendDocs.filter((d) => d.exists()).map((d) => d.data()));
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setResults([]);
    const q = query(
      collection(db, "users"),
      where("displayName", ">=", search),
      where("displayName", "<=", search + "\uf8ff")
    );
    const snap = await getDocs(q);
    setResults(
      snap.docs
        .map((d) => d.data())
        .filter((u) => u.uid !== currentUser.uid)
    );
    setLoading(false);
  }

  async function addFriend(uid) {
    await updateDoc(doc(db, "users", currentUser.uid), {
      friends: arrayUnion(uid),
    });
    await fetchUserProfile(currentUser.uid);
    setMessage("Friend added!");
    setTimeout(() => setMessage(""), 3000);
  }

  const friendUids = userProfile?.friends || [];

  return (
    <div className="friends-page">
      <h1>Sweat Buddies</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search users by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" disabled={loading}>Search</button>
      </form>

      {message && <div className="success-msg">{message}</div>}

      {results.length > 0 && (
        <div className="search-results">
          <h3>Results</h3>
          {results.map((u) => (
            <div key={u.uid} className="user-row">
              <div className="user-avatar">{u.displayName[0].toUpperCase()}</div>
              <span>{u.displayName}</span>
              {friendUids.includes(u.uid) ? (
                <span className="badge-friend">Already friends</span>
              ) : (
                <button onClick={() => addFriend(u.uid)} className="btn-add">Add</button>
              )}
            </div>
          ))}
        </div>
      )}

      <h2>Your Buddies ({friends.length})</h2>
      {friends.length === 0 ? (
        <p className="muted">No buddies yet — search for friends above!</p>
      ) : (
        <div className="friends-list">
          {friends.map((f) => (
            <div key={f.uid} className="user-row">
              <div className="user-avatar">{f.displayName[0].toUpperCase()}</div>
              <div>
                <strong>{f.displayName}</strong>
                <p className="muted small">{f.workoutCount || 0} workouts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
