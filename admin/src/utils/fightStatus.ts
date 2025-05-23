import type { Fight } from '../services/api';

export const getOngoingFight = (fights: Fight[]): Fight | null => {
  return fights.find(f => f.actual_start && !f.actual_end) || null;
};

export const getReadyFight = (fights: Fight[]): Fight | null => {
  const ongoingFight = getOngoingFight(fights);

  if (ongoingFight) {
    return fights.find(f =>
      !f.is_completed &&
      !f.actual_start &&
      f.expected_start > ongoingFight.expected_start
    ) || null;
  }

  return fights.find(f => !f.is_completed && !f.actual_start) || null;
};

export const getNextAvailableFight = (fights: Fight[]): Fight | null => {
  const readyFight = getReadyFight(fights);
  if (!readyFight) return null;

  return fights.find(f =>
    !f.is_completed &&
    !f.actual_start &&
    f.expected_start > readyFight.expected_start
  ) || null;
};

export const canEditFight = (fight: Fight, fights: Fight[]): boolean => {
  const ongoingFight = getOngoingFight(fights);
  const readyFight = getReadyFight(fights);

  if (fight.is_completed) return false;
  if (fight.actual_start) return false;
  if (ongoingFight && fight.fight_number <= ongoingFight.fight_number) return false;
  if (readyFight && fight.fight_number <= readyFight.fight_number) return false;

  return true;
};
