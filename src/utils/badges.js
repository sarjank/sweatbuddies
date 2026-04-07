export const BADGE_DEFS = [
  { id: "first_sweat", label: "First Sweat", icon: "🔥", threshold: 1 },
  { id: "week_warrior", label: "Week Warrior", icon: "⚔️", threshold: 7 },
  { id: "month_grind", label: "Month Grind", icon: "💪", threshold: 30 },
  { id: "century", label: "Century", icon: "💯", threshold: 100 },
];

export function computeBadges(workoutCount) {
  return BADGE_DEFS.filter((b) => workoutCount >= b.threshold);
}
