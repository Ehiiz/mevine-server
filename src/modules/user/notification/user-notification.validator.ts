import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumberString,
  IsPositive,
  IsBooleanString,
} from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
  })
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

  @ApiPropertyOptional({
    description: 'Filter by read status',
    type: Boolean,
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  read?: string; // Query params are strings
}
