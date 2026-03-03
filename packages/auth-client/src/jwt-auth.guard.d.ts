declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
/**
 * Apply to any controller/route that requires a valid Auth0 JWT.
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthUser) { ... }
 */
export declare class JwtAuthGuard extends JwtAuthGuard_base {
}
export {};
//# sourceMappingURL=jwt-auth.guard.d.ts.map