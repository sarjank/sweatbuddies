import { memo } from "react";
import MonsterAvatar from "../MonsterAvatar/MonsterAvatar";
import { formatWorkoutDate } from "../../utils/streak";

const TYPE_ICONS = { cardio: "🏃", weights: "🏋️", both: "🔥" };

const WorkoutCard = memo(function WorkoutCard({ workout, currentUid, onLike, likingId, onDelete }) {
  const w = workout;
  const liked = w.likes?.includes(currentUid);
  const likeCount = w.likes?.length || 0;
  const isOwn = w.uid === currentUid;

  return (
    <div className="feed-card">
      <div className="feed-card-top">
        <MonsterAvatar monsterType={w.monsterType} size="sm" />
        <div className="feed-user">
          <strong>{w.displayName}</strong>
          {w.handle && <span className="feed-handle">@{w.handle}</span>}
        </div>
        <div className={`feed-type-badge feed-type-badge--${w.type}`}>
          {TYPE_ICONS[w.type]} {w.type}
        </div>
        {w.isPersonalBest && <span className="pb-badge">🏆 PB</span>}
        {isOwn && onDelete && (
          <button
            className="workout-delete-btn"
            onClick={() => onDelete(w)}
            aria-label="Delete workout"
          >×</button>
        )}
      </div>
      {w.note && <p className="feed-note">"{w.note}"</p>}
      <div className="feed-card-bottom">
        <span className="feed-date">{formatWorkoutDate(w.workoutDate)}</span>
        <button
          className={`like-btn${liked ? " like-btn--liked" : ""}`}
          onClick={() => onLike(w)}
          disabled={likingId === w.id}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <span className="like-heart">{liked ? "❤️" : "🤍"}</span>
          {likeCount > 0 && <span className="like-count">{likeCount}</span>}
        </button>
      </div>
    </div>
  );
});

export default WorkoutCard;
