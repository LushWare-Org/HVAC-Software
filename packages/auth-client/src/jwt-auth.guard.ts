import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Apply to any controller/route that requires a valid Auth0 JWT.
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthUser) { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
