import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: ['Email is required'] })
  message: string[] | string;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation successful.' })
  message: string;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({
    type: 'string',
    description: 'Payload data, type varies per endpoint',
  })
  data: any; // Can be more specific with generics if needed
}

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

export interface ITransferKey {
  signature: string;
  reference: string;
}

export enum WebServiceTypeEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum CryptoSettlementStatusEnum {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
}
