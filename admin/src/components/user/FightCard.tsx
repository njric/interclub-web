import React from 'react';
import { Paper, Stack, Typography, Chip } from '@mui/material';
import { formatTime } from '../../utils/time';
import type { Fight } from '../../services/api';
import { getClubColor } from '../../utils/colors';

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
          Fight #{fight.fight_number} • {formatTime(fight.expected_start)} • {fight.nb_rounds} x {fight.round_duration}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={0.5}>
            <Typography variant="body1" fontWeight="bold">
              {fight.fighter_a}
            </Typography>
            <Chip
              label={fight.fighter_a_club}
              size="small"
              sx={{
                backgroundColor: getClubColor(fight.fighter_a_club),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            vs
          </Typography>
          <Stack alignItems="flex-end" spacing={0.5}>
            <Typography variant="body1" fontWeight="bold">
              {fight.fighter_b}
            </Typography>
            <Chip
              label={fight.fighter_b_club}
              size="small"
              sx={{
                backgroundColor: getClubColor(fight.fighter_b_club),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}
            />
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
            <Typography variant="body2" color="text.secondary">
              {fight.fight_type}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
});

FightCard.displayName = 'FightCard';

export default FightCard;
