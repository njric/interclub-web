import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import type { Fight } from '../services/api';

interface EditFightNumberDialogProps {
  fight: Fight;
  onClose: () => void;
  onSave: (fightId: string, newNumber: number) => void;
  open?: boolean;
  totalFights?: number;
}

const EditFightNumberDialog: React.FC<EditFightNumberDialogProps> = ({
  fight,
  onClose,
  onSave,
  open = true,
  totalFights = 999
}) => {
  const [newNumber, setNewNumber] = useState(fight.fight_number);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(fight.id, newNumber);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Change Fight Number</DialogTitle>
        <DialogContent>
          <TextField
            label="New Fight Number"
            type="number"
            value={newNumber}
            onChange={(e) => setNewNumber(Number(e.target.value))}
            fullWidth
            required
            inputProps={{ min: 1, max: totalFights }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditFightNumberDialog;
