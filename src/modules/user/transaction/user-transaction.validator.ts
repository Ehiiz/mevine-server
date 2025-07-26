import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsEnum,
  IsMongoId,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Transaction, // Import Transaction schema for response typing
} from 'src/core/database/schemas/transaction.schema'; // Adjust path as necessary
import {
  TransactionTypeEnum,
  ServiceTypeEnum,
  TransactionStatusEnum,
} from 'src/core/interfaces/transaction.interface';

export class FetchAllTransactionsDto {
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
    description: 'Number of transactions per page',
    example: 10,
    default: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit: number;

  @ApiProperty({
    description: 'Filter by transaction type',
    enum: TransactionTypeEnum,
    required: false,
    example: TransactionTypeEnum.transfer,
  })
  @IsOptional()
  @IsEnum(TransactionTypeEnum, {
    message: `Type must be one of: ${Object.values(TransactionTypeEnum).join(', ')}`,
  })
  type?: TransactionTypeEnum;

  @ApiProperty({
    description:
      'Search string for transaction details (e.g., entity name, number)',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @ApiProperty({
    description: 'Filter by service type',
    enum: ServiceTypeEnum,
    required: false,
    example: ServiceTypeEnum.airtime,
  })
  @IsOptional()
  @IsEnum(ServiceTypeEnum, {
    message: `Service must be one of: ${Object.values(ServiceTypeEnum).join(', ')}`,
  })
  service?: ServiceTypeEnum;

  @ApiProperty({
    description: 'Filter transactions from a specific date (YYYY-MM-DD)',
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
    description: 'Filter transactions up to a specific date (YYYY-MM-DD)',
    example: '2023-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'To date must be a valid date string (YYYY-MM-DD)' },
  )
  to?: string;

  // The 'id' property in the service is likely for internal use or a specific type of query,
  // not directly exposed as a query parameter for fetching *all* transactions by a specific ID.
  // If it's meant to filter by user ID, it should be derived from the authenticated user.
  // If it's meant to fetch a *single* transaction by ID, that's a separate endpoint.
}

export class FetchATransactionParamDto {
  @ApiProperty({
    description: 'ID of the transaction to fetch',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @IsMongoId({ message: 'Invalid transaction ID format' })
  id: string;
}

// --- Response Schemas for Swagger ---

// This structure mirrors your Transaction schema for Swagger documentation clarity
class TransactionResponseSchema implements Transaction {
  @ApiProperty({ type: 'string', example: '60c72b2f9b1d8e001c8a1b2d' })
  _id: any; // mongoose.Types.ObjectId as string for Swagger

  @ApiProperty({ type: 'number', example: 1500.75 })
  amount: number;

  @ApiProperty({
    type: 'string',
    example: '60c72b2f9b1d8e001c8a1b2e',
    description: 'User ID',
  })
  user: any; // User as string for Swagger

  @ApiProperty({
    type: 'string',
    enum: TransactionTypeEnum,
    example: TransactionTypeEnum.transfer,
  })
  type: TransactionTypeEnum;

  @ApiProperty({
    type: 'string',
    example: 'TX123456789',
  })
  reference: string;

  @ApiProperty({
    type: 'string',
    enum: TransactionStatusEnum,
    example: TransactionStatusEnum.completed,
  })
  status: TransactionStatusEnum;

  @ApiProperty({
    type: 'string',
    enum: ServiceTypeEnum,
    example: ServiceTypeEnum.airtime,
  })
  service: ServiceTypeEnum;

  @ApiProperty({
    type: 'object',
    properties: {
      paidFrom: {
        type: 'object',
        properties: {
          entityId: { type: 'string', example: '60c72b2f9b1d8e001c8a1b2e' },
          entityType: { type: 'string', example: 'user' },
          entityCode: { type: 'string', example: '044' },
          entityNumber: { type: 'string', example: '08012345678' },
          entityName: { type: 'string', example: 'John Doe' },
        },
      },
      paidTo: {
        type: 'object',
        properties: {
          entityId: { type: 'string', example: 'external_id_123' },
          entityType: { type: 'string', example: 'airtime' },
          entityCode: { type: 'string', example: 'MTN_200' },
          entityNumber: { type: 'string', example: '09098765432' },
          entityName: { type: 'string', example: 'MTN Airtime' },
        },
      },
    },
  })
  meta: any; // IMetaInfo as object for Swagger

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'info' },
        info: { type: 'string', example: 'Transaction successful' },
      },
    },
  })
  additionalDetails: any[]; // IExtraInfo[] as array for Swagger

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
