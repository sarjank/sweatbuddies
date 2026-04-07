/**
 * Seed script — creates 8 test user documents in Firestore for testing
 * crews, friends, and feed functionality.
 *
 * These are Firestore-only records (no Firebase Auth accounts).
 * They will appear in handle searches and can be added to crews.
 *
 * Run once:
 *   node scripts/seedTestUsers.mjs
 *
 * To remove all test users later:
 *   node scripts/seedTestUsers.mjs --delete
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjRLfLnSRe3DvHidKoP5eSZane5t_ep3s",
  authDomain: "sweatbuddies.firebaseapp.com",
  projectId: "sweatbuddies",
  storageBucket: "sweatbuddies.firebasestorage.app",
  messagingSenderId: "127171022735",
  appId: "1:127171022735:web:d52e0329b12522907c85fa",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TEST_USERS = [
  { uid: "test_user_001", displayName: "Alex Rivera",   handle: "alexr",     monsterType: "goblin",  workoutCount: 14 },
  { uid: "test_user_002", displayName: "Sam Chen",      handle: "samchen",   monsterType: "blob",    workoutCount: 9  },
  { uid: "test_user_003", displayName: "Jordan Ellis",  handle: "jellis",    monsterType: "robo",    workoutCount: 22 },
  { uid: "test_user_004", displayName: "Casey Morgan",  handle: "cmorgan",   monsterType: "yeti",    workoutCount: 5  },
  { uid: "test_user_005", displayName: "Taylor Kim",    handle: "tkim",      monsterType: "cactus",  workoutCount: 31 },
  { uid: "test_user_006", displayName: "Riley Stone",   handle: "rstone",    monsterType: "ghost",   workoutCount: 7  },
  { uid: "test_user_007", displayName: "Morgan Patel",  handle: "mpatel",    monsterType: "dragon",  workoutCount: 18 },
  { uid: "test_user_008", displayName: "Quinn Foster",  handle: "qfoster",   monsterType: "fungi",   workoutCount: 3  },
];

const isDelete = process.argv.includes("--delete");

async function run() {
  if (isDelete) {
    console.log("Deleting test users...");
    for (const u of TEST_USERS) {
      await deleteDoc(doc(db, "users", u.uid));
      console.log(`  ✗ Deleted ${u.handle}`);
    }
    console.log("Done.");
    process.exit(0);
  }

  console.log("Seeding test users...");
  for (const u of TEST_USERS) {
    const ref = doc(db, "users", u.uid);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      console.log(`  ~ Skipping ${u.handle} (already exists)`);
      continue;
    }
    await setDoc(ref, {
      uid: u.uid,
      displayName: u.displayName,
      handle: u.handle,
      email: `${u.handle}@test.sweatbuddies.fake`,
      monsterType: u.monsterType,
      createdAt: serverTimestamp(),
      friends: [],
      crews: [],
      workoutCount: u.workoutCount,
      badges: [],
      _isTestUser: true,
    });
    console.log(`  ✓ Created @${u.handle} (${u.displayName}) — ${u.monsterType}`);
  }
  console.log("\nAll done! Test users you can search for:");
  TEST_USERS.forEach(u => console.log(`  @${u.handle.padEnd(12)} ${u.displayName}`));
  console.log("\nTo remove them later: node scripts/seedTestUsers.mjs --delete");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
