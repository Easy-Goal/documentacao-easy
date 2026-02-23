# @easygoal/auth-provider

SSO auth provider para apps Next.js do ecossistema **Easy Goal**.

Implementa o fluxo OAuth-like completo contra o SSO do Easy Goal:
login → callback → sessão em cookies httpOnly → proxy de perfil → logout.

## Instalação

```bash
npm install @easygoal/auth-provider jose
```

## Configuração

Configure uma única vez no startup da aplicação:

```ts
// lib/auth.ts
import { EasyGoalAuth } from '@easygoal/auth-provider';

EasyGoalAuth.configure({
  ssoUrl: process.env.NEXT_PUBLIC_SSO_URL!,    // https://sso.easygoal.com.br
  appUrl: process.env.NEXT_PUBLIC_APP_URL!,     // https://club.easygoal.com.br
  secretKey: process.env.SECRET_KEY!,
  callbackPath: '/auth/callback',               // default
  protectedRoutes: ['/profile', '/dashboard'],  // default
  loginRedirect: '/',                           // destino pós logout
});
```

Variáveis de ambiente necessárias:

```env
NEXT_PUBLIC_SSO_URL=https://sso.easygoal.com.br
NEXT_PUBLIC_APP_URL=https://club.easygoal.com.br
SECRET_KEY=<node -e "require('crypto').randomBytes(32).toString('hex')">
```

## Route handlers

### Login

```ts
// app/auth/login/route.ts
import { NextResponse } from 'next/server';
import { EasyGoalAuth } from '@easygoal/auth-provider';
import '@/lib/auth'; // garante que configure() foi chamado

export async function GET() {
  const loginUrl = await EasyGoalAuth.getLoginUrl();
  return NextResponse.redirect(loginUrl);
}
```

### Callback

```ts
// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { EasyGoalAuth } from '@easygoal/auth-provider';
import type { NextRequest } from 'next/server';
import '@/lib/auth';

export async function GET(request: NextRequest) {
  const result = await EasyGoalAuth.handleCallback(request.nextUrl.searchParams);
  if (!result.success) {
    return NextResponse.redirect(new URL('/?error=' + result.error, request.url));
  }
  return NextResponse.redirect(new URL(result.redirectTo ?? '/', request.url));
}
```

### Logout

```ts
// app/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { EasyGoalAuth } from '@easygoal/auth-provider';
import '@/lib/auth';

export async function GET() {
  await EasyGoalAuth.clearSession();
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL!));
}
```

## Obtendo o perfil (Server Component)

```ts
import { EasyGoalAuth } from '@easygoal/auth-provider';
import '@/lib/auth';

export default async function ProfilePage() {
  const profile = await EasyGoalAuth.getProfile();
  if (!profile) return <p>Não autenticado</p>;

  return <p>Olá, {profile.name}!</p>;
}
```

## Middleware (proteção de rotas)

```ts
// middleware.ts
import { createAuthMiddleware } from '@easygoal/auth-provider/middleware';

export const middleware = createAuthMiddleware({
  protectedRoutes: ['/profile', '/dashboard'],
  loginPath: '/',
});

export const config = {
  matcher: ['/((?!_next|favicon|auth).*)'],
};
```

## Cookies gerenciados

| Cookie | httpOnly | TTL | Conteúdo |
|--------|----------|-----|----------|
| `eg_access_token` | ✅ | 1h | JWT de acesso |
| `eg_refresh_token` | ✅ | 30d | Token de renovação |
| `eg_oauth_state` | ✅ | 10min | CSRF state temporário |

Os cookies nunca são acessíveis pelo JavaScript do browser.

## API

### `EasyGoalAuth.configure(config)`

Configura o pacote. Deve ser chamado antes de qualquer outra função.

### `EasyGoalAuth.getLoginUrl(redirectAfter?)`

Gera a URL de login do SSO e salva o CSRF state em cookie. Retorna `Promise<string>`.

### `EasyGoalAuth.handleCallback(searchParams)`

Processa o callback do SSO. Valida state, salva tokens. Retorna `Promise<CallbackResult>`.

### `EasyGoalAuth.getProfile()`

Busca o perfil do usuário no SSO usando o token armazenado. Retorna `Promise<UserProfile | null>`.

### `EasyGoalAuth.clearSession()`

Remove todos os cookies de autenticação. Retorna `Promise<void>`.

### `EasyGoalAuth.getAccessToken()`

Retorna o access token bruto do cookie, ou `null`. Retorna `Promise<string | null>`.

### `createAuthMiddleware(config?)`

Cria um middleware Next.js para proteger rotas. Importar de `@easygoal/auth-provider/middleware`.
