import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsEnum,
  IsMongoId,
  IsDateString,
  IsNotEmpty,
  Matches,
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

export class FetchAllAdminTransactionsDto {
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

  @ApiProperty({
    description: 'Filter by transaction status',
    enum: TransactionStatusEnum,
    required: false,
    example: TransactionStatusEnum.completed,
  })
  @IsOptional()
  @IsEnum(TransactionStatusEnum, {
    message: `Status must be one of: ${Object.values(TransactionStatusEnum).join(', ')}`,
  })
  status?: TransactionStatusEnum;

  @ApiProperty({
    description: 'Filter transactions by a specific user ID',
    example: '60c72b2f9b1d8e001c8a1b2d',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid user ID format' })
  userId?: string; // For filtering transactions belonging to a specific user
}

export class FetchAnAdminTransactionParamDto {
  @ApiProperty({
    description: 'ID of the transaction to fetch',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @IsMongoId({ message: 'Invalid transaction ID format' })
  id: string;
}

export class UpdateAdminTransactionStatusDto {
  @ApiProperty({
    description: 'New status for the transaction',
    enum: TransactionStatusEnum,
    example: TransactionStatusEnum.completed,
  })
  @IsEnum(TransactionStatusEnum, {
    message: `Status must be one of: ${Object.values(TransactionStatusEnum).join(', ')}`,
  })
  status: TransactionStatusEnum.processing | TransactionStatusEnum.cancelled;
}

export class SimulateCreditDto {
  /**
   * The amount of the credit transaction.
   * This should be a string representation of a number.
   * @example "8000"
   */
  @ApiProperty({
    description: 'The amount of the credit transaction (as a string).',
    example: '8000',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  // Optional: Add a regex to ensure it's a valid number string if needed
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a valid number string',
  })
  amount: string;

  /**
   * The account number of the recipient (the account being credited).
   * @example "1003500000"
   */
  @ApiProperty({
    description: 'The account number of the recipient.',
    example: '1003500000',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  accountNo: string;

  /**
   * The account number of the sender.
   * Defaults to "5050104070" if not provided in the request.
   * @example "5050104070"
   */
  @ApiProperty({
    description: 'The account number of the sender.',
    example: '5050104070',
    type: String,
    required: false, // Indicates it's optional in the request body
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty() // Still validate if provided
  senderAccountNo?: string; // Made optional with '?'

  /**
   * The bank code of the sender's bank.
   * Defaults to "000002" if not provided in the request.
   * @example "000002"
   */
  @ApiProperty({
    description: "The bank code of the sender's bank.",
    example: '000002',
    type: String,
    required: false, // Indicates it's optional in the request body
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty() // Still validate if provided
  senderBank?: string; // Made optional with '?'

  /**
   * A narration or description for the sender's transaction.
   * @example "Test credit"
   */
  @ApiProperty({
    description: "A narration or description for the sender's transaction.",
    example: 'Test credit',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  senderNarration: string;
}

// Re-using Transaction structure for response definition (from user-transaction.dto.ts or redefine if path differs)
// Assuming Transaction and its related enums are correctly imported.
export class TransactionResponseSchema implements Transaction {
  @ApiProperty({ type: 'string', example: '60c72b2f9b1d8e001c8a1b2d' })
  _id: any;

  @ApiProperty({ type: 'number', example: 1500.75 })
  amount: number;

  @ApiProperty({
    type: 'string',
    example: '60c72b2f9b1d8e001c8a1b2e',
    description: 'User ID',
  })
  user: any;

  @ApiProperty({
    type: 'string',
    enum: TransactionTypeEnum,
    example: TransactionTypeEnum.transfer,
  })
  type: TransactionTypeEnum;

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
  meta: any;

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
  additionalDetails: any[];

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

export class GiftCardResponseDto {
  @ApiProperty({
    example: '60c72b2f9b1d8b001cf8f123',
    description: 'Gift card ID',
  })
  _id: string;

  @ApiProperty({
    example: '60c72b2f9b1d8b001cf8f456',
    description: 'User ID or full user object if populated',
  })
  user: string | any;

  @ApiProperty({
    example: 5000,
    description: 'Gift card amount in base currency',
  })
  amount: number;

  @ApiProperty({
    example: 'Amazon',
    description: 'Type of gift card (e.g., Amazon, iTunes)',
  })
  cardType: string;

  @ApiProperty({
    example: 'AXY-Z45-KPL',
    description: 'Card code for redemption',
  })
  cardCode: string;

  @ApiProperty({
    enum: TransactionStatusEnum,
    description: 'Status of the gift card transaction',
  })
  status: TransactionStatusEnum;

  @ApiProperty({
    required: false,
    example: 'Suspicious redemption pattern',
    description: 'Optional admin notes',
  })
  adminNotes?: string;

  @ApiProperty({
    example: '2025-07-24T12:34:56.789Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-07-25T10:20:30.123Z',
    description: 'Last updated timestamp',
  })
  updatedAt: Date;
}
