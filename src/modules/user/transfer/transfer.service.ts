import { NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';
import { DatabaseService } from 'src/core/database/database.service';
import {
  ServiceTypeEnum,
  TransactionEntityTypeEnum,
  TranscationStatusEnum,
  TxInfoEnum,
} from 'src/core/database/interfaces/transaction.interface';
import { User } from 'src/core/database/schemas/user.schema';
import {
  Bank,
  Biller,
  BillerCategory,
  BillerItemsResponseData,
  CustomerValidateResponse,
  PayBillResponseData,
  TransferRecipientResponseData,
} from 'src/modules/providers/bank/vfd/vfd.interface';
import { VFDService } from 'src/modules/providers/bank/vfd/vfd.service';

export class UserTransferService {
  constructor(
    private readonly bankService: VFDService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getBanks(): Promise<Bank[]> {
    try {
      const { data } = await this.bankService.fetchBanks();

      if (!data) {
        throw new NotFoundException('Bank lists cannot be fetched');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async confirmBankDetails(body: {
    accountNo: string;
    bank: string;
  }): Promise<TransferRecipientResponseData> {
    try {
      const { data } = await this.bankService.verifyBankDetails({
        accountNo: body.accountNo,
        bank: body.bank,
        transfer_type: body.bank !== '999999' ? 'intra' : 'inter',
      });

      if (!data) {
        throw new NotFoundException(
          'Account owner not verified, Please check and reconfirm',
        );
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async getBillers(): Promise<BillerCategory[]> {
    try {
      const { data } = await this.bankService.getBillerCategories();
      if (!data) {
        throw new NotFoundException('Billers categories cannot be found');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async getBillerList(body: { category: string }): Promise<Biller[]> {
    try {
      const { data } = await this.bankService.getBillerList(body.category);
      if (!data) {
        throw new NotFoundException('Billers list cannot be fetched');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async getBillerItems(body: {
    billerId: string;
    divisionId: string;
    productId: string;
  }): Promise<BillerItemsResponseData> {
    try {
      const { data } = await this.bankService.getBillerItems(body);
      if (!data) {
        throw new NotFoundException('Biller items cannot be fetched');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async validateBillCustomer(body: {
    billerId: string;
    divisionId: string;
    paymentItem: string;
    customerId: string;
  }): Promise<CustomerValidateResponse> {
    try {
      const data = await this.bankService.validateCustomer(body);
      if (!data) {
        throw new NotFoundException('Biller items cannot be fetched');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async billPayments(body: {
    user: User;
    service: ServiceTypeEnum;
    transactionType: TransactionEntityTypeEnum;
    customerId: string; // Phone Number or Meter Number
    amount: string; // Bill cost
    division: string; // from billerList.division
    paymentItem: string; // from billerItems.paymentCode
    productId: string; // from billerList.product
    billerId: string; // from billerList.id
    reference: string; // Unique, prefixed with walletName or name of choice
    phoneNumber?: string; // Optional for some products (e.g., electricity)
  }): Promise<PayBillResponseData> {
    try {
      const { user, service, transactionType, ...billData } = body;
      const receipt = await this.databaseService.transactions.create({
        amount: parseInt(billData.amount),
        reference: billData.reference,
        service: service,
        user: user._id,
        meta: {
          paidFrom: {
            entityId: user._id.toString(),
            entityType: TransactionEntityTypeEnum.user,
            entityNumber: user.bankDetails.accountNumber,
            entityCode: user.bankDetails.bankCode,
            entityName: user.bankDetails.bankName,
          },
          paidTo: {
            entityId: billData.billerId,
            entityType: transactionType,
            entityNumber: billData.productId,
            entityCode: billData.paymentItem,
            entityName: billData.division,
          },
        },
      });
      const { data } = await this.bankService.payBill(billData);

      if (!data) {
        receipt.status = TranscationStatusEnum.failed;
        await receipt.save();
        throw new NotFoundException('Error processing bill payment');
      }

      if (service === ServiceTypeEnum.electricty) {
        receipt.additionalDetails = [
          { title: TxInfoEnum.token, info: data.token! },
        ];
      }

      receipt.status = TranscationStatusEnum.completed;
      await receipt.save();

      return data;
    } catch (error) {
      throw error;
    }
  }

  private async processFundsTransfer(): Promise<any> {
    try {
      return null;
    } catch (error) {
      throw error;
    }
  }
}
