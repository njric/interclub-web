import React from 'react';
import { Paper, Typography, Stack, Chip } from '@mui/material';
import type { Fight } from '../../services/api';
import { getClubColor } from '../../utils/colors';

interface FightCardProps {
  fight: Fight;
  showStatus?: boolean;
}

const FightCard: React.FC<FightCardProps> = ({ fight, showStatus = false }) => {
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = () => {
    if (fight.is_completed) return 'default';
    if (fight.actual_start) return 'error'; // Ongoing
    return 'success'; // Ready
  };

  // Get colors for clubs
  const clubAColor = getClubColor(fight.fighter_a_club);
  const clubBColor = getClubColor(fight.fighter_b_club);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        background: fight.actual_start && !fight.actual_end ? 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)' : 'white'
      }}
    >
      <Stack spacing={1}>
        {/* Fight number and time */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle2" color="text.secondary">
            Fight #{fight.fight_number}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {formatTime(fight.actual_start || fight.expected_start)}
          </Typography>
        </Stack>

        {/* Fighter A */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body1" sx={{ fontWeight: 500, flex: 1 }}>
            {fight.fighter_a}
          </Typography>
          <Chip
            label={fight.fighter_a_club}
            size="small"
            sx={{
              minWidth: 80,
              color: 'white',
              backgroundColor: clubAColor,
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
        </Stack>

        {/* Fighter B */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body1" sx={{ fontWeight: 500, flex: 1 }}>
            {fight.fighter_b}
          </Typography>
          <Chip
            label={fight.fighter_b_club}
            size="small"
            sx={{
              minWidth: 80,
              color: 'white',
              backgroundColor: clubBColor,
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
        </Stack>

        {/* Weight and Status */}
        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-between"
          alignItems="center"
        >
          <Chip
            label={`${fight.weight_class}kg`}
            size="small"
            color="secondary"
          />
          {showStatus && (
            <Chip
              label={fight.is_completed ? 'Completed' : fight.actual_start ? 'Ongoing' : 'Ready'}
              size="small"
              color={getStatusColor()}
            />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default FightCard;
