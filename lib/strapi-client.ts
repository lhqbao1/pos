import axios from "axios";

const fallbackStrapiUrl = "http://localhost:1337";

export const STRAPI_BASE_URL = (
  process.env.NEXT_PUBLIC_STRAPI_URL || fallbackStrapiUrl
).replace(/\/$/, "");

const strapiClient = axios.create({
  baseURL: STRAPI_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default strapiClient;
