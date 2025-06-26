import { IsString, IsNumber, IsNotEmpty, Min, MaxLength } from 'class-validator';
import { Sanitize } from '../transformers/sanitize.transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Sanitize()
  name!: string;

  @IsString()
  @MaxLength(1000)
  @Sanitize()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  stock!: number;
}