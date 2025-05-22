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
import type { Fight, FightCreate } from '../services/api';
import api from '../services/api';
import { useFightContext } from '../context/FightContext';
import { alpha } from '@mui/material/styles';

interface EditFightDialogProps {
  open: boolean;
  fight: Fight | null;
  onClose: () => void;
  onSave: (updatedFight: Omit<FightCreate, 'position'>) => void;
}

const EditFightDialog: React.FC<EditFightDialogProps> = ({ open, fight, onClose, onSave }) => {
  const [editedFight, setEditedFight] = useState<Omit<FightCreate, 'position'>>({
    fighter_a: '',
    fighter_a_club: '',
    fighter_b: '',
    fighter_b_club: '',
    weight_class: 0,
    duration: 15,
  });

  useEffect(() => {
    if (fight) {
      setEditedFight({
        fighter_a: fight.fighter_a,
        fighter_a_club: fight.fighter_a_club,
        fighter_b: fight.fighter_b,
        fighter_b_club: fight.fighter_b_club,
        weight_class: fight.weight_class,
        duration: fight.duration,
      });
    }
  }, [fight]);

  const handleSubmit = () => {
    onSave(editedFight);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Fight</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Fighter A"
            value={editedFight.fighter_a}
            onChange={(e) => setEditedFight({ ...editedFight, fighter_a: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter A Club"
            value={editedFight.fighter_a_club}
            onChange={(e) => setEditedFight({ ...editedFight, fighter_a_club: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter B"
            value={editedFight.fighter_b}
            onChange={(e) => setEditedFight({ ...editedFight, fighter_b: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter B Club"
            value={editedFight.fighter_b_club}
            onChange={(e) => setEditedFight({ ...editedFight, fighter_b_club: e.target.value })}
            fullWidth
          />
          <TextField
            label="Weight Class (kg)"
            type="number"
            value={editedFight.weight_class}
            onChange={(e) => setEditedFight({ ...editedFight, weight_class: parseInt(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            value={editedFight.duration}
            onChange={(e) => setEditedFight({ ...editedFight, duration: parseInt(e.target.value) })}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
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

  const handleEditFight = async (updatedFight: Omit<FightCreate, 'position'>) => {
    if (!editFight) return;

    try {
      await api.updateFight(editFight.id, updatedFight);
      await loadFights(true);
      setEditFight(null);
      setError(null);
    } catch (error: any) {
      console.error('Error updating fight:', error);
      setError(error.response?.data?.detail || 'Error updating fight. Please try again.');
    }
  };

  const formatTime = (time: string | undefined | null): string => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStartTime = (fight: Fight): string => {
    if (fight.actual_start) {
      return formatTime(fight.actual_start);
    }
    return formatTime(fight.expected_start);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Fight Management
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
              <TableCell align="center">Fight #</TableCell>
              <TableCell>Fighter A</TableCell>
              <TableCell>Club A</TableCell>
              <TableCell>Fighter B</TableCell>
              <TableCell>Club B</TableCell>
              <TableCell align="center">Weight (kg)</TableCell>
              <TableCell align="center">Duration</TableCell>
              <TableCell align="center">Start Time</TableCell>
              <TableCell align="center">End Time</TableCell>
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
                        title="Edit fight"
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

      <EditFightDialog
        open={!!editFight}
        fight={editFight}
        onClose={() => setEditFight(null)}
        onSave={handleEditFight}
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
