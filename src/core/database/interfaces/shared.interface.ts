export interface IAuth {
  password: string | null;
  transactionPin: string | null;
  accountVerificationToken: string | null;
  passwordResetToken: string | null;
  verificationTokenExpiration: Date | null;
  tokenExpiration: Date | null;
  loginVerificationToken: string | null;
  loginTokenExpiration: Date | null;
}

export interface IAccountStatus {
  accountVerified: boolean;
  kycVerified: boolean;
  completeSetup: boolean;
}
