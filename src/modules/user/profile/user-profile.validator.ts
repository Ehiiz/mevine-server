import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'Jane',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name cannot be empty if provided' })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name cannot be empty if provided' })
  lastName?: string;

  @ApiProperty({
    description: 'URL to user avatar image',
    example: 'https://example.com/new-avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Avatar must be a string (URL)' })
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;
}
