import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class IngestSessionDto {
  @IsString()
  serialNumber: string;

  // === Resp primaria ===
  @IsOptional()
  @IsNumber()
  airflowValue?: number;

  @IsOptional()
  @IsNumber()
  respBaseline?: number;

  @IsOptional()
  @IsNumber()
  respDiffAbs?: number;

  @IsOptional()
  @IsInt()
  respRate?: number;

  // === Cardiaco / SpO2 ===
  @IsOptional()
  @IsNumber()
  bpm?: number;

  @IsOptional()
  @IsNumber()
  spo2?: number;

  // === Resp secundaria ===
  @IsOptional()
  @IsNumber()
  resp2Adc?: number;

  @IsOptional()
  @IsBoolean()
  resp2Positive?: boolean;

  // === Legado (si tu front lo sigue enviando) ===
  @IsOptional()
  @IsNumber()
  micAirValue?: number;
}
