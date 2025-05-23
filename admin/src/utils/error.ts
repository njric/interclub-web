export type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
    status?: number;
  };
  message?: string;
};

export const getErrorMessage = (error: ApiError, defaultMessage: string): string => {
  return error.response?.data?.detail || error.message || defaultMessage;
};

export const logError = (context: string, error: ApiError): void => {
  console.error(`Error in ${context}:`, error);
  if (error.response?.status) {
    console.error(`Status code: ${error.response.status}`);
  }
};
