import {
  collection, query, where, getDocs, addDoc, updateDoc,
  doc, arrayUnion, serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

export async function sendEmailInvite({ inviterUid, inviterName, inviterHandle, inviteeEmail }) {
  await addDoc(collection(db, "invites"), {
    inviterUid,
    inviterName,
    inviterHandle,
    inviteeEmail: inviteeEmail.toLowerCase().trim(),
    type: "email",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function sendHandleRequest({ inviterUid, inviterName, inviterHandle, inviteeUid }) {
  // Check if request already exists
  const existing = query(
    collection(db, "invites"),
    where("inviterUid", "==", inviterUid),
    where("inviteeUid", "==", inviteeUid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(existing);
  if (!snap.empty) return;

  await addDoc(collection(db, "invites"), {
    inviterUid,
    inviterName,
    inviterHandle,
    inviteeUid,
    type: "handle",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function acceptInvite(inviteId, inviterUid, inviteeUid) {
  const batch = writeBatch(db);
  batch.update(doc(db, "invites", inviteId), { status: "accepted" });
  batch.update(doc(db, "users", inviteeUid), { friends: arrayUnion(inviterUid) });
  batch.update(doc(db, "users", inviterUid), { friends: arrayUnion(inviteeUid) });
  await batch.commit();
}

export async function declineInvite(inviteId) {
  await updateDoc(doc(db, "invites", inviteId), { status: "declined" });
}

// Called on login/register to auto-accept any pending email invites
export async function autoAcceptEmailInvites(email, uid) {
  const q = query(
    collection(db, "invites"),
    where("inviteeEmail", "==", email.toLowerCase()),
    where("type", "==", "email"),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    const invite = d.data();
    batch.update(doc(db, "invites", d.id), { status: "accepted", inviteeUid: uid });
    batch.update(doc(db, "users", uid), { friends: arrayUnion(invite.inviterUid) });
    batch.update(doc(db, "users", invite.inviterUid), { friends: arrayUnion(uid) });
  });
  await batch.commit();
}

export async function getPendingRequestsForUser(uid) {
  const q = query(
    collection(db, "invites"),
    where("inviteeUid", "==", uid),
    where("type", "==", "handle"),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
