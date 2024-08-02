import { IAccount } from "./accountModel";
import { ILoginResponse } from "./loginModel";

export interface ISession extends ILoginResponse {
  account?: IAccount;
}
