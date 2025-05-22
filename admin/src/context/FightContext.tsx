import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Fight } from '../services/api';
import api from '../services/api';

interface FightContextType {
  ongoingFight: Fight | null;
  readyFight: Fight | null;
  refreshFightStatus: () => Promise<void>;
}

const FightContext = createContext<FightContextType | null>(null);

export const useFightContext = () => {
  const context = useContext(FightContext);
  if (!context) {
    throw new Error('useFightContext must be used within a FightProvider');
  }
  return context;
};

export const FightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ongoingFight, setOngoingFight] = useState<Fight | null>(null);
  const [readyFight, setReadyFight] = useState<Fight | null>(null);

  const refreshFightStatus = useCallback(async () => {
    try {
      const [ongoing, ready] = await Promise.all([
        api.getOngoingFight(),
        api.getReadyFight()
      ]);
      setOngoingFight(ongoing);
      setReadyFight(ready);
    } catch (error) {
      console.error('Error refreshing fight status:', error);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    refreshFightStatus();

    // Refresh every 30 seconds
    const interval = window.setInterval(refreshFightStatus, 30000);
    return () => window.clearInterval(interval);
  }, [refreshFightStatus]);

  return (
    <FightContext.Provider value={{ ongoingFight, readyFight, refreshFightStatus }}>
      {children}
    </FightContext.Provider>
  );
};
