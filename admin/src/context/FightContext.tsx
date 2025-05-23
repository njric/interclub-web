import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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

  // Initial load and timer setup
  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      await refreshFightStatus();
    };

    // Initial load
    loadData();

    // Refresh every 60 seconds (increased from 30)
    const interval = window.setInterval(() => {
      if (isMounted) {
        loadData();
      }
    }, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []); // No dependencies to prevent recreation

  const contextValue = useMemo(() => ({
    ongoingFight,
    readyFight,
    refreshFightStatus
  }), [ongoingFight, readyFight, refreshFightStatus]);

  return (
    <FightContext.Provider value={contextValue}>
      {children}
    </FightContext.Provider>
  );
};
