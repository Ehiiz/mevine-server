export interface UserMethods {
  activateUser(): { walletId: string; code: string };
}
