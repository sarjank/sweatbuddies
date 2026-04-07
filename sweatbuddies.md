# SweatBuddies — Phased Product Plan

## Context

SweatBuddies is a social workout check-in app with a near-zero friction philosophy. The core insight: most fitness apps fail because logging a workout feels like a chore. SweatBuddies eliminates that friction — one tap to say "I worked out today." The social layer (friends, check-ins, likes) creates accountability without complexity. Users can log workouts for past days they forgot to record, mark one workout per week as a Personal Best, and are represented by a unique cute workout-monster avatar character instead of generic initials. Every user has a unique @handle (like Instagram) chosen at registration — handles are how friends find and add each other.

The project is scaffolded with React 19, React Router 7, Firebase 12 (Auth + Firestore), and Vite. Auth flows (email/password + Google OAuth) are fully wired. Page shells exist for Dashboard, LogWorkout, Feed, Friends, and Profile.

---

## Style Guide

### Philosophy
Mobile-first, dark, focused. Every screen should feel like a native app, not a website. Max content width is **480px**, centered.

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0d0d0d` | Page background |
| `--bg-card` | `#1a1a1a` | Cards, inputs |
| `--bg-card-2` | `#222222` | Elevated surfaces, dropdowns |
| `--accent` | `#b5ff2e` | Primary action, active states, dots, FAB |
| `--accent-dark` | `#1e3a0a` | Accent tinted backgrounds (e.g. "your" check-in row) |
| `--accent-dim` | `#b5ff2e22` | Subtle accent tint borders |
| `--text` | `#ffffff` | Primary text |
| `--text-muted` | `#666666` | Labels, placeholders, secondary |
| `--text-sub` | `#999999` | Tertiary text |
| `--border` | `#2a2a2a` | Card and input borders |
| `--red` | `#e94560` | Destructive, likes, errors |

### Typography
- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Headings: `font-weight: 700–800`
- Section labels: `0.72rem`, uppercase, `letter-spacing: 0.1em`, `--text-muted`
- Body: `0.88–0.95rem`

### Layout
- All pages use `padding: 1rem 1rem calc(var(--bottom-nav-h) + 1rem)` to clear the bottom nav
- `--bottom-nav-h: 72px`
- `--radius: 14px` for cards; `10px` for smaller elements
- No horizontal scroll; `overflow-x: hidden` on body

### Navigation
- **Top bar** — sticky, 52px tall, logo left + bell + hamburger right. No page links in the top bar.
- **Bottom nav** — fixed, 72px. Three items: Feed (waveform icon) | lime FAB `+` (56px circle, glowing) | You (person icon). Active tab highlighted in `--accent`.

### Components
- **MonsterAvatar** — circular SVG, sizes `sm` (36px) / `md` (52px) / `lg` (96px). Border `--border`, `lg` border tinted `--accent`.
- **Cards** — `background: var(--bg-card)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`.
- **Buttons (primary)** — `background: var(--accent)`, `color: #0d0d0d`, `font-weight: 700`. Never white-on-white.
- **Inputs** — `background: var(--bg-card)`, `border: 1px solid var(--border)`, `color: var(--text)`, `color-scheme: dark`. Focus ring uses `--accent`.
- **PB badge** — gold on dark: `background: #2a2000`, `color: #ffd700`, `border: 1px solid #ffd70044`.
- **Streak badge** — accent pill: `background: var(--accent)`, `color: #0d0d0d`.

### Weekly Strip (Dashboard)
- 7 buttons Mon–Sun, each showing 3-letter day name + date number + dot
- Dot is `--accent` when a workout exists that day (any user in the group), invisible otherwise
- Selected day: full `--accent` background, `#0d0d0d` text
- Today (unselected): `--accent` border
- The selected day's check-in list highlights the current user's row with `--accent-dark` background and `--accent` name text

---

## Phase 1: Core Check-In (MVP)

**Goal:** Users can log a workout with one tap for any date. The experience is fast, satisfying, and frictionless.

### 1.1 Simplify LogWorkout Page
**Files:** `src/pages/LogWorkout.jsx`, `src/pages/LogWorkout.css`

Replace the multi-field form with:
1. **Date picker** — defaults to today, allows selecting any date up to 30 days in the past (no future dates).
2. **Three large tappable buttons** — Cardio (running icon), Weights (dumbbell icon), Both (fire icon)
3. **Optional note** — single free-text field, max 140 chars
4. **Personal Best toggle** — "Mark as my Personal Best this week" checkbox, only shown if the user has not already marked a PB during the current ISO week. Enforced by a pre-save Firestore query.

**Multiple workouts per day:** Users can log as many workouts as they want on any given date. There is no duplicate check — a second tap simply creates another workout document. Each workout appears as a separate card in the Feed and check-in list. This supports real training patterns (e.g. a morning run + an evening lift on the same day).

On tap: instantly writes a Firestore document and navigates to the Feed with a success flash.

**Firestore `workouts` document schema:**
```
{
  id: auto,
  uid: string,
  displayName: string,
  handle: string,            // denormalized @handle for display without extra lookups
  type: "cardio" | "weights" | "both",
  note: string (optional, max 140),
  workoutDate: string,       // "YYYY-MM-DD" — the day the workout happened
  createdAt: timestamp,      // when the document was written (server time)
  isPersonalBest: boolean,   // max one true per user per ISO week
  likes: string[]            // array of UIDs who liked
}
```

**Personal Best enforcement logic (`src/utils/personalBest.js`, new):**
- On load of LogWorkout: query `workouts` where `uid == currentUser.uid`, `isPersonalBest == true`, and `workoutDate` falls within the current ISO week (Monday–Sunday)
- If a result exists: hide the PB toggle and show "PB already set this week"
- If no result: show the toggle

### 1.2 Dashboard Redesign
**Files:** `src/pages/Dashboard.jsx`, `src/pages/Dashboard.css`

- Hero area: user's monster avatar + greeting + streak counter (consecutive calendar days with a `workoutDate` entry)
- Big "Log Today's Workout" button in the center
- If user already logged today (check by `workoutDate == today`): show checkmark + workout type, disable the log button
- Recent activity: last 5 check-ins ordered by `workoutDate DESC`

### 1.3 User Handles
**Files:** `src/components/Auth/Register.jsx`, `src/context/AuthContext.jsx`, `src/utils/handle.js` (new)

Every user chooses a unique @handle at registration. Handles follow Instagram-style rules: 3–30 characters, only letters, numbers, periods, and underscores, no leading/trailing periods or underscores.

**Registration flow change (`Register.jsx`):**
- Add a "Username" field (displayed with a `@` prefix) above the email field
- On blur: call `checkHandleAvailable(handle)` — queries Firestore `users` collection with `where("handle", "==", handle)`. Show a green checkmark if available, red error if taken or invalid.
- Block form submission until handle is confirmed available

**Firestore `users` document — updated schema:**
```
{
  uid: string,
  displayName: string,
  handle: string,        // unique, lowercase, e.g. "sweatmonster42"
  email: string,
  monsterType: string,
  createdAt: timestamp,
  friends: string[],
  workoutCount: number,
  badges: string[]
}
```

**`src/utils/handle.js`** — exports:
- `validateHandle(handle)` — returns `{ valid: boolean, error?: string }`
- `checkHandleAvailable(handle, db)` — async Firestore lookup, returns boolean

**AuthContext change:** Include `handle` in `userProfile` state alongside `monsterType`.

**Handle uniqueness guarantee:** Firestore Security Rules enforce `handle` is immutable after creation (no updates allowed on the `handle` field). Handles are stored lowercase; input is normalized to lowercase on save.

**Finding a user by handle:** `src/utils/handle.js` exports `getUserByHandle(handle, db)` — exact match query on `users` collection. Used by the Friends page.

### 1.4 Monster Avatars
**Files:** `src/components/MonsterAvatar/MonsterAvatar.jsx` (new), `src/components/MonsterAvatar/MonsterAvatar.css` (new), `src/context/AuthContext.jsx`

Replace all initials circles throughout the app with a `<MonsterAvatar monsterType={...} size="sm|md|lg" />` component.

**Monster system:**
- 8 monster types: `goblin`, `blob`, `robo`, `yeti`, `cactus`, `ghost`, `dragon`, `fungi`
- Each rendered as an inline SVG with a distinct color palette and a "working out" pose (e.g., lifting a tiny barbell, running, flexing)
- Assigned randomly at registration; stored as `monsterType: string` in the user's Firestore document
- The `MonsterAvatar` component accepts `monsterType` and `size` props; falls back to a default monster if the type is unrecognised

**Where avatars appear:** Profile header, Feed workout cards, Friends list, Notifications list, Navbar user menu.

**AuthContext change:** Include `monsterType` in the `userProfile` state so it's available app-wide without extra queries.

### 1.5 Profile Page
**Files:** `src/pages/Profile.jsx`, `src/pages/Profile.css`

- Large monster avatar (lg size) at top
- Display name in bold, `@handle` in muted text below it
- Stats: total check-ins, current streak, buddy count, Personal Best count
- Workout history list: type icon + note + date + gold trophy badge if `isPersonalBest`

### 1.6 Firestore Rules & Indexes
- `workouts` collection: users can read any workout; write only own documents
- `users` collection: `handle` field is immutable after creation (Security Rules enforce this)
- Single-field index on `users.handle` for O(1) handle lookup
- Compound index: `(uid, workoutDate DESC)` for profile history and streak calculation
- Compound index: `(uid IN [...], workoutDate DESC)` for feed queries
- Compound index: `(uid, isPersonalBest, workoutDate)` for weekly PB check

---

## Phase 2: Social Layer

**Goal:** Friends can see each other's check-ins and send encouragement via likes.

### 2.1 Friends — Add by Handle & Invite by Email
**Files:** `src/pages/Friends.jsx`, `src/pages/Friends.css`, `src/utils/invites.js` (new)

Three flows:

1. **Add by @handle** (primary) — a search bar prefixed with `@`. On submit, calls `getUserByHandle(handle, db)` from `src/utils/handle.js`. If found: show the user's monster avatar, display name, and `@handle` in a result card with an "Add Buddy" button. If not found: show "No user found with that handle."

2. **Invite by email** (for users not yet on SweatBuddies) — write an `invites` Firestore document; auto-accepted when the invitee registers. The invite email can include the inviter's @handle so the recipient knows who sent it.

3. **Pending requests** — a section showing incoming friend requests (from users who added by handle) awaiting the current user's acceptance. Accept → mutual friend relationship. Decline → delete the request document.

**Firestore `invites` schema:**
```
{
  id: auto,
  inviterUid: string,
  inviterName: string,
  inviterHandle: string,
  inviteeEmail: string,       // for email invites (non-users)
  inviteeUid: string,         // for handle-based requests (existing users)
  type: "email" | "handle",
  status: "pending" | "accepted" | "declined",
  createdAt: timestamp
}
```

On login/register: query `invites` where `inviteeEmail == currentUser.email` and `status == "pending"` → auto-accept email invites, update both users' `friends` arrays.

Friends list shows each friend's monster avatar + display name + `@handle` + workout count.

### 2.2 Activity Feed
**Files:** `src/pages/Feed.jsx`, `src/pages/Feed.css`

- Lists workouts from `currentUser.uid` + all friends UIDs
- Each card shows: monster avatar, display name + `@handle` in muted text, workout type icon, note, workout date (not just "time ago" — show the actual date since entries may be backdated), like count + like button, gold trophy badge if `isPersonalBest`
- Real-time listener with Firestore `onSnapshot`

### 2.3 Likes
**Files:** `src/pages/Feed.jsx`, `src/pages/Profile.jsx`

- Like button (heart icon) on each workout card
- Toggle: `arrayUnion` / `arrayRemove` for atomic Firestore updates
- Highlight heart if current user has liked

---

## Phase 3: Notifications & Streaks

**Goal:** Deepen engagement with streaks, milestone badges, and in-app notifications.

### 3.1 Streak Engine
**File:** `src/utils/streak.js` (new)

- Calculate current streak using `workoutDate` strings (consecutive calendar days, backdated entries count)
- "Longest streak" stat on Profile
- Dashboard flame badge for streaks ≥ 3 days

### 3.2 Milestone Badges
**File:** `src/utils/badges.js` (new)

Milestones unlocked by check-in count:
- First Sweat (1), Week Warrior (7), Month Grind (30), Century (100)
- Stored in user Firestore document `badges: string[]`
- Displayed on Profile page alongside the monster avatar

### 3.3 In-App Notifications Bell
**Files:** `src/components/Layout/Navbar.jsx`, `src/pages/Notifications.jsx` (new)

**Firestore `notifications` schema:**
```
{
  uid: string,        // recipient
  type: "like" | "friend_request" | "friend_accepted" | "personal_best",
  actorName: string,
  actorHandle: string,       // @handle of the sender, shown in notification text
  actorMonsterType: string,  // for rendering the sender's avatar in the notification
  workoutId: string (optional),
  read: boolean,
  createdAt: timestamp
}
```
- Navbar bell icon with unread count badge
- Tapping opens notification list; each item shows the sender's monster avatar; marks all as read
- When a user marks a PB, trigger a "personal_best" notification to all their friends

---

## Phase 4: Monthly Awards Panel

**Goal:** Give users a fun monthly recap with named awards for themselves and their friends, creating a moment of celebration and friendly competition at the end of each month.

### 4.1 Awards Page
**Files:** `src/pages/Awards.jsx` (new), `src/pages/Awards.css` (new)

A dedicated tab in the navigation — "Awards" (trophy icon). The page shows two sections side by side (or stacked on mobile):
1. **My Awards** — the current user's earned awards for the selected month
2. **Friends' Awards** — one award card per friend showing what they earned the same month

A month selector (previous/next arrows, defaults to current month) lets users browse their own and friends' award history.

**Award categories (computed client-side from Firestore workout data):**

| Award | Criteria |
|-------|----------|
| Most Active | Most check-ins in the month |
| Cardio King/Queen | Most cardio sessions |
| Iron Pumper | Most weights sessions |
| All-Rounder | Most "both" sessions |
| On Fire | Longest streak within the month |
| Social Butterfly | Most likes received on workouts |
| Hype Machine | Most likes given to others |
| Personal Best Club | Marked at least one PB that month |
| Comeback Kid | Logged a workout after a 7+ day gap |
| Consistency Star | Logged workouts on at least 20 days |

Each award displays: award icon, award name, the winner's monster avatar + name, and the stat that earned it (e.g. "14 check-ins").

A user can earn multiple awards in the same month. If they earned none, show a friendly "No awards yet this month — keep going!" empty state.

### 4.2 Award Computation
**File:** `src/utils/awards.js` (new)

Pure function `computeAwards(workouts, uid)` — takes an array of workout documents for a given month and a target UID, returns an array of award objects the user earned:
```
{
  id: string,          // e.g. "most_active"
  label: string,       // e.g. "Most Active"
  icon: string,        // emoji or icon key
  stat: string,        // human-readable reason, e.g. "14 check-ins"
}
```

This is computed entirely from the already-fetched workout data — no additional Firestore collection needed. The page fetches all workouts for `[currentUser.uid, ...friends]` within the selected month, then calls `computeAwards` once per user (including the current user).

### 4.3 Navigation Update
**Files:** `src/components/Layout/Navbar.jsx`, `src/App.jsx`

- Add `/awards` route in `App.jsx` (protected)
- Add "Awards" link/icon to Navbar (desktop) and bottom nav bar (mobile)
- Month-end notification (Phase 3 system): on the 1st of each month, write a `"monthly_awards"` notification to each user listing their awards from the prior month — encourages them to check the Awards tab

### 4.4 Friends' Awards View
The Awards page fetches workouts for all friends (same `uid IN [...]` query pattern as the Feed) filtered to the selected month. For each friend, the friend's award cards are shown in a horizontally scrollable row with their monster avatar as the header. Tapping a friend's row expands it to show all their awards for that month.

---

## Phase 5: Polish, PWA & Performance

**Goal:** Make SweatBuddies feel like a native mobile app.

### 5.1 Progressive Web App (PWA)
- Add `vite-plugin-pwa` to `vite.config.js`
- Web app manifest: name, icons, theme color
- Service worker: cache shell + static assets for offline support
- "Add to Home Screen" prompt on first visit

### 5.2 Mobile-First UI Overhaul
- Bottom navigation bar on mobile (replaces top Navbar for small screens)
  - Icons only: Home, Log, Feed, Friends, Profile
- Large tap targets (minimum 48×48px)
- Micro-animations on workout log (CSS scale + bounce on the type button tapped)
- Monster avatar "victory pose" animation on successful workout log
- Skeleton loading screens

### 5.3 Performance
- Firestore query pagination (cursor-based, 15 feed items at a time)
- `React.memo` on Feed workout cards to prevent re-renders on like toggle
- Extract `WorkoutCard` → `src/components/Workouts/WorkoutCard.jsx`
- Extract `FriendCard` → `src/components/Friends/FriendCard.jsx`

---

---

## Phase 6: Crews

**Goal:** Give groups of friends a named, private space to set shared goals, hold each other accountable, and compete for crew-specific awards — without disrupting the existing friend-based social layer.

---

### 6.1 Data Model

**Firestore `crews` collection:**
```
{
  id: auto,
  name: string,                  // e.g. "Morning Monsters"
  createdBy: string,             // uid of the creator
  members: string[],             // array of uids (includes creator)
  goal: {
    type: "workouts_per_week" | "weights_daily" | "cardio_per_week" | "any_daily" | null,
    label: string,               // human-readable, e.g. "3x workout per week"
    target: number,              // e.g. 3 for "3x per week"
    period: "week" | "month",
  } | null,
  createdAt: timestamp,
}
```

Each crew member's `uid` also stores a `crews: string[]` array in their `users` document for fast lookup.

**Goal types (pre-curated list):**
| Value | Label | Description |
|-------|-------|-------------|
| `workouts_per_week` | `3x workout per week` | Log ≥ 3 workouts in a calendar week |
| `workouts_per_week` | `5x workout per week` | Log ≥ 5 workouts in a calendar week |
| `weights_daily` | `Weights every day` | Log a weights (or both) session every calendar day |
| `cardio_per_week` | `Cardio 3x per week` | Log ≥ 3 cardio (or both) sessions per week |
| `any_daily` | `Work out every day` | Log any workout every calendar day for the month |

---

### 6.2 Crews Page
**Files:** `src/pages/Crews.jsx` (new), `src/pages/Crews.css` (new)

Accessible from the Navbar dropdown and a bottom nav icon (replaces or sits alongside Friends).

**Two tabs:**

#### My Crews
- Lists all crews the current user belongs to
- Each crew card shows: crew name, member count, monster avatar stack (up to 4 members), active goal label
- Tapping a crew card → opens the **Crew Detail** view (inline, not a new route)

#### Create Crew
- Input: crew name (required, max 40 chars)
- Goal selector: dropdown of pre-curated goals (or "No goal")
- Submit → writes to `crews` collection, adds crew `id` to creator's `users.crews[]`

---

### 6.3 Crew Detail View
**File:** `src/pages/CrewDetail.jsx` (new), `src/pages/CrewDetail.css` (new)

Route: `/crews/:crewId`

Sections:
1. **Header** — crew name, goal pill, member count
2. **Members list** — monster avatar + name + @handle + whether they met the goal this week/month (green checkmark or red X)
3. **Add Member** — search by @handle (same `getUserByHandle` util); any member can add any friend already on SweatBuddies. Only users who are already friends with the adder can be added (prevents spam).
4. **Leave / Delete Crew** — member can leave (removes uid from `members[]`, removes crewId from `users.crews[]`); creator gets a "Delete Crew" button which removes the entire document and cleans up all members' `crews[]` arrays via a batch write.
5. **Goal progress strip** — for the current week/month, show each member's progress toward the crew goal (e.g. "2 / 3 workouts" with a progress bar).

---

### 6.4 Goal Evaluation Logic
**File:** `src/utils/crewGoals.js` (new)

Pure function:
```js
evaluateGoal(goal, workouts, weekOrMonthDates)
  → { met: boolean, progress: number, target: number, label: string }
```

- `workouts` — the user's workout docs filtered to the relevant time window
- Called per-member in CrewDetail to compute the progress strip
- Called at the end of each week/month to determine if the crew award is triggered

**When is the award triggered?**
- For `period: "week"` goals: evaluated every Sunday at end of day (or on next app open after Sunday)
- For `period: "month"` goals: evaluated on the 1st of the following month
- Trigger condition: **every** member in the crew has `met: true`
- If triggered: write a `crew_award` notification to all members and add a `crewAward` entry to each member's awards for that period

---

### 6.5 Crew Awards
**Files:** `src/pages/Awards.jsx`, `src/utils/awards.js`

Crew awards appear in the Awards tab as a separate section below the personal awards list, titled **"Crew Awards"**.

Each crew award card shows:
- Crew name as the title (e.g. "Morning Monsters")
- Goal that was completed (e.g. "3x workout per week")
- Week or month it was achieved
- All member monster avatars in a row
- A distinct gold banner style to differentiate from personal awards

**Firestore `crew_awards` collection** (written when a crew completes a goal):
```
{
  id: auto,
  crewId: string,
  crewName: string,
  goal: { type, label, target, period },
  memberUids: string[],
  periodKey: string,   // e.g. "2026-W14" for week 14 or "2026-04" for April
  createdAt: timestamp,
}
```

The Awards page queries `crew_awards` where `memberUids array-contains currentUser.uid` for the selected month — no recomputation needed, the award is already stored.

---

### 6.6 Crew Accountability Notifications
**File:** `src/pages/Notifications.jsx`, notification type added to schema

New notification types:
- `crew_nudge` — sent mid-week (e.g. Wednesday) to any crew member who hasn't logged a workout yet that week, from the system (or on behalf of the crew). Message: "⚡ Your crew 'Morning Monsters' is counting on you — log a workout!"
- `crew_goal_met` — sent to all members when the full crew meets its weekly/monthly goal. Message: "🏆 Morning Monsters crushed it! Everyone hit their goal this week."
- `crew_member_joined` — sent to all existing members when a new member is added. Message: "@newHandle joined Morning Monsters!"

Nudge logic: on app open (or a scheduled Firestore Function), check if it's Wednesday or later and the user has 0 workouts logged so far this week. If they belong to a crew with a goal, write a `crew_nudge` notification (rate-limited: max once per week per crew).

---

### 6.7 Trends Tab — Crew Filter
**Files:** `src/pages/Dashboard.jsx`, `src/pages/Dashboard.css`

The Trends tab (formerly Dashboard) adds a **filter bar** at the top:
- "Everyone" pill (default) — shows workouts from currentUser + all friends (existing behaviour)
- One pill per crew the user belongs to — selecting a crew pill filters the weekly strip and check-in list to only show members of that crew

Implementation:
- On crew pill selection, re-run the existing `fetchData()` with `uids` filtered to the selected crew's `members[]`
- Pills are horizontally scrollable if more than 3 crews
- Active pill styled in `--accent`

---

### 6.8 Firestore Rules & Indexes for Crews
- `crews` collection: read allowed for members only (`request.auth.uid in resource.data.members`); create allowed by any authenticated user; update allowed by any member (for adding new members); delete allowed only by `createdBy`
- `crew_awards` collection: read allowed if `request.auth.uid in resource.data.memberUids`
- Compound index: `(memberUids array-contains, createdAt DESC)` on `crew_awards` for awards page query
- Compound index: `(members array-contains, createdAt DESC)` on `crews` for user's crew list

---

## Phase 7: Delete & Correction Actions

**Goal:** Let users undo mistakes — delete their own workouts, crew creators remove members, and friends remove each other.

---

### 7.1 Delete a Workout
**Files:** `src/components/Workouts/WorkoutCard.jsx`, `src/pages/Feed.jsx`, `src/pages/Profile.jsx`

- A small `×` delete button appears in the top-right of every `WorkoutCard` **only when `workout.uid === currentUser.uid`** (i.e. it's the logged-in user's own workout).
- Tapping it calls `onDelete(workout)`, which triggers a `window.confirm` dialog before permanently deleting.
- On confirm: `deleteDoc` the workout document, then `updateDoc` the user's `users` doc with `increment(-1)` on `workoutCount`.
- The deletion is reflected immediately (optimistic update via Firestore `onSnapshot` in Feed; local state removal in Profile).
- `onDelete` is an optional prop — if not passed the button does not render (e.g. on a future public profile view).

### 7.2 Crew Creator: Remove Member
**File:** `src/pages/CrewDetail.jsx`

- In the Members list, each member row shows a **"Remove"** button visible only to the crew creator, and only on members who are **not** the creator themselves.
- Tapping triggers `window.confirm`, then a batch write: `arrayRemove` the member's uid from `crews/{crewId}.members` and `arrayRemove` the crewId from `users/{memberUid}.crews`.
- The page reloads the crew data after removal.

### 7.3 Remove a Friend (Buddy)
**File:** `src/pages/Friends.jsx`

- In the "Your Buddies" tab, each friend card shows a **"Remove"** button.
- Tapping triggers `window.confirm`, then a batch write: `arrayRemove` each uid from the other's `friends[]` array (mutual unfriend).
- `fetchUserProfile` is called after to keep the local `userProfile` in sync.

---

## File Map — Critical Paths

| Phase | Files to Modify | Files to Create |
|-------|----------------|-----------------|
| 1 | `src/pages/LogWorkout.jsx`, `LogWorkout.css`, `src/pages/Dashboard.jsx`, `Dashboard.css`, `src/pages/Profile.jsx`, `Profile.css`, `src/context/AuthContext.jsx`, `src/components/Auth/Register.jsx` | `src/components/MonsterAvatar/MonsterAvatar.jsx`, `src/components/MonsterAvatar/MonsterAvatar.css`, `src/utils/personalBest.js`, `src/utils/handle.js` |
| 2 | `src/pages/Feed.jsx`, `Feed.css`, `src/pages/Friends.jsx`, `Friends.css`, `src/App.jsx` | `src/utils/invites.js` |
| 3 | `src/components/Layout/Navbar.jsx`, `Navbar.css`, `src/context/AuthContext.jsx` | `src/pages/Notifications.jsx`, `src/utils/streak.js`, `src/utils/badges.js` |
| 4 | `src/App.jsx`, `src/components/Layout/Navbar.jsx`, `Navbar.css` | `src/pages/Awards.jsx`, `src/pages/Awards.css`, `src/utils/awards.js` |
| 5 | `vite.config.js`, `src/components/Layout/Navbar.jsx` | `src/components/Workouts/WorkoutCard.jsx`, `src/components/Friends/FriendCard.jsx`, `public/manifest.json` |
| 6 | `src/pages/Dashboard.jsx`, `Dashboard.css`, `src/pages/Awards.jsx`, `src/pages/Notifications.jsx`, `src/App.jsx`, `src/components/Layout/Navbar.jsx`, `src/context/AuthContext.jsx` | `src/pages/Crews.jsx`, `src/pages/Crews.css`, `src/pages/CrewDetail.jsx`, `src/pages/CrewDetail.css`, `src/utils/crewGoals.js` |

---

## Test Users

Eight seeded Firestore-only users for testing crews, friends, and feed without needing to create real Auth accounts. Created via `node scripts/seedTestUsers.mjs`. Remove with `node scripts/seedTestUsers.mjs --delete`.

| Handle | Name | Monster | Workout Count |
|--------|------|---------|---------------|
| `@alexr` | Alex Rivera | goblin | 14 |
| `@samchen` | Sam Chen | blob | 9 |
| `@jellis` | Jordan Ellis | robo | 22 |
| `@cmorgan` | Casey Morgan | yeti | 5 |
| `@tkim` | Taylor Kim | cactus | 31 |
| `@rstone` | Riley Stone | ghost | 7 |
| `@mpatel` | Morgan Patel | dragon | 18 |
| `@qfoster` | Quinn Foster | fungi | 3 |

Search for any handle in **Buddies → Find by @handle** to add as a friend, then add to a crew via **Crews → Crew Detail → Add Member**.

---

## Verification Plan

- **Phase 1:**
  - Log a workout for today → confirm Firestore doc with correct `workoutDate`
  - Log a workout for 3 days ago → confirm `workoutDate` reflects past date, not today
  - Log a second workout on the same date → confirm both appear as separate cards in Feed and check-in list
  - Mark a workout as Personal Best → confirm `isPersonalBest: true`; try to mark another PB same week → confirm toggle hidden
  - Register a new user → enter a handle → confirm real-time availability check works → confirm `handle` and `monsterType` stored in Firestore
  - Try to register a second account with the same handle → confirm blocked
  - Confirm `@handle` displays on Profile below display name and on Feed cards
  - Confirm monster renders on Profile and Dashboard
- **Phase 2:**
  - Register two accounts → search for User B by @handle from User A → send friend request → confirm pending request appears for User B → accept → confirm mutual friend relationship
  - Search for a non-existent handle → confirm "No user found" message
  - Invite a non-user by email → register as that user → confirm auto-friend on login
  - Log a backdated workout as User A → confirm it appears in User B's Feed with the correct past date shown
  - Like a PB workout → confirm gold trophy badge visible on the card
- **Phase 3:**
  - Log 3 consecutive days → confirm streak badge appears; log a backdated entry to fill a gap → confirm streak recalculates
  - Mark a PB → confirm friends receive a "personal_best" notification with the sender's monster avatar
- **Phase 4:**
  - Navigate to Awards tab → confirm it loads for current month
  - Confirm own awards are computed correctly (e.g. log 5 cardio sessions → "Cardio King/Queen" appears)
  - Confirm a friend's awards are visible in their row
  - Step back to prior month → confirm awards recalculate for that month's data
  - Verify "No awards yet" empty state when no workouts exist for a month
  - On 1st of month: confirm a `monthly_awards` notification is written to Firestore with correct award list
- **Phase 5:**
  - Lighthouse PWA audit ≥ 90 score → install to home screen → go offline → confirm app shell loads
  - Log a workout and verify the monster victory animation plays
- **Phase 6:**
  - Create a crew → confirm `crews` doc created with creator in `members[]` and `users.crews[]` updated
  - Add a friend to the crew by @handle → confirm they appear in the members list → confirm `crew_member_joined` notification sent to existing members
  - Set a goal of "3x workout per week" → log 3 workouts in one week as all members → confirm `crew_goal_met` notification sent and crew award appears in Awards tab
  - One member fails to meet the goal → confirm no crew award written for that week
  - Creator deletes the crew → confirm `crews` doc deleted and all members' `users.crews[]` cleaned up
  - Non-creator leaves crew → confirm removed from `members[]` only
  - Select a crew pill on Trends tab → confirm weekly strip and check-in list filtered to crew members only
  - Wednesday with no workouts logged → confirm `crew_nudge` notification appears → confirm nudge not re-sent until next week
