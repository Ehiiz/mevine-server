import { TransferRequest, TransferResponseData } from '../vfd.interface';

export enum VFDEventsEnum {
  INITIATE_TRANSFER = 'initiate.transfer',
  SUCCESSFUL_DEPOSIT = 'successful.deposit',
}

export abstract class BaseVFDEvent {
  public readonly requestName: VFDEventsEnum;
  public readonly email?: string;

  constructor(requestName: VFDEventsEnum, email?: string) {
    this.requestName = requestName;
    this.email = email;
  }
}

export class InitiateTransferEvent extends BaseVFDEvent {
  public readonly data: TransferRequest;
  constructor(data: TransferRequest, email?: string) {
    super(VFDEventsEnum.INITIATE_TRANSFER, email);
    this.data = data;
  }
}

export class SuccessfulDepositEvent extends BaseVFDEvent {
  public readonly data: TransferResponseData;
  constructor(data: TransferResponseData) {
    super(VFDEventsEnum.SUCCESSFUL_DEPOSIT);
    this.data = data;
  }
}
