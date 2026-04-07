/**
 * Award definitions and computation logic.
 *
 * Each award has:
 *   id, label, description, color (icon bg), icon (emoji)
 *
 * computeAwardsForAll(allWorkouts, currentUid, friendProfiles)
 *   → returns AWARD_DEFS with an added `earners` array (user profile objects)
 *     and `won` boolean (true if currentUid earned it).
 */

export const AWARD_DEFS = [
  {
    id: "first_checkin",
    label: "First Check-in",
    description: "Log your first workout of the month.",
    color: "#b5ff2e",
    icon: "⚡",
  },
  {
    id: "five_logged",
    label: "5x Logged",
    description: "Log 5 workouts in a single month.",
    color: "#4fc3f7",
    icon: "5️⃣",
  },
  {
    id: "ten_logged",
    label: "10x Logged",
    description: "Log 10 workouts in a single month.",
    color: "#f59e0b",
    icon: "🔟",
  },
  {
    id: "twenty_club",
    label: "20 Club",
    description: "Log 20 workouts in a single month.",
    color: "#34d399",
    icon: "💎",
  },
  {
    id: "consistency_master",
    label: "Consistency Master",
    description: "Work out at least twice a week for 2 weeks straight.",
    color: "#c084fc",
    icon: "⭐",
  },
  {
    id: "seven_day_streak",
    label: "7-Day Streak",
    description: "Check in 7 days in a row.",
    color: "#f97316",
    icon: "🔥",
  },
  {
    id: "top_dog",
    label: "Top Dog",
    description: "Most check-ins among your friend group this month.",
    color: "#fbbf24",
    icon: "👑",
  },
  {
    id: "pb_club",
    label: "PB Club",
    description: "Set a personal best at any point this month.",
    color: "#e11d48",
    icon: "🏆",
  },
  {
    id: "cardio_crown",
    label: "Cardio Crown",
    description: "Most cardio sessions among your friends this month.",
    color: "#3dd6f5",
    icon: "🏃",
  },
  {
    id: "iron_throne",
    label: "Iron Throne",
    description: "Most weight sessions among your friends this month.",
    color: "#94a3b8",
    icon: "🏋️",
  },
  {
    id: "variety_pack",
    label: "Variety Pack",
    description: "Log all 3 workout types (Cardio, Weights, Both) this month.",
    color: "#a78bfa",
    icon: "🎯",
  },
  {
    id: "comeback_kid",
    label: "Comeback Kid",
    description: "Return to logging after 5 or more days off.",
    color: "#fb7185",
    icon: "💪",
  },
  {
    id: "fan_favourite",
    label: "Fan Favourite",
    description: "Receive the most likes on your workouts this month.",
    color: "#f472b6",
    icon: "❤️",
  },
];

// ── per-user award checker ────────────────────────────────────────────────────

function checkAward(id, own, allWorkouts) {
  const total = own.length;

  function uniqueDays(ws) {
    return [...new Set(ws.map((w) => w.workoutDate))].sort();
  }

  function countType(ws, pred) {
    return ws.filter(pred).length;
  }

  function byUser(ws) {
    return ws.reduce((acc, w) => {
      if (!acc[w.uid]) acc[w.uid] = [];
      acc[w.uid].push(w);
      return acc;
    }, {});
  }

  function isMostBy(fn) {
    const allUsers = byUser(allWorkouts);
    if (Object.keys(allUsers).length === 0) return false;
    const ownVal = fn(own);
    if (ownVal === 0) return false;
    return Object.values(allUsers).every((ws) => fn(ws) <= ownVal);
  }

  switch (id) {
    case "first_checkin":
      return total >= 1;

    case "five_logged":
      return total >= 5;

    case "ten_logged":
      return total >= 10;

    case "twenty_club":
      return total >= 20;

    case "consistency_master": {
      // Need 2+ workouts in at least 2 different ISO weeks
      const weekMap = {};
      for (const w of own) {
        const wk = getISOWeekKey(w.workoutDate);
        weekMap[wk] = (weekMap[wk] || 0) + 1;
      }
      const qualifyingWeeks = Object.values(weekMap).filter((c) => c >= 2).length;
      return qualifyingWeeks >= 2;
    }

    case "seven_day_streak": {
      const days = uniqueDays(own);
      let streak = 0;
      let prev = null;
      for (const d of days) {
        if (prev) {
          const diff = (new Date(d) - new Date(prev)) / 86400000;
          streak = diff === 1 ? streak + 1 : 1;
        } else {
          streak = 1;
        }
        if (streak >= 7) return true;
        prev = d;
      }
      return false;
    }

    case "top_dog":
      return isMostBy((ws) => ws.length);

    case "pb_club":
      return own.some((w) => w.isPersonalBest);

    case "cardio_crown":
      return isMostBy((ws) =>
        countType(ws, (w) => w.type === "cardio" || w.type === "both")
      );

    case "iron_throne":
      return isMostBy((ws) =>
        countType(ws, (w) => w.type === "weights" || w.type === "both")
      );

    case "variety_pack":
      return (
        own.some((w) => w.type === "cardio") &&
        own.some((w) => w.type === "weights") &&
        own.some((w) => w.type === "both")
      );

    case "comeback_kid": {
      const days = uniqueDays(own);
      for (let i = 1; i < days.length; i++) {
        const diff = (new Date(days[i]) - new Date(days[i - 1])) / 86400000;
        if (diff >= 5) return true;
      }
      return false;
    }

    case "fan_favourite":
      return isMostBy((ws) =>
        ws.reduce((s, w) => s + (w.likes?.length || 0), 0)
      );

    default:
      return false;
  }
}

function getISOWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const year = thursday.getFullYear();
  const week = Math.ceil(
    ((thursday - new Date(year, 0, 1)) / 86400000 + 1) / 7
  );
  return `${year}-W${week}`;
}

/**
 * Main export.
 * allWorkouts — all workout docs for the month (uid + friends).
 * currentUid  — the logged-in user's uid.
 * allProfiles — map of uid → { uid, displayName, handle, monsterType }
 *
 * Returns AWARD_DEFS enriched with:
 *   won      — boolean, did currentUid earn this?
 *   earners  — profile objects of everyone who earned it (currentUid first if won)
 */
export function computeAwardsForAll(allWorkouts, currentUid, allProfiles) {
  const byUser = allWorkouts.reduce((acc, w) => {
    if (!acc[w.uid]) acc[w.uid] = [];
    acc[w.uid].push(w);
    return acc;
  }, {});

  const allUids = Object.keys(byUser);

  return AWARD_DEFS.map((def) => {
    const earnerUids = allUids.filter((uid) =>
      checkAward(def.id, byUser[uid] || [], allWorkouts)
    );

    const won = earnerUids.includes(currentUid);

    // Build earner profiles — current user first
    const earners = [
      ...earnerUids.filter((u) => u === currentUid),
      ...earnerUids.filter((u) => u !== currentUid),
    ]
      .map((uid) => allProfiles[uid])
      .filter(Boolean);

    return { ...def, won, earners };
  });
}

/** Month string helpers */
export function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

export function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function prevMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function nextMonth(year, month) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export function monthPrefix(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
