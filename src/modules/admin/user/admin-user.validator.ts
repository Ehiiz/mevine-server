import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
  IsMongoId,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { User } from 'src/core/database/schemas/user.schema'; // Import User schema for response typing
import { ICryptoDetails } from 'src/core/interfaces/user.interface';

export const TransformStringToBoolean = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) return value;

    // Handle string values (from query params)
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true' || lowerValue === '1') return true;
      if (lowerValue === 'false' || lowerValue === '0') return false;
    }

    // Handle boolean values (already boolean)
    if (typeof value === 'boolean') return value;

    // Handle numeric values
    if (typeof value === 'number') {
      return value !== 0;
    }

    // Return original value for validation to handle
    return value;
  });

export class FetchUsersQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page: number;

  @ApiProperty({
    description: 'Number of users per page',
    example: 10,
    default: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit: number;

  @ApiProperty({
    description: 'Filter users created from a specific date (YYYY-MM-DD)',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'From date must be a valid date string (YYYY-MM-DD)' },
  )
  from?: string;

  @ApiProperty({
    description: 'Filter users created up to a specific date (YYYY-MM-DD)',
    example: '2023-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'To date must be a valid date string (YYYY-MM-DD)' },
  )
  to?: string;

  @ApiProperty({
    description: 'Search string for user details (name, email, account number)',
    example: 'john',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @ApiProperty({
    description:
      'Filter by account status (true for completed users, false for non-banned)',
    example: true,
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @TransformStringToBoolean()
  @IsBoolean({ message: 'Complete account must be a boolean value' })
  completeAccount?: boolean;

  @ApiProperty({
    description:
      'Filter by restricted status (true for banned users, false for non-banned)',
    example: true,
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @TransformStringToBoolean()
  @IsBoolean({ message: 'Restricted must be a boolean value' })
  restricted?: boolean;
}

export class UserIdParamDto {
  @ApiProperty({
    description: 'ID of the user',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @IsMongoId({ message: 'Invalid user ID format' })
  id: string;
}

// Re-using UserResponseSchema for Swagger (similar to previous user-auth or user-profile DTOs)
export class UserResponseSchema
  implements Omit<User, 'activateUser' | 'auth' | 'wallet'>
{
  @ApiProperty({ type: 'string', example: '60c72b2f9b1d8e001c8a1b2d' })
  _id: any;

  @ApiProperty({ type: 'string', example: 'user@example.com' })
  email: string;

  @ApiProperty({ type: 'string', example: '+2348012345678', nullable: true })
  phoneNumber: string;

  @ApiProperty({ type: 'string', example: 'John' })
  firstName: string;

  @ApiProperty({ type: 'string', example: 'Doe' })
  lastName: string;

  @ApiProperty({ type: 'string', example: 'Lagos, Nigeria' })
  location: string;

  @ApiProperty({
    type: 'string',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatar: string;

  @ApiProperty({
    type: 'object',
    properties: {
      accountVerified: { type: 'boolean', example: true },
      kycVerified: { type: 'boolean', example: false },
      completeSetup: { type: 'boolean', example: true },
    },
  })
  accountStatus: any;

  @ApiProperty({ type: 'string', example: 'someFcmToken', nullable: true })
  fcmToken: string;

  @ApiProperty({ type: 'string', example: 'someFcmToken', nullable: true })
  quidaxId: string;

  @ApiProperty({
    type: 'object',
    properties: {
      accountNumber: { type: 'string', example: '0123456789' },
      bankName: { type: 'string', example: 'VFD Bank' },
      bankCode: { type: 'string', example: '999999' },
    },
    nullable: true,
  })
  bankDetails: any;

  @ApiProperty({
    type: 'object', // Changed from 'array' to 'object'
    // This indicates that the object can have arbitrary string keys
    // and each value will conform to the specified schema.
    additionalProperties: {
      type: 'object',
      properties: {
        address: { type: 'string', example: '0x123...' },
        set: { type: 'boolean', example: true },
      },
    },
    example: {
      ethereum: { address: '0x1234567890abcdef', set: true },
      bitcoin: { address: '', set: false },
      usdt: { address: 'TRX_USDT_ADDRESS', set: false },
    },
    description:
      'A map of cryptocurrency addresses, keyed by blockchain symbol.',
    nullable: true,
  })
  cryptoAddresses: Map<string, ICryptoDetails>;

  @ApiProperty({ type: 'boolean', example: false })
  deleted: boolean;

  @ApiProperty({ type: 'boolean', example: false })
  restricted: boolean;

  @ApiProperty({ type: 'string', example: 'XYZ123', nullable: true })
  referralCode: string;

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

export class FormattedUserSchema {
  @ApiProperty({ type: 'string', example: 'John' })
  name: string;

  @ApiProperty({ type: 'string', example: 'user@example.com' })
  email: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2023-01-15T10:05:00.000Z',
  })
  joinedDate: Date;

  @ApiProperty({ type: 'boolean', example: false })
  status: boolean;

  @ApiProperty({ type: 'string', example: '2081790324' })
  accountNumber: string;

  @ApiProperty({ type: 'boolean', example: false })
  kycVerified: boolean;
}
