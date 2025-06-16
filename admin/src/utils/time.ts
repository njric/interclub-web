export const formatTime = (time: string | null | undefined): string => {
  if (!time) return '-';
  
  // Créer un objet Date à partir de la chaîne
  const date = new Date(time);
  
  // Si la date ne contient pas d'information de fuseau horaire,
  // JavaScript l'interprète comme heure locale
  // Sinon, toLocaleTimeString() convertit automatiquement vers l'heure locale
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const calculateDuration = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
  return `${durationMinutes} min`;
};
