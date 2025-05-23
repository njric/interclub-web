export const formatTime = (time: string | null | undefined): string => {
  if (!time) return '-';
  return new Date(time).toLocaleTimeString('en-GB', {
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
