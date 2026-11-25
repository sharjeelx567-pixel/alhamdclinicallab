import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { LoginActivityDoc } from '../../common/entities';
import { PERMISSIONS, ROLE_LABELS } from '../../common/permissions';
import { AuthUser, RequestMeta, toActor } from '../../common/types';
import { getEnv } from '../../config/env';
import { C, DataStore } from '../../database/data-store';
import { ApiZodBody, CurrentUser, Public, ReqMeta, ZodBody } from '../../decorators';
import { AccessService } from './access.service';
import { AuditService } from '../audit-logs/audit.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { refreshSession, signInWithPassword } from './password-auth';

const SessionEvent = z.object({ event: z.enum(['login', 'logout']) });
const PasswordLogin = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });
const TokenRefresh = z.object({ refreshToken: z.string().min(10).max(4000) });
const ChangePassword = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(10, 'New password must be at least 10 characters').max(200) });

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly store: DataStore,
    private readonly audit: AuditService,
    private readonly access: AccessService,
    private readonly firebase: FirebaseService,
  ) {}

  /** Sign-in through the server (see password-auth.ts). Strictly rate limited per IP. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('password-login')
  @HttpCode(200)
  @ApiZodBody(PasswordLogin)
  passwordLogin(@ZodBody(PasswordLogin) body: z.infer<typeof PasswordLogin>) {
    return signInWithPassword(body.email.trim().toLowerCase(), body.password);
  }

  /** Swaps the refresh token for a fresh ID token (every ~55 minutes while signed in). */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('token-refresh')
  @HttpCode(200)
  @ApiZodBody(TokenRefresh)
  tokenRefresh(@ZodBody(TokenRefresh) body: z.infer<typeof TokenRefresh>) {
    return refreshSession(body.refreshToken);
  }

  /** Change own password: the current password is checked first. Returns a new session. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-password')
  @HttpCode(200)
  @ApiZodBody(ChangePassword)
  async changePassword(@CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta, @ZodBody(ChangePassword) body: z.infer<typeof ChangePassword>) {
    await signInWithPassword(user.email, body.currentPassword);
    await this.firebase.auth.updateUser(user.uid, { password: body.newPassword });
    await this.audit.record({ action: 'auth.password_change', entity: 'user', entityId: user.uid, actor: toActor(user), ip: meta.ip });
    return signInWithPassword(user.email, body.newPassword);
  }

  /** Lets the frontend show which auth/data modes are active (dev banners). No secrets. */
  @Public()
  @Get('config')
  config() {
    const env = getEnv();
    return { authMode: env.AUTH_MODE, dataBackend: env.DATA_BACKEND, environment: env.NODE_ENV };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    // Same profile the guard has just loaded (no second read).
    const doc = await this.access.userDoc(user.uid);
    return { ...user, photo: doc?.photo ?? null, roleLabel: ROLE_LABELS[user.role], permissionLabels: PERMISSIONS };
  }

  /**
   * Records login/logout. Sign-in itself happens against Firebase Authentication
   * in the browser; password reset & change use Firebase's secure flows.
   */
  @Post('session-events')
  @HttpCode(204)
  @ApiZodBody(SessionEvent)
  async sessionEvent(
    @CurrentUser() user: AuthUser,
    @ReqMeta() meta: RequestMeta,
    @ZodBody(SessionEvent) body: z.infer<typeof SessionEvent>,
  ) {
    const doc: LoginActivityDoc = {
      id: this.store.newId(),
      uid: user.uid,
      event: body.event,
      at: this.store.now(),
      ip: meta.ip,
      userAgent: meta.userAgent,
    };
    await this.store.create(C.loginActivity, doc.id, doc);
    await this.audit.record({ action: `auth.${body.event}`, entity: 'user', entityId: user.uid, actor: toActor(user), ip: meta.ip });
  }

  @Get('login-activity')
  async loginActivity(@CurrentUser() user: AuthUser) {
    const res = await this.store.query<LoginActivityDoc>(C.loginActivity, {
      where: [{ field: 'uid', op: '==', value: user.uid }],
      orderBy: { field: 'at', direction: 'desc' },
      limit: 50,
    });
    return res.items;
  }
}
