import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Matches,
} from 'class-validator';
import {
  ServiceTypeEnum,
  TransactionTypeEnum,
  TransactionStatusEnum,
} from 'src/core/database/interfaces/transaction.interface';
import {
  Transaction, // For response typing in Controller
} from 'src/core/database/schemas/transaction.schema';
import {
  Bank,
  BillerCategory,
  Biller,
  BillerItemsResponseData,
  CustomerValidateResponse,
  TransferRecipientResponseData,
} from 'src/modules/providers/bank/vfd/vfd.interface';

// Regex for 4-digit transaction PIN
const pinRegex = /^\d{4}$/;

export class ConfirmBankDetailsDto {
  @ApiProperty({
    description: 'Account number to confirm',
    example: '0012345678',
  })
  @IsString({ message: 'Account number must be a string' })
  @IsNotEmpty({ message: 'Account number is required' })
  accountNo: string;

  @ApiProperty({
    description: 'Bank code (e.g., from /banks endpoint)',
    example: '044',
  })
  @IsString({ message: 'Bank code must be a string' })
  @IsNotEmpty({ message: 'Bank code is required' })
  bank: string; // This corresponds to bankCode in VFD service
}

export class GetBillerListQueryDto {
  @ApiProperty({
    description: 'Category name to filter billers',
    example: 'Electricity',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @IsNotEmpty({ message: 'Category cannot be empty if provided' })
  category?: string;
}

export class GetBillerItemsQueryDto {
  @ApiProperty({
    description: 'ID of the biller',
    example: '25',
  })
  @IsString({ message: 'Biller ID must be a string' })
  @IsNotEmpty({ message: 'Biller ID is required' })
  billerId: string;

  @ApiProperty({
    description: 'Division ID for the biller (from billerList.division)',
    example: '1',
  })
  @IsString({ message: 'Division ID must be a string' })
  @IsNotEmpty({ message: 'Division ID is required' })
  divisionId: string;

  @ApiProperty({
    description: 'Product ID for the biller (from billerList.product)',
    example: '150',
  })
  @IsString({ message: 'Product ID must be a string' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;
}

export class ValidateBillCustomerDto {
  @ApiProperty({
    description: 'ID of the biller',
    example: '25',
  })
  @IsString({ message: 'Biller ID must be a string' })
  @IsNotEmpty({ message: 'Biller ID is required' })
  billerId: string;

  @ApiProperty({
    description: 'Division ID for the biller',
    example: '1',
  })
  @IsString({ message: 'Division ID must be a string' })
  @IsNotEmpty({ message: 'Division ID is required' })
  divisionId: string;

  @ApiProperty({
    description: 'Payment item code (from billerItems.paymentCode)',
    example: 'EKEDC_PHC',
  })
  @IsString({ message: 'Payment item must be a string' })
  @IsNotEmpty({ message: 'Payment item is required' })
  paymentItem: string;

  @ApiProperty({
    description: 'Customer identifier (e.g., meter number, phone number)',
    example: '01234567890',
  })
  @IsString({ message: 'Customer ID must be a string' })
  @IsNotEmpty({ message: 'Customer ID is required' })
  customerId: string;
}

export class ProcessTransactionDto {
  @ApiProperty({
    description: '4-digit transaction PIN',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Transaction PIN must be a string' })
  @IsNotEmpty({ message: 'Transaction PIN is required' })
  @Matches(pinRegex, { message: 'Transaction PIN must be a 4-digit number' })
  transactionPin: string;

  @ApiProperty({
    description: 'Type of service for the transaction',
    enum: ServiceTypeEnum,
    example: ServiceTypeEnum.transfer,
  })
  @IsEnum(ServiceTypeEnum, {
    message: `Service must be one of: ${Object.values(ServiceTypeEnum).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Service type is required' })
  service: ServiceTypeEnum;

  @ApiProperty({
    description: 'Amount of the transaction',
    example: 5000.0,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount cannot be negative' })
  amount: number;

  @ApiProperty({
    description: 'Remarks or description for the transaction',
    example: 'Payment for utilities',
  })
  @IsString({ message: 'Remark must be a string' })
  @IsNotEmpty({ message: 'Remark is required' })
  remark: string;

  @ApiProperty({
    description: 'Division ID (required for bill payments)',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Division must be a string' })
  division?: string;

  @ApiProperty({
    description: 'Payment Item (required for bill payments)',
    example: 'EKEDC_PREPAID',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Payment item must be a string' })
  paymentItem?: string;

  @ApiProperty({
    description: 'Product ID (required for bill payments)',
    example: '150',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Product ID must be a string' })
  productId?: string;

  @ApiProperty({
    description: 'Biller ID (required for bill payments)',
    example: '25',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Biller ID must be a string' })
  billerId?: string;

  @ApiProperty({
    description: 'Phone number (required for airtime/data/cable)',
    example: '08012345678',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Account number (required for transfers)',
    example: '0012345678',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Account number must be a string' })
  accountNumber?: string;

  @ApiProperty({
    description: 'Bank name (required for transfers)',
    example: 'VFD Bank',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Bank name must be a string' })
  bankName?: string;

  @ApiProperty({
    description: 'Bank code (required for transfers)',
    example: '044',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Bank code must be a string' })
  bankCode?: string;

  @ApiProperty({
    description: 'Customer Name (e.g., for bill validation)',
    example: 'JOHN DOE',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Customer name must be a string' })
  customerName?: string;

  @ApiProperty({
    description: 'Customer ID (e.g., meter number for electricity)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Customer ID must be a string' })
  customerId?: string;
}

// --- Response Schemas (for Swagger documentation clarity) ---

// Define example structures for interfaces from vfd.interface
export class BankResponse implements Bank {
  @ApiProperty({ type: 'string', example: 'Access Bank' })
  bankName: string;
  @ApiProperty({ type: 'string', example: '044' })
  bankCode: string;
}

export class TransferRecipientResponse
  implements TransferRecipientResponseData
{
  @ApiProperty({ type: 'string', example: 'JOHN DOE' })
  name: string;
  @ApiProperty({ type: 'string', example: 'CLT12345' })
  clientId: string;
  @ApiProperty({ type: 'string', example: '221122334455', required: false })
  bvn?: string;
  @ApiProperty({
    type: 'object',
    properties: {
      number: { type: 'string', example: '0012345678' },
      id: { type: 'string', example: 'ACC98765' },
    },
  })
  account: { number: string; id: string };
  @ApiProperty({ type: 'string', example: 'active' })
  status: string;
  @ApiProperty({ type: 'string', example: 'NGN' })
  currency: string;
  @ApiProperty({ type: 'string', example: 'VFD Bank' })
  bank: string;
}

export class BillerCategoryResponse implements BillerCategory {
  @ApiProperty({ type: 'string', example: 'Electricity' })
  category: string;
}

export class BillerResponse implements Biller {
  @ApiProperty({ type: 'string', example: '25' })
  id: string;
  @ApiProperty({ type: 'string', example: 'Eko Electric' })
  name: string;
  @ApiProperty({ type: 'string', example: 'Prepaid' })
  division: string;
  @ApiProperty({ type: 'string', example: 'EKEDC_PREPAID' })
  product: string;
  @ApiProperty({ type: 'string', example: 'Electricity' })
  category: string;
  @ApiProperty({ type: 'string', example: '30', required: false })
  convenienceFee?: string;
}

export class BillerItemResponse {
  @ApiProperty({ type: 'string', example: '1' })
  id: string;
  @ApiProperty({ type: 'string', example: '25' })
  billerid: string;
  @ApiProperty({ type: 'string', example: '0' })
  amount: string;
  @ApiProperty({ type: 'string', example: '2' })
  code: string;
  @ApiProperty({ type: 'string', example: 'Eko Prepaid' })
  paymentitemname: string;
  @ApiProperty({ type: 'string', example: '150' })
  productId: string;
  @ApiProperty({ type: 'string', example: 'EKEDC_PREPAID' })
  paymentitemid: string;
  @ApiProperty({ type: 'string', example: '₦' })
  currencySymbol: string;
  @ApiProperty({ type: 'string', example: 'false' })
  isAmountFixed: string;
  @ApiProperty({ type: 'string', example: '0' })
  itemFee: string;
  @ApiProperty({ type: 'string', example: '₦' })
  itemCurrencySymbol: string;
  @ApiProperty({ type: 'string', example: 'some_id' })
  pictureId: string;
  @ApiProperty({ type: 'string', example: 'EKEDC_PREPAID' })
  paymentCode: string;
  @ApiProperty({ type: 'string', example: '1' })
  sortOrder: string;
  @ApiProperty({ type: 'string', example: 'Electricity' })
  billerType: string;
  @ApiProperty({ type: 'string', example: 'PD_EKEDC' })
  payDirectitemCode: string;
  @ApiProperty({ type: 'string', example: 'NGN' })
  currencyCode: string;
  @ApiProperty({ type: 'string', example: 'Prepaid' })
  division: string;
  @ApiProperty({ type: 'string', example: 'CAT_ELEC' })
  categoryid: string;
  @ApiProperty({ type: 'string', example: '2022-10-18 10:11:43' })
  createdDate: string;
}

export class BillerItemsResponse implements BillerItemsResponseData {
  @ApiProperty({ type: [BillerItemResponse] })
  paymentitems: BillerItemResponse[];
}

export class CustomerValidateSuccessResponse
  implements CustomerValidateResponse
{
  @ApiProperty({
    type: 'object',
    properties: {},
    description: 'Empty object for success',
    example: {},
  })
  data: {};
  @ApiProperty({ type: 'string', example: '00' })
  status: string;
  @ApiProperty({ type: 'string', example: 'Customer validation successful' })
  message: string;
}

class TransactionDetailsResponse implements Transaction {
  @ApiProperty({ type: 'string', example: '60c72b2f9b1d8e001c8a1b2d' })
  _id: any;
  @ApiProperty({ type: 'number', example: 1000 })
  amount: number;
  @ApiProperty({ type: 'string', example: '60c72b2f9b1d8e001c8a1b2e' })
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
    example: ServiceTypeEnum.transfer,
  })
  service: ServiceTypeEnum;
  @ApiProperty({
    type: 'object',
    properties: {
      paidFrom: {
        type: 'object',
        properties: {
          entityId: { type: 'string', example: 'user_id_from' },
          entityType: { type: 'string', example: 'user' },
          entityNumber: { type: 'string', example: '08012345678' },
          entityCode: { type: 'string', example: '044' },
          entityName: { type: 'string', example: 'Sender Bank Name' },
        },
      },
      paidTo: {
        type: 'object',
        properties: {
          entityId: { type: 'string', example: 'recipient_id' },
          entityType: { type: 'string', example: 'user' },
          entityNumber: { type: 'string', example: '07098765432' },
          entityCode: { type: 'string', example: '033' },
          entityName: { type: 'string', example: 'Recipient Bank Name' },
        },
      },
    },
  })
  meta: any;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: { title: { type: 'string' }, info: { type: 'string' } },
    },
    required: false,
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
