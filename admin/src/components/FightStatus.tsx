import React from 'react';
import { Paper, Typography, Box, Stack, Chip } from '@mui/material';
import { useFightContext } from '../context/FightContext';
import { formatTime } from '../utils/time';

const FightStatus: React.FC = () => {
  const { ongoingFight, readyFight } = useFightContext();

  return (
    <Stack spacing={2}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ongoing Fight
        </Typography>
        {ongoingFight ? (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Typography variant="body1">
                {ongoingFight.fighter_a} vs {ongoingFight.fighter_b}
              </Typography>
              <Chip
                label={`${ongoingFight.weight_class}kg`}
                size="small"
                color="primary"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Started at {formatTime(ongoingFight.actual_start)}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No fight in progress
          </Typography>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ready Fight
        </Typography>
        {readyFight ? (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Typography variant="body1">
                {readyFight.fighter_a} vs {readyFight.fighter_b}
              </Typography>
              <Chip
                label={`${readyFight.weight_class}kg`}
                size="small"
                color="secondary"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Expected start: {formatTime(readyFight.expected_start)}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No fight ready
          </Typography>
        )}
      </Paper>
    </Stack>
  );
};

export default FightStatus;
