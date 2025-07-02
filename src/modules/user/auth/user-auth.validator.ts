import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

// Regex for password validation: At least 8 characters, one uppercase, one lowercase, one number, one special character
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// Regex for 4-digit passcode/PIN
const pinRegex = /^\d{4}$/;

export class CreateAccountDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User location (e.g., country, city)',
    example: 'Lagos, Nigeria',
  })
  @IsString({ message: 'Location must be a string' })
  @IsNotEmpty({ message: 'Location is required' })
  location: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
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

export class CompleteAccountDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description:
      'User password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    example: 'StrongP@ss1',
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
    description: '4-digit transaction passcode (PIN)',
    example: '5678',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'Passcode must be a string' })
  @IsNotEmpty({ message: 'Passcode is required' })
  @Matches(pinRegex, { message: 'Passcode must be a 4-digit number' })
  passcode: string;

  @ApiProperty({
    description: 'User phone number (e.g., +2348012345678)',
    example: '+2348012345678',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  // A more robust phone number validation regex could be used here
  phoneNumber: string;

  @ApiProperty({
    description: 'URL to user avatar image (optional)',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Avatar must be a string (URL)' })
  avatar?: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class VerifyLoginCodeDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: '4-digit login verification code',
    example: '9876',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @Matches(pinRegex, { message: 'Login code must be a 4-digit number' })
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address for password reset',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class VerifyPasswordOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
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
}

export class PasswordResetDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
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
    example: 'NewStrongP@ss2',
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

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current user password',
    example: 'StrongP@ss1',
  })
  @IsString({ message: 'Old password must be a string' })
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    example: 'NewStrongP@ss2',
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

export class ChangeTransactionPinDto {
  @ApiProperty({
    description: 'Current 4-digit transaction PIN',
    example: '5678',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Old PIN must be a string' })
  @IsNotEmpty({ message: 'Old PIN is required' })
  @Matches(pinRegex, { message: 'Old PIN must be a 4-digit number' })
  oldPin: string;

  @ApiProperty({
    description: 'New 4-digit transaction PIN',
    example: '1122',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'New PIN must be a string' })
  @IsNotEmpty({ message: 'New PIN is required' })
  @Matches(pinRegex, { message: 'New PIN must be a 4-digit number' })
  newPin: string;
}

// --- Response DTOs for Swagger ---
