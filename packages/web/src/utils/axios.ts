import axios, { AxiosRequestConfig } from "axios";

const api = (() => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer dev-token",
    },
  });

  return {
    get: async (url: string, config?: AxiosRequestConfig) => {
      const { data } = await instance.get(url, config);
      return data;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post: async (url: string, body?: any, config?: AxiosRequestConfig) => {
      const { data } = await instance.post(url, body, config);
      return data;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patch: async (url: string, body?: any, config?: AxiosRequestConfig) => {
      const { data } = await instance.patch(url, body, config);
      return data;
    },
    delete: async (url: string, config?: AxiosRequestConfig) => {
      const { data } = await instance.delete(url, config);
      return data;
    },

    axiosInstance: instance,
  };
})();

export default api;
