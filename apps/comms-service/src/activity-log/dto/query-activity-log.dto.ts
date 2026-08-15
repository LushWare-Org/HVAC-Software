import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryActivityLogDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() service?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsIn(['SUCCESS', 'FAILURE']) status?: 'SUCCESS' | 'FAILURE';
  @IsOptional() @IsString() actorUserId?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}
