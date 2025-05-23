import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack
} from '@mui/material';
import type { Fight, FightCreate } from '../services/api';

interface EditFightDialogProps {
  fight: Fight;
  onClose: () => void;
  onSave: (updatedFight: Omit<FightCreate, 'position'>) => void;
  open?: boolean;
}

const FIGHT_TYPES = ['Boxing', 'Muay Thai', 'Grappling', 'MMA'];

const EditFightDialog: React.FC<EditFightDialogProps> = ({ fight, onClose, onSave, open = true }) => {
  const [formData, setFormData] = useState({
    fighter_a: fight.fighter_a,
    fighter_a_club: fight.fighter_a_club,
    fighter_b: fight.fighter_b,
    fighter_b_club: fight.fighter_b_club,
    weight_class: fight.weight_class,
    duration: fight.duration,
    fight_type: fight.fight_type
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weight_class' || name === 'duration' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Fight</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Fighter A"
              name="fighter_a"
              value={formData.fighter_a}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Fighter A Club"
              name="fighter_a_club"
              value={formData.fighter_a_club}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Fighter B"
              name="fighter_b"
              value={formData.fighter_b}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Fighter B Club"
              name="fighter_b_club"
              value={formData.fighter_b_club}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Weight Class (kg)"
              name="weight_class"
              type="number"
              value={formData.weight_class}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Duration (minutes)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 1, max: 60 }}
            />
            <TextField
              label="Fight Type"
              name="fight_type"
              select
              value={formData.fight_type}
              onChange={handleChange}
              fullWidth
              required
            >
              {FIGHT_TYPES.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditFightDialog;
