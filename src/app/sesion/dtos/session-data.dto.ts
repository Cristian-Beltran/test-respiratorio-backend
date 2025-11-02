import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class IngestSessionDto {
  @Expose()
  @IsString()
  serialNumber: string;

  @Expose() @IsOptional() @IsNumber() airflowValue?: number;
  @Expose() @IsOptional() @IsNumber() respBaseline?: number;
  @Expose() @IsOptional() @IsNumber() respDiffAbs?: number;
  @Expose() @IsOptional() @IsInt() respRate?: number;

  @Expose() @IsOptional() @IsNumber() bpm?: number;
  @Expose() @IsOptional() @IsNumber() spo2?: number;

  @Expose() @IsOptional() @IsNumber() resp2Adc?: number;
  @Expose() @IsOptional() @IsBoolean() resp2Positive?: boolean;

  @Expose() @IsOptional() @IsNumber() micAirValue?: number;
}
