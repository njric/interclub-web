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
  Alert,
  Snackbar,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { Fight } from '../services/api';
import api from '../services/api';
import { useFightContext } from '../context/FightContext';
import { alpha } from '@mui/material/styles';

interface EditDialogProps {
  open: boolean;
  fight: Fight | null;
  totalFights: number;
  onClose: () => void;
  onSave: (newNumber: number) => void;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, fight, totalFights, onClose, onSave }) => {
  const [newNumber, setNewNumber] = useState<number>(fight?.fight_number || 1);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (fight) {
      setNewNumber(fight.fight_number);
    }
  }, [fight]);

  const handleSave = () => {
    if (newNumber < 1 || newNumber > totalFights) {
      setError(`Fight number must be between 1 and ${totalFights}`);
      return;
    }
    onSave(newNumber);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Fight Number</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="New Fight Number"
          type="number"
          fullWidth
          value={newNumber}
          onChange={(e) => {
            setNewNumber(parseInt(e.target.value));
            setError('');
          }}
          inputProps={{ min: 1, max: totalFights }}
          error={!!error}
          helperText={error || `Enter a number between 1 and ${totalFights}`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FightList: React.FC = () => {
  const [fights, setFights] = useState<Fight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editFight, setEditFight] = useState<Fight | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [movedFightId, setMovedFightId] = useState<string | null>(null);
  const { refreshFightStatus } = useFightContext();

  // Configuration options
  const REFRESH_INTERVAL = 30000; // 30 seconds, can be configured via environment variable
  const AUTO_REFRESH_ENABLED = true; // Can be configured via environment variable

  const loadFights = async (force = false) => {
    // Skip refresh if an update is in progress
    if (isUpdating && !force) return;

    try {
      const data = await api.getFights();

      // Only update state if the fights have actually changed
      const hasChanges = !fights.length || data.some((newFight, index) => {
        const oldFight = fights[index];
        return !oldFight ||
          oldFight.fight_number !== newFight.fight_number ||
          oldFight.actual_start !== newFight.actual_start ||
          oldFight.actual_end !== newFight.actual_end ||
          oldFight.is_completed !== newFight.is_completed;
      });

      if (hasChanges) {
        setFights(data.sort((a, b) => a.fight_number - b.fight_number));
      }
    } catch (error) {
      console.error('Error loading fights:', error);
      setError('Error loading fights. Please refresh the page.');
    }
  };

  useEffect(() => {
    // Initial load
    loadFights(true);

    // Set up auto-refresh if enabled
    let interval: number | null = null;
    if (AUTO_REFRESH_ENABLED) {
      interval = window.setInterval(() => loadFights(), REFRESH_INTERVAL);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, []);

  const handleStart = async (fightId: string) => {
    try {
      await api.startFight(fightId);
      await loadFights();
      await refreshFightStatus(); // Refresh fight status after starting a fight
    } catch (error) {
      console.error('Error starting fight:', error);
      setError('Error starting fight. Please try again.');
    }
  };

  const handleEnd = async (fightId: string) => {
    try {
      await api.endFight(fightId);
      await loadFights();
      await refreshFightStatus(); // Refresh fight status after ending a fight
    } catch (error) {
      console.error('Error ending fight:', error);
      setError('Error ending fight. Please try again.');
    }
  };

  const handleCancel = async (fightId: string) => {
    if (window.confirm('Are you sure you want to cancel this fight?')) {
      try {
        await api.cancelFight(fightId);
        await loadFights();
        await refreshFightStatus(); // Refresh fight status after canceling a fight
      } catch (error) {
        console.error('Error canceling fight:', error);
        setError('Error canceling fight. Please try again.');
      }
    }
  };

  const handleEditNumber = async (newNumber: number) => {
    if (!editFight) return;

    const originalFights = [...fights];

    try {
      setIsUpdating(true);
      setMovedFightId(editFight.id);

      // Optimistically update the UI
      const updatedFights = fights.map(fight => {
        if (fight.id === editFight.id) {
          return { ...fight, fight_number: newNumber };
        }
        // Update other fights' numbers based on the move
        if (newNumber > editFight.fight_number) {
          // Moving fight to a later position
          if (fight.fight_number > editFight.fight_number && fight.fight_number <= newNumber) {
            return { ...fight, fight_number: fight.fight_number - 1 };
          }
        } else {
          // Moving fight to an earlier position
          if (fight.fight_number >= newNumber && fight.fight_number < editFight.fight_number) {
            return { ...fight, fight_number: fight.fight_number + 1 };
          }
        }
        return fight;
      }).sort((a, b) => a.fight_number - b.fight_number);

      setFights(updatedFights);
      setEditFight(null);

      // Make the actual API call
      const serverUpdatedFights = await api.updateFightNumber(editFight.id, newNumber);

      // Update with server response to ensure consistency
      setFights(serverUpdatedFights);

      // Clear the moved fight highlight after animation
      setTimeout(() => {
        setMovedFightId(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error updating fight number:', error);
      // Rollback to original state on error
      setFights(originalFights);
      setError(error.response?.data?.detail || 'Error updating fight number. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStartTime = (fight: Fight) => {
    if (fight.actual_start) {
      return formatTime(fight.actual_start);
    }
    return formatTime(fight.expected_start);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Fight Schedule
      </Typography>
      {isUpdating && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Updating fight order...
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: '80px' }}>Fight #</TableCell>
              <TableCell>Fighter A</TableCell>
              <TableCell>Club A</TableCell>
              <TableCell>Fighter B</TableCell>
              <TableCell>Club B</TableCell>
              <TableCell align="center">Weight Class</TableCell>
              <TableCell align="center" sx={{ width: '100px' }}>Duration</TableCell>
              <TableCell align="center" sx={{ width: '100px' }}>Start</TableCell>
              <TableCell align="center" sx={{ width: '100px' }}>End</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fights.map((fight) => (
              <TableRow
                key={fight.id}
                sx={{
                  backgroundColor: fight.id === movedFightId ?
                    (theme) => alpha(theme.palette.primary.main, 0.1) :
                    'inherit',
                  transition: 'all 0.3s ease-in-out',
                  transform: fight.id === movedFightId ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <TableCell align="center">
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    {fight.fight_number}
                    {!fight.actual_start && (
                      <IconButton
                        size="small"
                        onClick={() => setEditFight(fight)}
                        title="Edit fight number"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{fight.fighter_a}</TableCell>
                <TableCell>{fight.fighter_a_club}</TableCell>
                <TableCell>{fight.fighter_b}</TableCell>
                <TableCell>{fight.fighter_b_club}</TableCell>
                <TableCell align="center">{fight.weight_class}</TableCell>
                <TableCell align="center">{fight.duration} min</TableCell>
                <TableCell align="center">{getStartTime(fight)}</TableCell>
                <TableCell align="center">{formatTime(fight.actual_end)}</TableCell>
                <TableCell align="center">
                  {fight.is_completed
                    ? 'Completed'
                    : fight.actual_start
                    ? 'In Progress'
                    : 'Scheduled'}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
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
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <EditDialog
        open={!!editFight}
        fight={editFight}
        totalFights={fights.length}
        onClose={() => setEditFight(null)}
        onSave={handleEditNumber}
      />
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default FightList;
