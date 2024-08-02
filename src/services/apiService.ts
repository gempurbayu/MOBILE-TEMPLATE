import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { ISession } from "../model/sessionModel";
import { BASE_URL } from "../utils/constant";

const ApiService = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
  });

  instance.interceptors.request.use(async (request) => {
    try {
      const sessionString = await SecureStore.getItemAsync("session");
      const session: ISession | null = sessionString
        ? JSON.parse(sessionString)
        : null;

      if (session && session.token) {
        request.headers.Authorization = `Bearer ${session.token}`;
      }
    } catch (error) {
      console.error("Failed to get session", error);
    }

    return request;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const sessionString = await SecureStore.getItemAsync("session");
          const session: ISession | null = sessionString
            ? JSON.parse(sessionString)
            : null;

          if (session) {
            const { data } = await axios.post(
              `${BASE_URL}/Account/refresh-access-token`,
              {
                token: session.token,
                refreshToken: session.refreshToken,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const newSession = {
              ...session,
              token: data.token || session.token,
              refreshToken: data.refreshToken || session.refreshToken,
            };

            await SecureStore.setItemAsync(
              "session",
              JSON.stringify(newSession)
            );
            originalRequest.headers.Authorization = `Bearer ${newSession.token}`;

            return instance(originalRequest);
          } else {
            await SecureStore.deleteItemAsync("session");
            router.replace("login");
          }
        } catch (refreshError) {
          console.error("Failed to refresh token", refreshError);
          await SecureStore.deleteItemAsync("session");
          router.replace("login");
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const httpClient = ApiService();
