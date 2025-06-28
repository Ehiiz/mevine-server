import { SetMetadata } from '@nestjs/common';
import { WebServiceTypeEnum } from '../interfaces/shared.interface';
export const SERVICE_KEY = 'SERVICE_KEY';

export const ServiceDecorator = (service: WebServiceTypeEnum) =>
  SetMetadata(SERVICE_KEY, service);
