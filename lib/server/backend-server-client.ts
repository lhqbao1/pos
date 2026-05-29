import axios from "axios";

const fallbackBackendUrl = "http://localhost:3002";

export const BACKEND_SERVER_BASE_URL = (
  process.env.NEST_API_URL ||
  process.env.NEXT_PUBLIC_NEST_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  fallbackBackendUrl
).replace(/\/$/, "");

export const createBackendServerClient = () => {
  return axios.create({
    baseURL: BACKEND_SERVER_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
