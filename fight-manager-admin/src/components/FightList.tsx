import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Stack,
} from '@mui/material';
import type { Fight } from '../services/api';
import api from '../services/api';

const FightList: React.FC = () => {
  const [fights, setFights] = useState<Fight[]>([]);

  const loadFights = async () => {
    try {
      const data = await api.getFights();
      setFights(data);
    } catch (error) {
      console.error('Error loading fights:', error);
    }
  };

  useEffect(() => {
    loadFights();
    // Refresh every 30 seconds
    const interval = setInterval(loadFights, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (fightId: string) => {
    try {
      await api.startFight(fightId);
      loadFights();
    } catch (error) {
      console.error('Error starting fight:', error);
    }
  };

  const handleEnd = async (fightId: string) => {
    try {
      await api.endFight(fightId);
      loadFights();
    } catch (error) {
      console.error('Error ending fight:', error);
    }
  };

  const handleReset = async (fightId: string) => {
    try {
      await api.resetFight(fightId);
      loadFights();
    } catch (error) {
      console.error('Error resetting fight:', error);
    }
  };

  const handleCancel = async (fightId: string) => {
    if (window.confirm('Are you sure you want to cancel this fight?')) {
      try {
        await api.cancelFight(fightId);
        loadFights();
      } catch (error) {
        console.error('Error canceling fight:', error);
      }
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Fight Schedule
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fighter A</TableCell>
              <TableCell>Fighter B</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Expected Start</TableCell>
              <TableCell>Actual Start</TableCell>
              <TableCell>Actual End</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fights.map((fight) => (
              <TableRow key={fight.id}>
                <TableCell>{fight.fighter_a}</TableCell>
                <TableCell>{fight.fighter_b}</TableCell>
                <TableCell>{fight.duration} min</TableCell>
                <TableCell>{formatDateTime(fight.expected_start)}</TableCell>
                <TableCell>{formatDateTime(fight.actual_start)}</TableCell>
                <TableCell>{formatDateTime(fight.actual_end)}</TableCell>
                <TableCell>
                  {fight.is_completed
                    ? 'Completed'
                    : fight.actual_start
                    ? 'In Progress'
                    : 'Scheduled'}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {!fight.actual_start && !fight.is_completed && (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleStart(fight.id)}
                        >
                          Start
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleCancel(fight.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {fight.actual_start && !fight.actual_end && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleEnd(fight.id)}
                      >
                        End
                      </Button>
                    )}
                    {(fight.actual_start || fight.is_completed) && (
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        onClick={() => handleReset(fight.id)}
                      >
                        Reset
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default FightList;
