import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import {
  ConfirmBankDetailsDto,
  GetBillerListQueryDto,
  GetBillerItemsQueryDto,
  ValidateBillCustomerDto,
  ProcessTransactionDto,
  BankResponse,
  TransferRecipientResponse,
  BillerCategoryResponse,
  BillerResponse,
  BillerItemsResponse,
  CustomerValidateSuccessResponse,
  CryptoFeesResponseDto,
} from './transfer.validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserDocument } from 'src/core/database/schemas/user.schema'; // Adjust path as necessary
import {
  Bank,
  Biller,
  BillerCategory,
  BillerItemsResponseData,
  CustomerValidateResponse,
  TransferRecipientResponseData,
} from 'src/modules/providers/bank/vfd/vfd.interface';
import { Transaction } from 'src/core/database/schemas/transaction.schema';
import { UserTransferService } from './transfer.service';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { ErrorResponseDto } from 'src/core/interfaces/shared.interface';

@ApiTags('User Transfers & Bills')
@Controller('')
@UseGuards(AuthGuard) // All routes in this controller require JWT authentication
@ApiBearerAuth() // Indicates that these endpoints require a bearer token
@ApiExtraModels(BankResponse, TransferRecipientResponse)
export class UserTransferController {
  constructor(private readonly userTransferService: UserTransferService) {}

  @Get('banks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch a list of all supported banks' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of banks fetched successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Bank list fetched successfully.',
            },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/BankResponse' }, // Reference the DTO schema
            },
          },
        },
      },
    },
  })
  async getBanks(): Promise<{ message: string; data: Bank[] }> {
    try {
      const banks = await this.userTransferService.getBanks();
      return {
        message: 'Bank list fetched successfully.',
        data: banks,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('crypto-fees/:currency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get crypto deposit fees and minimum balance information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Crypto fee information fetched successfully.',
    type: CryptoFeesResponseDto, // Reference the new DTO schema for Swagger documentation
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Crypto fees or configuration not found for the specified currency.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred while processing the request.',
  })
  async fetchFees(
    @Param('currency') currency: string,
    @Req() request: Request,
  ): Promise<{ message: string; data: CryptoFeesResponseDto }> {
    try {
      const user = request.user; // Ensure user is typed correctly
      const data = await this.userTransferService.fetchFees(currency, user);
      // The service already returns the DTO, so just return it directly
      return { message: 'Successfully fetched fees details', data };
    } catch (error) {
      // Let NestJS's global exception filter handle the error response (e.g., NotFoundException, InternalServerErrorException)
      throw error;
    }
  }

  @Post('banks/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm bank account details (account name lookup)',
  })
  @ApiBody({ type: ConfirmBankDetailsDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account details confirmed successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Bank details confirmed.' },
            data: { $ref: '#/components/schemas/TransferRecipientResponse' }, // Reference the DTO schema
          },
        },
      },
    },
  })
  async confirmBankDetails(
    @Body() body: ConfirmBankDetailsDto,
  ): Promise<{ message: string; data: TransferRecipientResponse }> {
    try {
      const data = await this.userTransferService.confirmBankDetails(body);
      return {
        message: 'Bank details confirmed.',
        data: {
          accountNumber: data.account.number,
          name: data.name,
          bank: data.bank,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('billers/categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch a list of biller categories (e.g., Electricity, Airtime)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Biller categories fetched successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Biller categories fetched successfully.',
            },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/BillerCategoryResponse' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Biller categories cannot be found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  async getBillers(): Promise<{ message: string; data: BillerCategory[] }> {
    try {
      const data = await this.userTransferService.getBillers();
      return {
        message: 'Biller categories fetched successfully.',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('billers/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch a list of billers by category (e.g., MTN, DSTV, EKEDC)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Optional category name to filter billers',
    example: 'Electricity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Biller list fetched successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Biller list fetched successfully.',
            },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/BillerResponse' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Biller list cannot be fetched for the given category.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  async getBillerList(
    @Query() query: GetBillerListQueryDto,
  ): Promise<{ message: string; data: Biller[] }> {
    try {
      const data = await this.userTransferService.getBillerList(query);
      return {
        message: 'Biller list fetched successfully.',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('billers/items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Fetch available payment items for a specific biller (e.g., plan types, meter types)',
  })
  @ApiQuery({ name: 'billerId', type: String, example: '25' })
  @ApiQuery({ name: 'divisionId', type: String, example: '1' })
  @ApiQuery({ name: 'productId', type: String, example: '150' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Biller items fetched successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Biller items fetched successfully.',
            },
            data: { $ref: '#/components/schemas/BillerItemsResponse' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Biller items cannot be fetched for the provided criteria.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for query parameters.',
    type: ErrorResponseDto,
  })
  async getBillerItems(
    @Query() query: GetBillerItemsQueryDto,
  ): Promise<{ message: string; data: BillerItemsResponseData }> {
    try {
      const data = await this.userTransferService.getBillerItems(query);
      return {
        message: 'Biller items fetched successfully.',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('billers/validate-customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Validate a customer ID for a specific biller (e.g., meter number, smartcard number)',
  })
  @ApiBody({ type: ValidateBillCustomerDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer ID validated successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Customer validated successfully.',
            },
            data: {
              $ref: '#/components/schemas/CustomerValidateSuccessResponse',
            }, // Reference the DTO schema
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer ID could not be validated.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for customer details.',
    type: ErrorResponseDto,
  })
  async validateBillCustomer(
    @Body() body: ValidateBillCustomerDto,
  ): Promise<{ message: string; data: CustomerValidateResponse }> {
    try {
      const data = await this.userTransferService.validateBillCustomer(body);
      return {
        message: 'Customer validated successfully.',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process a financial transaction (funds transfer or bill payment)',
  })
  @ApiBody({ type: ProcessTransactionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction processed successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Transaction successful.' },
            data: { $ref: '#/components/schemas/TransactionDetailsResponse' }, // Reference the DTO schema
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid transaction PIN or unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Required data (e.g., recipient, biller item) not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Validation failed for transaction details or invalid service type.',
    type: ErrorResponseDto,
  })
  async processTransaction(
    @Body() body: Omit<ProcessTransactionDto, 'user'>, // 'user' is injected by AuthGuard
    @Req() request: Request,
  ): Promise<{ message: string; data: Transaction }> {
    try {
      const user: UserDocument = request.user;
      const transaction = await this.userTransferService.processTransaction({
        user,
        ...body,
      });
      return {
        message: 'Transaction successful.',
        data: transaction,
      };
    } catch (error) {
      throw error;
    }
  }
}
