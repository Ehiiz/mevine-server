import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { Admin } from 'src/core/database/schemas/admin.schema'; // For response typing in Controller

// Regex for password validation: At least 8 characters, one uppercase, one lowercase, one number, one special character
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// Regex for 4-digit passcode/PIN
const pinRegex = /^\d{4}$/;

export class CreateAdminAccountDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class VerifyAdminEmailDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: '4-digit verification code sent to email',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @Matches(pinRegex, { message: 'Verification code must be a 4-digit number' })
  code: string;
}

export class CompleteAdminAccountDto {
  @ApiProperty({
    description: 'Admin first name',
    example: 'Admin',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'User',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description:
      'Admin password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    example: 'AdminP@ss1',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(passwordRegex, {
    message:
      'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
  })
  password: string;

  @ApiProperty({
    description: '4-digit transaction passcode (PIN) for admin actions',
    example: '5678',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Passcode must be a string' })
  @IsNotEmpty({ message: 'Passcode is required' })
  @Matches(pinRegex, { message: 'Passcode must be a 4-digit number' })
  passcode: string;

  @ApiProperty({
    description: 'URL to admin avatar image (optional)',
    example: 'https://example.com/admin_avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Avatar must be a string (URL)' })
  avatar?: string;
}

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address for login',
    example: 'admin@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class AdminForgotPasswordDto {
  @ApiProperty({
    description: 'Admin email address for password reset',
    example: 'admin@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class VerifyAdminPasswordOtpDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: '4-digit password reset OTP sent to admin email',
    example: '2468',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @Matches(pinRegex, { message: 'OTP must be a 4-digit number' })
  code: string;
}

export class AdminPasswordResetDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: '4-digit password reset OTP',
    example: '2468',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @Matches(pinRegex, { message: 'OTP must be a 4-digit number' })
  code: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    example: 'NewAdminP@ss2',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(passwordRegex, {
    message:
      'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
  })
  password: string;
}

export class ChangeAdminPasswordDto {
  @ApiProperty({
    description: 'Current admin password',
    example: 'AdminP@ss1',
  })
  @IsString({ message: 'Old password must be a string' })
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    example: 'NewAdminP@ss2',
    minLength: 8,
  })
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(passwordRegex, {
    message:
      'New password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
  })
  newPassword: string;
}

// Re-using ErrorResponseDto from user-auth.dto.ts or redefine if needed
// Assuming it's imported as needed.

// --- Admin Response DTOs for Swagger (if Admin schema is needed in responses) ---
export class AdminResponseSchema implements Omit<Admin, 'auth'> {
  @ApiProperty({ type: 'string', example: '60c72b2f9b1d8e001c8a1b2d' })
  _id: any;

  @ApiProperty({ type: 'string', example: 'admin@example.com' })
  email: string;

  @ApiProperty({ type: 'string', example: 'Admin' })
  firstName: string;

  @ApiProperty({ type: 'string', example: 'User' })
  lastName: string;

  @ApiProperty({
    type: 'string',
    example: 'https://example.com/admin_avatar.jpg',
    nullable: true,
  })
  avatar: string;
  @ApiProperty({
    type: 'object',
    properties: {
      accountVerified: { type: 'boolean', example: true },
      kycVerified: { type: 'boolean', example: false }, // Omitted in schema, but good to include for response example
      completeSetup: { type: 'boolean', example: true },
    },
  })
  accountStatus: any; // Omit<IAccountStatus, 'kycVerified'>; for Swagger clarity

  @ApiProperty({ type: 'boolean', example: false })
  deleted: boolean;

  @ApiProperty({ type: 'boolean', example: false })
  restricted: boolean;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2023-01-15T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2023-01-15T10:05:00.000Z',
  })
  updatedAt: Date;
}
