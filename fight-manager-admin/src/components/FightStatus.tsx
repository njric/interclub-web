import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import type { Fight } from '../services/api';
import api from '../services/api';

const FightStatus: React.FC = () => {
  const [ongoingFight, setOngoingFight] = useState<Fight | null>(null);
  const [readyFight, setReadyFight] = useState<Fight | null>(null);

  const loadStatus = async () => {
    try {
      const [ongoing, ready] = await Promise.all([
        api.getOngoingFight(),
        api.getReadyFight(),
      ]);
      setOngoingFight(ongoing);
      setReadyFight(ready);
    } catch (error) {
      console.error('Error loading fight status:', error);
    }
  };

  useEffect(() => {
    loadStatus();
    // Refresh every 10 seconds
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const FightCard: React.FC<{ title: string; fight: Fight | null }> = ({
    title,
    fight,
  }) => (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        m: 2,
        backgroundColor: title === 'ONGOING' ? '#e3f2fd' : '#f3e5f5',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {fight ? (
        <>
          <Typography variant="body1">
            <strong>Fighters:</strong> {fight.fighter_a} vs {fight.fighter_b}
          </Typography>
          <Typography variant="body2">
            <strong>Duration:</strong> {fight.duration} minutes
          </Typography>
          <Typography variant="body2">
            <strong>Expected Start:</strong>{' '}
            {new Date(fight.expected_start).toLocaleString()}
          </Typography>
        </>
      ) : (
        <Typography variant="body1">No fight {title.toLowerCase()}</Typography>
      )}
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Fight Status
      </Typography>
      <Box display="flex" justifyContent="center">
        <FightCard title="ONGOING" fight={ongoingFight} />
        <FightCard title="READY" fight={readyFight} />
      </Box>
    </Box>
  );
};

export default FightStatus;
