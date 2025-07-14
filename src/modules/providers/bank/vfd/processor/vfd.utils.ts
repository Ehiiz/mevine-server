import { TransferRequest, TransferResponseData } from '../vfd.interface';

export enum VFDEventsEnum {
  INITIATE_TRANSFER = 'initiate.transfer',
  SUCCESSFUL_DEPOSIT = 'successful.deposit',
}

export abstract class BaseVFDEvent {
  public readonly requestName: VFDEventsEnum;

  constructor(requestName: VFDEventsEnum) {
    this.requestName = requestName;
  }
}

export class InitiateTransferEvent extends BaseVFDEvent {
  public readonly data: TransferRequest;
  constructor(data: TransferRequest) {
    super(VFDEventsEnum.INITIATE_TRANSFER);
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
