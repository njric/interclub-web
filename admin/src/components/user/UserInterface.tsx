import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Container,
  Paper
} from '@mui/material';
import { useTranslation } from '../../hooks/useTranslation';
import CurrentFights from './CurrentFights';
import PastFights from './PastFights';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const UserInterface: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" color="default" elevation={0}>
        <Container maxWidth="lg" disableGutters>
          <Toolbar>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h1"
              sx={{ flexGrow: 1, fontWeight: 500 }}
            >
              {t('userInterface.title')}
            </Typography>
          </Toolbar>
          <Paper elevation={0} square>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontSize: isMobile ? '0.875rem' : '1rem',
                }
              }}
            >
              <Tab label={t('navigation.currentFights')} />
              <Tab label={t('navigation.pastFights')} />
            </Tabs>
          </Paper>
        </Container>
      </AppBar>

      {/* Add toolbar spacing */}
      <Toolbar />
      <Box mt={7}>
        <TabPanel value={currentTab} index={0}>
          <CurrentFights />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <PastFights />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default UserInterface;
