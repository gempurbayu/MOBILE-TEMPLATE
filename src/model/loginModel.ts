export interface ILoginPayload {
  emailOrUsername: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  refreshToken: string;
}
