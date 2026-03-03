import { Strategy } from 'passport-jwt';
import { AuthUser, JwtPayload } from '@tscrm/types';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    /**
     * Called after JWT signature is verified.
     * The returned object is attached to request.user
     */
    validate(payload: JwtPayload): AuthUser;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map