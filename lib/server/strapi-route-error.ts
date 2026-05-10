import axios from "axios";

export const toRouteErrorResponse = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message;
    return { status, message };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : fallbackMessage,
  };
};

