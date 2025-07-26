import {
  Controller,
  Get,
  Query,
  Param,
  Patch, // For update status
  Body, // For update status
  HttpCode,
  HttpStatus,
  UseGuards,
  Post,
} from '@nestjs/common';
import { AdminTransactionService } from './admin-transaction.service';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Transaction } from 'src/core/database/schemas/transaction.schema'; // Import Transaction schema for typing
import mongoose from 'mongoose'; // For mongoose.Types.ObjectId
import { AuthGuard } from 'src/core/guards/auth.guard';
import {
  ErrorResponseDto,
  WebServiceTypeEnum,
} from 'src/core/interfaces/shared.interface';
import {
  TransactionTypeEnum,
  ServiceTypeEnum,
  TransactionStatusEnum,
} from 'src/core/interfaces/transaction.interface';
import {
  FetchAllAdminTransactionsDto,
  FetchAnAdminTransactionParamDto,
  GiftCardResponseDto,
  SimulateCreditDto,
  TransactionResponseSchema,
  UpdateAdminGiftCardTransactionStatusDto,
  UpdateAdminTransactionStatusDto,
} from './admin-transaction.validator';
import { ServiceDecorator } from 'src/core/decorators/auth.decorator';

@ApiTags('Admin Transactions')
@Controller('')
@ApiExtraModels(TransactionResponseSchema)
@ServiceDecorator(WebServiceTypeEnum.ADMIN)
@UseGuards(AuthGuard) // All routes in this controller require JWT authentication for admins
@ApiBearerAuth() // Indicates that these endpoints require a bearer token
export class AdminTransactionController {
  constructor(
    private readonly adminTransactionService: AdminTransactionService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Fetch all transactions with pagination and filters (Admin access)',
  })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionTypeEnum,
    example: TransactionTypeEnum.transfer,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'mobile top-up',
  })
  @ApiQuery({
    name: 'service',
    required: false,
    enum: ServiceTypeEnum,
    example: ServiceTypeEnum.airtime,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    format: 'date',
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TransactionStatusEnum,
    example: TransactionStatusEnum.completed,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by specific user ID',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transactions fetched successfully for admin.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Transactions fetched successfully.',
            },
            data: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 5 },
                count: { type: 'number', example: 45 },
                sum: { type: 'number', example: 15000.75, format: 'float' },
                transactions: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/TransactionResponseSchema',
                  },
                },
              },
            },
          },
        },
      },
    },
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
  async fetchAllTransactions(
    @Query() query: FetchAllAdminTransactionsDto,
  ): Promise<{
    message: string;
    data: {
      currentPage: number;
      totalPages: number;
      transactions: Transaction[];
      count: number;
      sum: number;
    };
  }> {
    try {
      // Convert userId string to ObjectId if present, as service expects mongoose.Types.ObjectId
      const serviceBody: any = { ...query };
      if (query.userId) {
        serviceBody.id = new mongoose.Types.ObjectId(query.userId);
      } else {
        delete serviceBody.id; // Ensure 'id' is not passed if userId is not provided
      }

      const data =
        await this.adminTransactionService.fetchAllTransactions(serviceBody);
      return {
        message: 'Transactions fetched successfully.',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('giftcards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Fetch all transactions with pagination and filters (Admin access)',
  })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10 })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    format: 'date',
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TransactionStatusEnum,
    example: TransactionStatusEnum.completed,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by specific user ID',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transactions fetched successfully for admin.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Transactions fetched successfully.',
            },
            data: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 5 },
                count: { type: 'number', example: 45 },
                sum: { type: 'number', example: 15000.75, format: 'float' },
                transactions: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/TransactionResponseSchema',
                  },
                },
              },
            },
          },
        },
      },
    },
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
  async fetchAllGiftCards(
    @Query() query: FetchAllAdminTransactionsDto,
  ): Promise<{
    message: string;
    data: {
      currentPage: number;
      totalPages: number;
      transactions: GiftCardResponseDto[];
      count: number;
      sum: number;
    };
  }> {
    try {
      // Convert userId string to ObjectId if present, as service expects mongoose.Types.ObjectId
      const serviceBody: any = { ...query };
      if (query.userId) {
        serviceBody.id = new mongoose.Types.ObjectId(query.userId);
      } else {
        delete serviceBody.id; // Ensure 'id' is not passed if userId is not provided
      }

      const data =
        await this.adminTransactionService.fetchAllGiftCardTransactions({
          ...serviceBody,
          service: ServiceTypeEnum.giftcard, // Ensure service is set to giftcard
        });
      return {
        message: 'Giftcard Transactions fetched successfully.',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('giftcards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch a single transaction by its ID (Admin access)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the transaction',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction details fetched successfully for admin.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Transaction fetched successfully.',
            },
            data: {
              $ref: '#/components/schemas/GiftCardResponseDto',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transaction ID format.',
    type: ErrorResponseDto,
  })
  async fetchAGiftCard(
    @Param() params: FetchAnAdminTransactionParamDto,
  ): Promise<{ message: string; data: GiftCardResponseDto }> {
    try {
      const data = await this.adminTransactionService.fetchAGiftCard(params);
      return {
        message: 'Giftcard fetched successfully.',
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch('giftcards/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update the status of a specific transaction by ID (Admin access)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the transaction to update',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiBody({ type: UpdateAdminTransactionStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction status updated successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Transaction status updated successfully.',
            },
            data: {
              type: 'object',
              properties: {
                transaction: {
                  $ref: '#/components/schemas/TransactionResponseSchema',
                },
              },
            },
          },
        },
      },
    },
  })
  async updateAGiftCardTransactionStatus(
    @Param() params: FetchAnAdminTransactionParamDto, // Re-use ID param DTO
    @Body() body: UpdateAdminGiftCardTransactionStatusDto,
  ): Promise<{ message: string; data: { transaction: Transaction } }> {
    try {
      const { transaction } =
        await this.adminTransactionService.updateAGiftCardTransactionStatus({
          id: params.id,
          status: body.status,
        });
      return {
        message: 'Transaction status updated successfully.',
        data: { transaction },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch a single transaction by its ID (Admin access)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the transaction',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction details fetched successfully for admin.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Transaction fetched successfully.',
            },
            data: {
              type: 'object',
              properties: {
                transaction: {
                  $ref: '#/components/schemas/TransactionResponseSchema',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transaction ID format.',
    type: ErrorResponseDto,
  })
  async fetchATransaction(
    @Param() params: FetchAnAdminTransactionParamDto,
  ): Promise<{ message: string; data: { transaction: Transaction } }> {
    try {
      const { transaction } =
        await this.adminTransactionService.fetchATransaction(params);
      return {
        message: 'Transaction fetched successfully.',
        data: { transaction },
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update the status of a specific transaction by ID (Admin access)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the transaction to update',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiBody({ type: UpdateAdminTransactionStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction status updated successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Transaction status updated successfully.',
            },
            data: {
              type: 'object',
              properties: {
                transaction: {
                  $ref: '#/components/schemas/TransactionResponseSchema',
                },
              },
            },
          },
        },
      },
    },
  })
  async updateATransactionStatus(
    @Param() params: FetchAnAdminTransactionParamDto, // Re-use ID param DTO
    @Body() body: UpdateAdminTransactionStatusDto,
  ): Promise<{ message: string; data: { transaction: Transaction } }> {
    try {
      const { transaction } =
        await this.adminTransactionService.updateATransactionStatus({
          id: params.id,
          status: body.status,
        });
      return {
        message: 'Transaction status updated successfully.',
        data: { transaction },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('simulate-credit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate credit to a user account',
  })
  @ApiBody({ type: SimulateCreditDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account balance updated successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Account balance updated successfully',
            },
            data: {
              type: 'object',
              properties: {
                previousBalance: {
                  type: 'string',
                  example: '2000',
                },
                newBalance: {
                  type: 'string',
                  example: '20000',
                },
                accountNumber: {
                  type: 'string',
                  example: '208976511212',
                },
              },
            },
          },
        },
      },
    },
  })
  async simulateCredit(@Body() body: SimulateCreditDto): Promise<{
    message: string;
    data: {
      previousBalance: string;
      newBalance: string;
      accountNumber: string;
    };
  }> {
    try {
      const data =
        await this.adminTransactionService.simulateCreditAccount(body);
      return {
        message: 'Transaction status updated successfully.',
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
