import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AskDto {
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  question!: string;
}
