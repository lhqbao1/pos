import axios from "axios";

const fallbackStrapiUrl = "http://localhost:1337";

export const STRAPI_SERVER_BASE_URL = (
  process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || fallbackStrapiUrl
).replace(/\/$/, "");

export const getStrapiToken = () => process.env.STRAPI_API_TOKEN || "";

export const createStrapiServerClient = (withToken = false) => {
  const token = getStrapiToken();

  if (withToken && !token) {
    throw new Error("Thiếu STRAPI_API_TOKEN để thực hiện thao tác ghi dữ liệu.");
  }

  return axios.create({
    baseURL: STRAPI_SERVER_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};
