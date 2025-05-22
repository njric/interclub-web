import React, { useState } from 'react';
import {
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  Stack,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../services/api';
import type { FightCreate } from '../services/api';

interface AddFightDialogProps {
  open: boolean;
  onClose: () => void;
  totalFights: number;
}

const AddFightDialog: React.FC<AddFightDialogProps> = ({ open, onClose, totalFights }) => {
  const [newFight, setNewFight] = useState<FightCreate>({
    fighter_a: '',
    fighter_a_club: '',
    fighter_b: '',
    fighter_b_club: '',
    weight_class: 0,
    duration: 15,
    position: totalFights + 1,
  });

  const handleSubmit = async () => {
    try {
      await api.addFight(newFight);
      onClose();
      window.location.reload(); // Refresh to show new fight
    } catch (error: any) {
      console.error('Error adding fight:', error);
      alert('Error adding fight: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Fight</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Fighter A"
            value={newFight.fighter_a}
            onChange={(e) => setNewFight({ ...newFight, fighter_a: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter A Club"
            value={newFight.fighter_a_club}
            onChange={(e) => setNewFight({ ...newFight, fighter_a_club: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter B"
            value={newFight.fighter_b}
            onChange={(e) => setNewFight({ ...newFight, fighter_b: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter B Club"
            value={newFight.fighter_b_club}
            onChange={(e) => setNewFight({ ...newFight, fighter_b_club: e.target.value })}
            fullWidth
          />
          <TextField
            label="Weight Class (kg)"
            type="number"
            value={newFight.weight_class}
            onChange={(e) => setNewFight({ ...newFight, weight_class: parseInt(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            value={newFight.duration}
            onChange={(e) => setNewFight({ ...newFight, duration: parseInt(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Position"
            type="number"
            value={newFight.position}
            onChange={(e) => setNewFight({ ...newFight, position: parseInt(e.target.value) })}
            inputProps={{ min: 1, max: totalFights + 1 }}
            fullWidth
            helperText={`Enter a number between 1 and ${totalFights + 1}`}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Fight
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ImportFights: React.FC = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [addFightOpen, setAddFightOpen] = useState(false);
  const [totalFights, setTotalFights] = useState(0);

  React.useEffect(() => {
    // Get total number of fights for the add fight dialog
    const fetchTotalFights = async () => {
      try {
        const fights = await api.getFights();
        setTotalFights(fights.length);
      } catch (error) {
        console.error('Error fetching fights:', error);
      }
    };
    fetchTotalFights();
  }, []);

  const handleSetStartTime = async () => {
    if (!startTime) {
      setMessage({
        type: 'error',
        text: 'Please select a start time',
      });
      return;
    }

    try {
      const timeString = startTime.toLocaleTimeString('en-US', { hour12: false });
      await api.setStartTime(timeString);
      setMessage({
        type: 'success',
        text: 'Start time set successfully',
      });
    } catch (error: any) {
      console.error('Error setting start time:', error);
      setMessage({
        type: 'error',
        text: `Error setting start time: ${error.message}`,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await api.importFights(file);
      setMessage({
        type: 'success',
        text: `Successfully imported ${result.imported} fights`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      const errorDetail = error.response?.data?.detail;
      const errorStatus = error.response?.status;
      const errorMessage = error.message;
      setMessage({
        type: 'error',
        text: `Error importing fights (${errorStatus}): ${errorDetail || errorMessage || 'Unknown error'}. Please check your CSV format and try again.`,
      });
    }

    // Reset the file input
    event.target.value = '';
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all fights? This cannot be undone.')) {
      try {
        await api.clearAllFights();
        setMessage({
          type: 'success',
          text: 'All fights cleared successfully',
        });
      } catch (error: any) {
        console.error('Clear error:', error);
        const errorDetail = error.response?.data?.detail;
        const errorStatus = error.response?.status;
        const errorMessage = error.message;
        setMessage({
          type: 'error',
          text: `Error clearing fights (${errorStatus}): ${errorDetail || errorMessage || 'Unknown error'}`,
        });
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Import & Database Management
      </Typography>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          Set Start Time
        </Typography>
        <Box sx={{ mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TimePicker
                label="First Fight Start Time"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
              />
              <Button
                variant="contained"
                onClick={handleSetStartTime}
                disabled={!startTime}
              >
                Set Start Time
              </Button>
            </Stack>
          </LocalizationProvider>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          Add Fight
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setAddFightOpen(true)}
          >
            Add New Fight
          </Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          Import Fights
        </Typography>
        <Box my={2}>
          <Typography variant="body1" gutterBottom>
            Upload a CSV file with the following columns:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ backgroundColor: '#f5f5f5', p: 1 }}>
            fighter_a,fighter_a_club,fighter_b,fighter_b_club,weight_class,duration
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Example:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ backgroundColor: '#f5f5f5', p: 1 }}>
            Buakaw,Por Pramuk,Masato,K-1,76,15
            Saenchai,13 Coins,Pakorn,Por Pramuk,65,15
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Notes:
          </Typography>
          <ul>
            <Typography variant="body2" component="li">
              weight_class: Integer representing the weight category in kg (e.g., 76 for 76kg)
            </Typography>
            <Typography variant="body2" component="li">
              duration: Fight duration in minutes
            </Typography>
          </ul>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" component="label">
            Upload CSV
            <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom color="error">
          Danger Zone
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          These actions cannot be undone. Please be certain.
        </Typography>
        <Box mt={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearAll}
          >
            Clear All Fights
          </Button>
        </Box>
      </Paper>

      <AddFightDialog
        open={addFightOpen}
        onClose={() => setAddFightOpen(false)}
        totalFights={totalFights}
      />

      {message && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}
    </Box>
  );
};

export default ImportFights;
