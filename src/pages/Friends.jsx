import { useState, useEffect } from "react";
import { doc, getDoc, writeBatch, arrayRemove } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import MonsterAvatar from "../components/MonsterAvatar/MonsterAvatar";
import FriendCard from "../components/Friends/FriendCard";
import { getUserByHandle } from "../utils/handle";
import {
  sendEmailInvite, sendHandleRequest, acceptInvite,
  declineInvite, getPendingRequestsForUser
} from "../utils/invites";
import "./Friends.css";

export default function Friends() {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [tab, setTab] = useState("add"); // "add" | "pending" | "list"
  const [handleSearch, setHandleSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null); // null | false | userDoc
  const [searching, setSearching] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  useEffect(() => {
    loadFriends();
    loadPending();
  }, [userProfile]);

  async function loadFriends() {
    if (!userProfile?.friends?.length) return setFriends([]);
    const docs = await Promise.all(
      userProfile.friends.map((uid) => getDoc(doc(db, "users", uid)))
    );
    setFriends(docs.filter((d) => d.exists()).map((d) => d.data()));
  }

  async function loadPending() {
    const reqs = await getPendingRequestsForUser(currentUser.uid);
    setPendingRequests(reqs);
  }

  async function handleHandleSearch(e) {
    e.preventDefault();
    const val = handleSearch.trim().replace(/^@/, "").toLowerCase();
    if (!val) return;
    setSearching(true);
    setSearchResult(null);
    const user = await getUserByHandle(val, db);
    setSearchResult(user === null ? false : user);
    setSearching(false);
  }

  async function sendRequest(targetUser) {
    if (targetUser.uid === currentUser.uid) return;
    setLoadingAction("send-" + targetUser.uid);
    await sendHandleRequest({
      inviterUid: currentUser.uid,
      inviterName: userProfile?.displayName || "",
      inviterHandle: userProfile?.handle || "",
      inviteeUid: targetUser.uid,
    });
    flash("Buddy request sent!");
    setSearchResult(null);
    setHandleSearch("");
    setLoadingAction("");
  }

  async function handleEmailInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setLoadingAction("email");
    await sendEmailInvite({
      inviterUid: currentUser.uid,
      inviterName: userProfile?.displayName || "",
      inviterHandle: userProfile?.handle || "",
      inviteeEmail: inviteEmail.trim(),
    });
    setInviteEmail("");
    flash("Invite sent!");
    setLoadingAction("");
  }

  async function handleAccept(req) {
    setLoadingAction("accept-" + req.id);
    await acceptInvite(req.id, req.inviterUid, currentUser.uid);
    await fetchUserProfile(currentUser.uid);
    loadPending();
    flash("You're now buddies!");
    setLoadingAction("");
  }

  async function handleRemoveFriend(friendUid) {
    const friend = friends.find((f) => f.uid === friendUid);
    const name = friend?.displayName || "this buddy";
    if (!window.confirm(`Remove ${name} as a buddy?`)) return;
    setLoadingAction("remove-" + friendUid);
    const batch = writeBatch(db);
    batch.update(doc(db, "users", currentUser.uid), { friends: arrayRemove(friendUid) });
    batch.update(doc(db, "users", friendUid), { friends: arrayRemove(currentUser.uid) });
    await batch.commit();
    await fetchUserProfile(currentUser.uid);
    loadFriends();
    flash(`${name} removed.`);
    setLoadingAction("");
  }

  async function handleDecline(req) {
    setLoadingAction("decline-" + req.id);
    await declineInvite(req.id);
    loadPending();
    setLoadingAction("");
  }

  function flash(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  const friendUids = userProfile?.friends || [];
  const isAlreadyFriend = (uid) => friendUids.includes(uid);

  return (
    <div className="friends-page">
      <h1>Sweat Buddies</h1>

      {message && <div className="friends-flash">{message}</div>}

      <div className="friends-tabs">
        <button className={tab === "add" ? "tab-btn tab-btn--active" : "tab-btn"} onClick={() => setTab("add")}>Add Buddy</button>
        <button className={tab === "pending" ? "tab-btn tab-btn--active" : "tab-btn"} onClick={() => { setTab("pending"); loadPending(); }}>
          Requests {pendingRequests.length > 0 && <span className="tab-badge">{pendingRequests.length}</span>}
        </button>
        <button className={tab === "list" ? "tab-btn tab-btn--active" : "tab-btn"} onClick={() => setTab("list")}>Your Buddies ({friends.length})</button>
      </div>

      {tab === "add" && (
        <div className="friends-add">
          <div className="friends-section">
            <h3>Find by @handle</h3>
            <form onSubmit={handleHandleSearch} className="handle-search-form">
              <div className="handle-search-wrap">
                <span className="handle-at">@</span>
                <input
                  type="text"
                  placeholder="theirhandle"
                  value={handleSearch}
                  onChange={(e) => { setHandleSearch(e.target.value.replace(/^@/, "")); setSearchResult(null); }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button type="submit" disabled={searching} className="btn-search">
                {searching ? "…" : "Search"}
              </button>
            </form>

            {searchResult === false && (
              <p className="friends-not-found">No user found with that handle.</p>
            )}
            {searchResult && searchResult.uid !== currentUser.uid && (
              <div className="search-result-card">
                <MonsterAvatar monsterType={searchResult.monsterType} size="md" />
                <div className="src-info">
                  <strong>{searchResult.displayName}</strong>
                  <span className="src-handle">@{searchResult.handle}</span>
                </div>
                {isAlreadyFriend(searchResult.uid) ? (
                  <span className="badge-friend">Already buddies</span>
                ) : (
                  <button
                    className="btn-add-buddy"
                    onClick={() => sendRequest(searchResult)}
                    disabled={loadingAction === "send-" + searchResult.uid}
                  >
                    Add Buddy
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="friends-section">
            <h3>Invite by email</h3>
            <p className="friends-section-sub">Not on SweatBuddies yet? Send an invite — they'll be auto-added when they sign up.</p>
            <form onSubmit={handleEmailInvite} className="email-invite-form">
              <input
                type="email"
                placeholder="friend@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button type="submit" disabled={loadingAction === "email"} className="btn-invite">
                {loadingAction === "email" ? "Sending…" : "Send Invite"}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === "pending" && (
        <div className="friends-pending">
          {pendingRequests.length === 0 ? (
            <p className="muted">No pending requests.</p>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} className="pending-card">
                <div className="pending-info">
                  <strong>{req.inviterName}</strong>
                  <span className="src-handle">@{req.inviterHandle}</span>
                  <span className="pending-sub">wants to be your buddy</span>
                </div>
                <div className="pending-actions">
                  <button
                    className="btn-accept"
                    onClick={() => handleAccept(req)}
                    disabled={loadingAction === "accept-" + req.id}
                  >Accept</button>
                  <button
                    className="btn-decline"
                    onClick={() => handleDecline(req)}
                    disabled={loadingAction === "decline-" + req.id}
                  >Decline</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "list" && (
        <div className="friends-list">
          {friends.length === 0 ? (
            <p className="muted">No buddies yet — find some in Add Buddy!</p>
          ) : (
            friends.map((f) => (
              <div key={f.uid} className="friend-list-row">
                <FriendCard friend={f} />
                <button
                  className="btn-remove-buddy"
                  onClick={() => handleRemoveFriend(f.uid)}
                  disabled={loadingAction === "remove-" + f.uid}
                >
                  {loadingAction === "remove-" + f.uid ? "…" : "Remove"}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
