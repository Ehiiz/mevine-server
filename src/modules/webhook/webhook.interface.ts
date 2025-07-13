import {
  IsString,
  IsNumberString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

// Base DTO for common VFD webhook fields
class VfdBaseWebhookDto {
  @IsString()
  reference: string;

  @IsNumberString() // Amount is typically sent as a string in JSON
  amount: string;

  @IsString()
  account_number: string;

  @IsString()
  originator_account_number: string;

  @IsString()
  originator_account_name: string;

  @IsString()
  originator_bank: string;

  @IsOptional()
  @IsString()
  originator_narration?: string;

  @IsString()
  timestamp: string; // ISO 8601 format string

  @IsString()
  session_id: string;
}

// DTO for Inward Credit Notification
export class VfdInwardCreditWebhookDto extends VfdBaseWebhookDto {
  @IsString()
  transaction_channel: string; // Specific to this type
}

// DTO for Initial Inward Credit Notification
export class VfdInitialCreditWebhookDto extends VfdBaseWebhookDto {
  @IsBoolean()
  initialCreditRequest: boolean; // Specific to this type
}

// --- src/webhook/interfaces/vfd-webhook.interface.ts ---
// TypeScript interfaces to define the shape of webhook data.
// These are useful for type safety within your NestJS application.
export interface VfdWebhookPayload {
  reference: string;
  amount: string;
  account_number: string;
  originator_account_number: string;
  originator_account_name: string;
  originator_bank: string;
  originator_narration?: string;
  timestamp: string;
  transaction_channel?: string; // Optional for initial credit
  session_id: string;
  initialCreditRequest?: boolean; // Optional for inward credit
}
