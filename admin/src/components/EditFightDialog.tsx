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
import { useTranslation } from '../hooks/useTranslation';
import type { Fight, FightCreate } from '../services/api';

interface EditFightDialogProps {
  fight: Fight;
  onClose: () => void;
  onSave: (updatedFight: Omit<FightCreate, 'position'>) => void;
  open?: boolean;
}

const EditFightDialog: React.FC<EditFightDialogProps> = ({ fight, onClose, onSave, open = true }) => {
  const { t } = useTranslation();

  const FIGHT_TYPES = [
    { value: 'Boxing', label: t('editFight.fightTypes.boxing') },
    { value: 'Muay Thai', label: t('editFight.fightTypes.muayThai') },
    { value: 'Grappling', label: t('editFight.fightTypes.grappling') },
    { value: 'MMA', label: t('editFight.fightTypes.mma') }
  ];

  const [formData, setFormData] = useState({
    fighter_a: fight.fighter_a,
    fighter_a_club: fight.fighter_a_club,
    fighter_b: fight.fighter_b,
    fighter_b_club: fight.fighter_b_club,
    weight_class: fight.weight_class,
    round_duration: fight.round_duration,
    nb_rounds: fight.nb_rounds,
    rest_time: fight.rest_time,
    fight_type: fight.fight_type
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['weight_class', 'round_duration', 'nb_rounds', 'rest_time'].includes(name) ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t('editFight.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('editFight.fields.fighterA')}
              name="fighter_a"
              value={formData.fighter_a}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label={t('editFight.fields.fighterAClub')}
              name="fighter_a_club"
              value={formData.fighter_a_club}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label={t('editFight.fields.fighterB')}
              name="fighter_b"
              value={formData.fighter_b}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label={t('editFight.fields.fighterBClub')}
              name="fighter_b_club"
              value={formData.fighter_b_club}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label={t('editFight.fields.weightClass')}
              name="weight_class"
              type="number"
              value={formData.weight_class}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
            <TextField
              label={t('editFight.fields.roundDuration') || 'Round Duration (min)'}
              name="round_duration"
              type="number"
              value={formData.round_duration}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 1, max: 60 }}
            />
            <TextField
              label={t('editFight.fields.nbRounds') || 'Number of Rounds'}
              name="nb_rounds"
              type="number"
              value={formData.nb_rounds}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 1, max: 10 }}
            />
            <TextField
              label={t('editFight.fields.restTime') || 'Rest Time (min)'}
              name="rest_time"
              type="number"
              value={formData.rest_time}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ min: 0, max: 10 }}
            />
            <TextField
              label={t('editFight.fields.fightType')}
              name="fight_type"
              select
              value={formData.fight_type}
              onChange={handleChange}
              fullWidth
              required
            >
              {FIGHT_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('editFight.buttons.cancel')}</Button>
          <Button type="submit" variant="contained">{t('editFight.buttons.save')}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditFightDialog;
