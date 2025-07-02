export interface UserMethods {
  activateUser: () => Promise<{ walletId: string; code: string }>;
}
