import { memo } from "react";
import MonsterAvatar from "../MonsterAvatar/MonsterAvatar";

const FriendCard = memo(function FriendCard({ friend }) {
  return (
    <div className="friend-row">
      <MonsterAvatar monsterType={friend.monsterType} size="md" />
      <div className="friend-info">
        <strong>{friend.displayName}</strong>
        <span className="src-handle">@{friend.handle}</span>
        <span className="friend-count">{friend.workoutCount || 0} workouts</span>
      </div>
    </div>
  );
});

export default FriendCard;
