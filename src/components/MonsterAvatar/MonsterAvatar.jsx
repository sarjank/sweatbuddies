import "./MonsterAvatar.css";

const SIZES = { sm: 36, md: 52, lg: 96 };

function GoblinSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="40" cy="52" rx="18" ry="16" fill="#4CAF50"/>
      {/* Head */}
      <circle cx="40" cy="30" r="16" fill="#66BB6A"/>
      {/* Ears (pointy) */}
      <polygon points="26,20 22,8 32,18" fill="#4CAF50"/>
      <polygon points="54,20 58,8 48,18" fill="#4CAF50"/>
      {/* Eyes */}
      <circle cx="34" cy="28" r="4" fill="white"/>
      <circle cx="46" cy="28" r="4" fill="white"/>
      <circle cx="35" cy="29" r="2" fill="#1a1a2e"/>
      <circle cx="47" cy="29" r="2" fill="#1a1a2e"/>
      {/* Smile */}
      <path d="M34 36 Q40 41 46 36" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Arms holding barbell */}
      <rect x="8" y="50" width="12" height="5" rx="2.5" fill="#4CAF50"/>
      <rect x="60" y="50" width="12" height="5" rx="2.5" fill="#4CAF50"/>
      {/* Barbell */}
      <rect x="16" y="49" width="48" height="7" rx="3.5" fill="#1a1a2e"/>
      <circle cx="16" cy="52" r="6" fill="#333"/>
      <circle cx="64" cy="52" r="6" fill="#333"/>
    </svg>
  );
}

function BlobSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blob body */}
      <ellipse cx="40" cy="44" rx="26" ry="22" fill="#9C27B0"/>
      {/* Head merges with body */}
      <circle cx="40" cy="30" r="20" fill="#AB47BC"/>
      {/* Flexed left arm */}
      <ellipse cx="16" cy="38" rx="9" ry="6" fill="#9C27B0" transform="rotate(-30 16 38)"/>
      <ellipse cx="10" cy="30" rx="6" ry="9" fill="#9C27B0" transform="rotate(-10 10 30)"/>
      {/* Right arm relaxed */}
      <ellipse cx="64" cy="44" rx="9" ry="5" fill="#9C27B0" transform="rotate(20 64 44)"/>
      {/* Eyes */}
      <circle cx="33" cy="28" r="5" fill="white"/>
      <circle cx="47" cy="28" r="5" fill="white"/>
      <circle cx="34" cy="29" r="2.5" fill="#1a1a2e"/>
      <circle cx="48" cy="29" r="2.5" fill="#1a1a2e"/>
      {/* Star eyes shine */}
      <circle cx="35" cy="28" r="1" fill="white"/>
      <circle cx="49" cy="28" r="1" fill="white"/>
      {/* Grin */}
      <path d="M32 37 Q40 44 48 37" stroke="#6A1B9A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Bicep bump */}
      <circle cx="9" cy="26" r="5" fill="#CE93D8"/>
    </svg>
  );
}

function RoboSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="22" y="42" width="36" height="26" rx="4" fill="#1565C0"/>
      {/* Head */}
      <rect x="24" y="14" width="32" height="28" rx="6" fill="#1E88E5"/>
      {/* Antenna */}
      <line x1="40" y1="14" x2="40" y2="6" stroke="#90CAF9" strokeWidth="3"/>
      <circle cx="40" cy="5" r="3" fill="#F44336"/>
      {/* Eyes */}
      <rect x="29" y="22" width="8" height="6" rx="2" fill="#00E5FF"/>
      <rect x="43" y="22" width="8" height="6" rx="2" fill="#00E5FF"/>
      {/* Mouth grid */}
      <rect x="29" y="33" width="22" height="5" rx="2" fill="#0D47A1"/>
      <line x1="35" y1="33" x2="35" y2="38" stroke="#1E88E5" strokeWidth="1"/>
      <line x1="40" y1="33" x2="40" y2="38" stroke="#1E88E5" strokeWidth="1"/>
      <line x1="45" y1="33" x2="45" y2="38" stroke="#1E88E5" strokeWidth="1"/>
      {/* Arms */}
      <rect x="6" y="44" width="16" height="8" rx="4" fill="#1565C0"/>
      <rect x="58" y="44" width="16" height="8" rx="4" fill="#1565C0"/>
      {/* Fists */}
      <rect x="4" y="42" width="10" height="10" rx="3" fill="#1E88E5"/>
      <rect x="66" y="42" width="10" height="10" rx="3" fill="#1E88E5"/>
      {/* Chest bolt */}
      <circle cx="40" cy="55" r="4" fill="#0D47A1"/>
      <circle cx="40" cy="55" r="2" fill="#42A5F5"/>
    </svg>
  );
}

function YetiSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fur body */}
      <ellipse cx="40" cy="54" rx="22" ry="18" fill="#B0BEC5"/>
      {/* Fur texture bumps */}
      <circle cx="25" cy="48" r="6" fill="#CFD8DC"/>
      <circle cx="55" cy="48" r="6" fill="#CFD8DC"/>
      <circle cx="30" cy="58" r="5" fill="#CFD8DC"/>
      <circle cx="50" cy="60" r="5" fill="#CFD8DC"/>
      {/* Head */}
      <circle cx="40" cy="28" r="20" fill="#CFD8DC"/>
      {/* Fur on head */}
      <circle cx="22" cy="22" r="7" fill="#ECEFF1"/>
      <circle cx="58" cy="22" r="7" fill="#ECEFF1"/>
      <circle cx="40" cy="12" r="8" fill="#ECEFF1"/>
      {/* Eyes */}
      <circle cx="33" cy="26" r="5" fill="white"/>
      <circle cx="47" cy="26" r="5" fill="white"/>
      <circle cx="34" cy="27" r="2.5" fill="#37474F"/>
      <circle cx="48" cy="27" r="2.5" fill="#37474F"/>
      {/* Nose */}
      <ellipse cx="40" cy="33" rx="4" ry="3" fill="#90A4AE"/>
      {/* Running legs */}
      <rect x="28" y="68" width="10" height="8" rx="4" fill="#90A4AE" transform="rotate(-15 28 68)"/>
      <rect x="44" y="65" width="10" height="8" rx="4" fill="#90A4AE" transform="rotate(15 44 65)"/>
      {/* Arms running pose */}
      <rect x="8" y="46" width="14" height="7" rx="3.5" fill="#B0BEC5" transform="rotate(-30 8 46)"/>
      <rect x="58" y="42" width="14" height="7" rx="3.5" fill="#B0BEC5" transform="rotate(30 58 42)"/>
    </svg>
  );
}

function CactusSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main body */}
      <rect x="28" y="28" width="24" height="40" rx="12" fill="#388E3C"/>
      {/* Left arm */}
      <rect x="10" y="36" width="20" height="10" rx="5" fill="#388E3C"/>
      <rect x="10" y="26" width="10" height="14" rx="5" fill="#388E3C"/>
      {/* Right arm */}
      <rect x="50" y="36" width="20" height="10" rx="5" fill="#388E3C"/>
      <rect x="60" y="22" width="10" height="16" rx="5" fill="#388E3C"/>
      {/* Spines left */}
      <line x1="14" y1="34" x2="10" y2="30" stroke="#81C784" strokeWidth="1.5"/>
      <line x1="14" y1="40" x2="10" y2="44" stroke="#81C784" strokeWidth="1.5"/>
      {/* Spines right */}
      <line x1="66" y1="34" x2="70" y2="30" stroke="#81C784" strokeWidth="1.5"/>
      <line x1="66" y1="40" x2="70" y2="44" stroke="#81C784" strokeWidth="1.5"/>
      {/* Spines body */}
      <line x1="36" y1="32" x2="34" y2="28" stroke="#81C784" strokeWidth="1.5"/>
      <line x1="44" y1="32" x2="46" y2="28" stroke="#81C784" strokeWidth="1.5"/>
      {/* Face */}
      <circle cx="35" cy="40" r="3.5" fill="#1B5E20"/>
      <circle cx="45" cy="40" r="3.5" fill="#1B5E20"/>
      <circle cx="35" cy="40" r="1.5" fill="white"/>
      <circle cx="45" cy="40" r="1.5" fill="white"/>
      {/* Big smile */}
      <path d="M33 48 Q40 54 47 48" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Flower on top */}
      <circle cx="40" cy="24" r="5" fill="#F48FB1"/>
      <circle cx="40" cy="24" r="2.5" fill="#FFF176"/>
    </svg>
  );
}

function GhostSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ghost body */}
      <path d="M16 60 L16 30 Q16 10 40 10 Q64 10 64 30 L64 60 L56 54 L48 60 L40 54 L32 60 L24 54 Z" fill="#ECEFF1"/>
      {/* Eyes */}
      <ellipse cx="31" cy="34" rx="6" ry="7" fill="#37474F"/>
      <ellipse cx="49" cy="34" rx="6" ry="7" fill="#37474F"/>
      <circle cx="33" cy="32" r="2" fill="white"/>
      <circle cx="51" cy="32" r="2" fill="white"/>
      {/* Mouth doing yoga 'O' */}
      <ellipse cx="40" cy="48" rx="5" ry="4" fill="#37474F"/>
      {/* Stretching arms up (yoga) */}
      <path d="M16 38 Q8 28 10 20" stroke="#ECEFF1" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M64 38 Q72 28 70 20" stroke="#ECEFF1" strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Glow */}
      <ellipse cx="40" cy="10" rx="15" ry="5" fill="#B0BEC544"/>
    </svg>
  );
}

function DragonSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wing left */}
      <path d="M26 36 Q10 20 14 8 Q22 18 28 28Z" fill="#EF9A9A"/>
      {/* Wing right */}
      <path d="M54 36 Q70 20 66 8 Q58 18 52 28Z" fill="#EF9A9A"/>
      {/* Body */}
      <ellipse cx="40" cy="54" rx="18" ry="16" fill="#E53935"/>
      {/* Head */}
      <circle cx="40" cy="30" r="18" fill="#EF5350"/>
      {/* Horns */}
      <polygon points="30,16 26,4 34,14" fill="#B71C1C"/>
      <polygon points="50,16 54,4 46,14" fill="#B71C1C"/>
      {/* Eyes */}
      <circle cx="33" cy="27" r="5" fill="#FFF176"/>
      <circle cx="47" cy="27" r="5" fill="#FFF176"/>
      <ellipse cx="34" cy="28" rx="2" ry="3" fill="#1a1a2e"/>
      <ellipse cx="48" cy="28" rx="2" ry="3" fill="#1a1a2e"/>
      {/* Snout */}
      <ellipse cx="40" cy="36" rx="8" ry="5" fill="#EF9A9A"/>
      <circle cx="37" cy="35" r="1.5" fill="#B71C1C"/>
      <circle cx="43" cy="35" r="1.5" fill="#B71C1C"/>
      {/* Punching arm */}
      <rect x="58" y="42" width="18" height="8" rx="4" fill="#E53935"/>
      <rect x="72" y="39" width="10" height="12" rx="4" fill="#EF5350"/>
      {/* Tail */}
      <path d="M40 68 Q30 76 22 72 Q28 68 32 72" fill="#E53935"/>
    </svg>
  );
}

function FungiSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stem */}
      <rect x="28" y="44" width="24" height="24" rx="8" fill="#FFCCBC"/>
      {/* Cap */}
      <ellipse cx="40" cy="40" rx="30" ry="20" fill="#8D6E63"/>
      {/* Cap spots */}
      <circle cx="28" cy="36" r="5" fill="#EFEBE9"/>
      <circle cx="40" cy="30" r="6" fill="#EFEBE9"/>
      <circle cx="52" cy="37" r="4" fill="#EFEBE9"/>
      <circle cx="35" cy="44" r="3" fill="#EFEBE9"/>
      {/* Face on stem */}
      <circle cx="35" cy="52" r="3.5" fill="#A1887F"/>
      <circle cx="45" cy="52" r="3.5" fill="#A1887F"/>
      <circle cx="35" cy="52" r="1.5" fill="white"/>
      <circle cx="45" cy="52" r="1.5" fill="white"/>
      <path d="M33 59 Q40 64 47 59" stroke="#6D4C41" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Arms holding dumbbell */}
      <rect x="6" y="52" width="22" height="7" rx="3.5" fill="#FFCCBC"/>
      <rect x="52" y="52" width="22" height="7" rx="3.5" fill="#FFCCBC"/>
      {/* Dumbbell */}
      <circle cx="10" cy="55" r="5" fill="#5D4037"/>
      <circle cx="70" cy="55" r="5" fill="#5D4037"/>
      <rect x="14" y="53" width="52" height="5" rx="2.5" fill="#333"/>
    </svg>
  );
}

const MONSTER_MAP = {
  goblin: GoblinSVG,
  blob: BlobSVG,
  robo: RoboSVG,
  yeti: YetiSVG,
  cactus: CactusSVG,
  ghost: GhostSVG,
  dragon: DragonSVG,
  fungi: FungiSVG,
};

export const MONSTER_TYPES = Object.keys(MONSTER_MAP);

export function randomMonsterType() {
  return MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
}

export default function MonsterAvatar({ monsterType, size = "md" }) {
  const px = SIZES[size] || SIZES.md;
  const Monster = MONSTER_MAP[monsterType] || GoblinSVG;
  return (
    <div
      className={`monster-avatar monster-avatar--${size}`}
      style={{ width: px, height: px }}
      aria-label={`${monsterType || "monster"} avatar`}
    >
      <Monster />
    </div>
  );
}
