import React from 'react';
import { Paper, Stack, Typography, Chip } from '@mui/material';
import { formatTime } from '../../utils/time';
import type { Fight } from '../../services/api';
import { getClubColor, getFightTypeColor } from '../../utils/colors';

interface FightCardProps {
  fight: Fight;
  showStatus?: boolean;
}

const FightCard: React.FC<FightCardProps> = React.memo(({ fight, showStatus }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        position: 'relative',
        borderLeft: '4px solid',
        borderLeftColor: fight.actual_start && !fight.actual_end ? 'error.main' : 'primary.main'
      }}
    >
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Fight #{fight.fight_number} • {formatTime(fight.expected_start)} • {fight.duration} min
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="body1" fontWeight="bold">
              {fight.fighter_a}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: getClubColor(fight.fighter_a_club) }}
            >
              {fight.fighter_a_club}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            vs
          </Typography>
          <Stack alignItems="flex-end">
            <Typography variant="body1" fontWeight="bold">
              {fight.fighter_b}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: getClubColor(fight.fighter_b_club) }}
            >
              {fight.fighter_b_club}
            </Typography>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-end"
          sx={{ mt: 1 }}
        >
          <Typography variant="body2" color="text.secondary">
            {fight.weight_class}kg
          </Typography>
          {showStatus && (
            <Chip
              label={fight.fight_type}
              size="small"
              sx={{
                backgroundColor: getFightTypeColor(fight.fight_type),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
});

FightCard.displayName = 'FightCard';

export default FightCard;
