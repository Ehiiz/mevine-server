export interface IAuth {
  password: string;
  transactionPin: string;
  accountVerificationToken: string;
  passwordResetToken: string;
  verificationTokenExpiration: Date;
  tokenExpiration: Date;
}

export interface IAccountStatus {
  accountVerified: boolean;
  kycVerified: boolean;
}
