import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button
} from '@mui/material';
import type { Fight } from '../services/api';

interface CancelFightDialogProps {
  open: boolean;
  fight: Fight | null;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelFightDialog: React.FC<CancelFightDialogProps> = ({ open, fight, onClose, onConfirm }) => {
  if (!fight) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Cancel Fight</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to cancel the fight between {fight.fighter_a} ({fight.fighter_a_club}) and {fight.fighter_b} ({fight.fighter_b_club})?
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>No, Keep Fight</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Yes, Cancel Fight
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelFightDialog;
