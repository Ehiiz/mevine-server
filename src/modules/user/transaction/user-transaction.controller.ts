import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserTransactionService } from './user-transaction.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Transaction } from 'src/core/database/schemas/transaction.schema'; // Import Transaction schema for typing
import { AuthGuard } from 'src/core/guards/auth.guard';
import {
  TransactionTypeEnum,
  ServiceTypeEnum,
} from 'src/core/database/interfaces/transaction.interface';
import {
  FetchAllTransactionsDto,
  FetchATransactionParamDto,
} from './user-transaction.validator';
import { ErrorResponseDto } from 'src/core/database/interfaces/shared.interface';

@ApiTags('User Transactions')
@Controller()
@UseGuards(AuthGuard) // All routes in this controller require JWT authentication
@ApiBearerAuth() // Indicates that these endpoints require a bearer token
export class UserTransactionController {
  constructor(
    private readonly userTransactionService: UserTransactionService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Fetch all transactions for the authenticated user with pagination and filters',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transactions fetched successfully.',
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
                    type: 'object', // Define the structure of a single transaction object
                    properties: {
                      _id: {
                        type: 'string',
                        example: '60c72b2f9b1d8e001c8a1b2d',
                      },
                      amount: { type: 'number', example: 1000 },
                      user: {
                        type: 'string',
                        example: '60c72b2f9b1d8e001c8a1b2e',
                      }, // User ID
                      type: { type: 'string', example: 'transfer' },
                      status: { type: 'string', example: 'completed' },
                      service: { type: 'string', example: 'transfer' },
                      meta: {
                        type: 'object',
                        properties: {
                          paidFrom: {
                            type: 'object',
                            properties: {
                              entityId: {
                                type: 'string',
                                example: 'user_id_from',
                              },
                              entityType: { type: 'string', example: 'user' },
                              entityNumber: {
                                type: 'string',
                                example: '08012345678',
                              },
                              entityName: {
                                type: 'string',
                                example: 'Sender Name',
                              },
                            },
                          },
                          paidTo: {
                            type: 'object',
                            properties: {
                              entityId: {
                                type: 'string',
                                example: 'user_id_to',
                              },
                              entityType: { type: 'string', example: 'user' },
                              entityNumber: {
                                type: 'string',
                                example: '07098765432',
                              },
                              entityName: {
                                type: 'string',
                                example: 'Recipient Name',
                              },
                            },
                          },
                        },
                      },
                      createdAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2023-01-15T10:00:00.000Z',
                      },
                      updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2023-01-15T10:05:00.000Z',
                      },
                    },
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
    @Query() query: FetchAllTransactionsDto,
    @Req() request: Request, // Assuming you need user context for transactions
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
      // The service expects 'id' if filtering by a specific user.
      // Assuming 'id' in service method refers to the authenticated user's ID.
      const userId = request.user?._id;
      const data = await this.userTransactionService.fetchAllTransactions({
        ...query,
        id: userId, // Pass the authenticated user's ID to the service
      });
      return {
        message: 'Transactions fetched successfully.',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch a single transaction by its ID for the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the transaction',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction details fetched successfully.',
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
              type: 'object', // Define the structure of a single transaction object
              properties: {
                transaction: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '60c72b2f9b1d8e001c8a1b2d',
                    },
                    amount: { type: 'number', example: 1000 },
                    user: {
                      type: 'string',
                      example: '60c72b2f9b1d8e001c8a1b2e',
                    }, // User ID
                    type: { type: 'string', example: 'transfer' },
                    status: { type: 'string', example: 'completed' },
                    service: { type: 'string', example: 'transfer' },
                    meta: {
                      type: 'object',
                      properties: {
                        paidFrom: {
                          type: 'object',
                          properties: {
                            entityId: {
                              type: 'string',
                              example: 'user_id_from',
                            },
                            entityType: { type: 'string', example: 'user' },
                            entityNumber: {
                              type: 'string',
                              example: '08012345678',
                            },
                            entityName: {
                              type: 'string',
                              example: 'Sender Name',
                            },
                          },
                        },
                        paidTo: {
                          type: 'object',
                          properties: {
                            entityId: { type: 'string', example: 'user_id_to' },
                            entityType: { type: 'string', example: 'user' },
                            entityNumber: {
                              type: 'string',
                              example: '07098765432',
                            },
                            entityName: {
                              type: 'string',
                              example: 'Recipient Name',
                            },
                          },
                        },
                      },
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2023-01-15T10:00:00.000Z',
                    },
                    updatedAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2023-01-15T10:05:00.000Z',
                    },
                    // ... other properties of Transaction
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
    @Param() params: FetchATransactionParamDto,
  ): Promise<{ message: string; data: { transaction: Transaction } }> {
    try {
      const { transaction } =
        await this.userTransactionService.fetchATransaction(params);
      return {
        message: 'Transaction fetched successfully.',
        data: { transaction },
      };
    } catch (error) {
      throw error;
    }
  }
}
