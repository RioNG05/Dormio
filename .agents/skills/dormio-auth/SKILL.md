---
name: dormio-auth
description: >-
  Auth implementation guide for Dormio: JWT strategy, login/register flows,
  role-based guards (RBAC), password reset for mustChangePassword flag, and
  session/token management patterns for NestJS backend + Next.js frontend.
  Trigger on: "auth", "login", "JWT", "guard", "role", "permissions", "mustChangePassword".
---

# Skill: Auth System (Dormio)

## Overview

Dormio uses JWT-based auth. Backend: NestJS + Passport JWT. Frontend: cookie-stored token + Zustand.

---

## 1. Backend: NestJS JWT Setup

Install: `@nestjs/passport`, `@nestjs/jwt`, `passport`, `passport-jwt`, `bcrypt`

```typescript
// auth.module.ts
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: "7d" },
      }),
    }),
    PassportModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

---

## 2. JWT Strategy

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; role: UserRole }) {
    // Return value attached to request.user
    return { id: payload.sub, role: payload.role };
  }
}
```

---

## 3. Auth Controller

```typescript
// auth.controller.ts
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const data = await this.auth.register(dto);
    return { success: true, data };
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    const data = await this.auth.login(dto);
    // data includes: { token, user, mustChangePassword }
    return { success: true, data };
  }

  @Patch("change-password")
  @UseGuards(JwtAuthGuard)
  async changePassword(@Body() dto: ChangePasswordDto, @Request() req) {
    await this.auth.changePassword(req.user.id, dto);
    return { success: true, message: "Password changed" };
  }
}
```

---

## 4. Auth Service

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { phoneNumber: dto.phoneNumber, hashedPassword: hashed, role: "tenant" },
    });
    return { token: this.signToken(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const valid = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    // IMPORTANT: check mustChangePassword flag
    return {
      token: this.signToken(user),
      user: { id: user.id, role: user.role, phoneNumber: user.phoneNumber },
      mustChangePassword: user.mustChangePassword,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedPassword: hashed, mustChangePassword: false },
    });
  }

  private signToken(user: User) {
    return this.jwt.sign({ sub: user.id, role: user.role });
  }
}
```

---

## 5. findOrCreateByPhone (Shared Helper)

Used by UC-L-04 (contract creation) and UC-L-19 (staff onboarding):

```typescript
// user.service.ts
async findOrCreateByPhone(phoneNumber: string, fullName?: string) {
  let user = await this.prisma.user.findUnique({ where: { phoneNumber } });
  if (!user) {
    const hashed = await bcrypt.hash("00000000", 10);
    user = await this.prisma.user.create({
      data: {
        phoneNumber,
        hashedPassword: hashed,
        username: fullName,
        role: "tenant",
        mustChangePassword: true, // Force reset on first login
      },
    });
    // Enqueue notification to deliver credentials via SMS/Zalo
    // await this.notifQueue.add("send-notification", { userId: user.id, type: "welcome" });
  }
  return user;
}
```

---

## 6. RBAC Guards

```typescript
// roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata("roles", roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>("roles", context.getHandler());
    if (!roles) return true;
    const { user } = context.switchToHttp().getRequest();
    return roles.includes(user.role);
  }
}

// Usage in controllers:
@Get("analytics")
@Roles("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
async getAnalytics() { ... }
```

---

## 7. Frontend: mustChangePassword Flow

After login, check `mustChangePassword` in response.
If true: redirect to `/auth/change-password` before allowing dashboard access.

```typescript
// In login handler (client component)
const res = await authService.login(credentials);
if (res.mustChangePassword) {
  router.push("/auth/change-password");
  return;
}
useAuthStore.getState().setAuth(res.token, res.user);
router.push("/landlord");
```

---

## 8. Frontend: middleware.ts

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const path = request.nextUrl.pathname;

  const isPublicPath =
    path.startsWith("/auth") || path.startsWith("/(public)");

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
```

---

## 9. Checklist

- [ ] `JWT_SECRET` in `.env` (never committed)
- [ ] `mustChangePassword: true` for all accounts with default password
- [ ] Login response includes `mustChangePassword` flag
- [ ] Frontend redirects to change-password if flag is true
- [ ] `findOrCreateByPhone()` used in both contract creation and staff onboarding
- [ ] Roles guard applied to admin-only endpoints
- [ ] `PropertyOwnershipGuard` for all BHMS endpoints
