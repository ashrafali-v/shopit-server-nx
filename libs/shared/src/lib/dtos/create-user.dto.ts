import { IsString, IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Sanitize } from '../transformers/sanitize.transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Sanitize()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @Sanitize()
  email!: string;

  // @IsString()
  // @IsNotEmpty()
  // @MinLength(8)
  // @MaxLength(100)
  // password!: string;
}