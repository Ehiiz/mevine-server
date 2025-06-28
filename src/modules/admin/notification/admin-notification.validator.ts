import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsMongoId,
  IsNumberString,
  IsPositive,
} from 'class-validator';

export class CreateAdminNotificationDto {
  @ApiPropertyOptional({
    description: 'Icon for the notification',
    example: 'info-circle',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    description: 'Title of the notification',
    example: 'System Maintenance',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Description/body of the notification',
    example: 'We will be performing scheduled maintenance tonight.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description:
      'If true, this notification is broadcast to all users. If false, specify targetUsers.',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isBroadcast?: boolean;

  @ApiPropertyOptional({
    description: 'Array of user IDs to target if isBroadcast is false.',
    example: ['60c72b2f9b1d8e001c8a1b2d', '60c72b2f9b1d8e001c8a1b2e'],
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  targetUsers?: string[]; // Array of string IDs (will be converted to ObjectId)
}

export class UpdateAdminNotificationDto extends PartialType(
  CreateAdminNotificationDto,
) {
  // All properties are optional for updates
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string; // Override to make optional

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string; // Override to make optional

  @IsOptional()
  @IsBoolean()
  isBroadcast?: boolean; // Override to make optional

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  targetUsers?: string[]; // Override to make optional
}

export class AdminNotificationPaginationDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @IsNumberString()
  @IsPositive()
  page?: string = '1';

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @IsNumberString()
  @IsPositive()
  limit?: string = '10';

  @ApiPropertyOptional({ description: 'Search term for title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by initiator Admin ID' })
  @IsOptional()
  @IsMongoId()
  initiatorId?: string;
}
