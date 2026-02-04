# Copilot Instructions (SOCAI Expo app)

## Big picture
- Expo Router app with file-based routes under [app](app), using a single `AuthProvider` at the root in [app/_layout.tsx](app/_layout.tsx).
- The home screen in [app/index.tsx](app/index.tsx) depends on `useAuth` and redirects unauthenticated users to `/auth/login` via `router.replace`.
- Auth screens live in [app/auth](app/auth): `login.tsx`, `signup.tsx`, and `verify-email.tsx` are all React Native screens wired to Supabase auth helpers.

## Auth + session flow (Supabase)
- Supabase client and helpers are centralized in [supabaseClient.ts](supabaseClient.ts). Environment variables required: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (app will throw at startup if missing).
- `AuthContext` in [app/contexts/AuthContext.tsx](app/contexts/AuthContext.tsx) owns session state and listens for `supabase.auth.onAuthStateChange`.
- `PublicRoute` and `ProtectedRoute` wrappers in [app/components/PublicRoute.tsx](app/components/PublicRoute.tsx) and [app/components/ProtectedRoute.tsx](app/components/ProtectedRoute.tsx) gate access based on `session` and `loading`.
- Login uses `signInWithEmail` and logs activity with `logUserLogin` (RPC `update_last_login`) from [supabaseClient.ts](supabaseClient.ts).

## Data + database conventions
- Supabase schema, triggers, and RPCs are defined in [database/authentication.psql](database/authentication.psql). The app expects `user_profiles` and `update_last_login` to exist.
- User display in [app/components/ProfileCard.tsx](app/components/ProfileCard.tsx) reads `user.user_metadata` (`first_name`, `last_name`, `display_name`). Keep metadata shape consistent with `signUpWithEmail` in [supabaseClient.ts](supabaseClient.ts).

## UI/component patterns
- Main layout uses `Header` and `Hero` components from [app/components/header.tsx](app/components/header.tsx) and [app/components/hero.tsx](app/components/hero.tsx).
- `Hero` manages a simple local message list and input-only mode (used by `Header` toggles in [app/index.tsx](app/index.tsx)).

## Developer workflows
- Install: `npm install`
- Run dev server: `npm run start` (or `npm run android` / `npm run ios` / `npm run web`)
- Lint: `npm run lint`

## Project-specific notes
- Auth redirect behavior is intentionally client-side (no navigation guards at route level beyond `PublicRoute`/`ProtectedRoute`). Preserve the redirect pattern in [app/index.tsx](app/index.tsx) when adding new authenticated screens.
- Avoid adding new auth logic directly in screens; prefer helpers in [supabaseClient.ts](supabaseClient.ts) so metadata and RPC usage stay centralized.
- README mentions Clerk setup, but current implementation uses Supabase (`@supabase/supabase-js`) via [supabaseClient.ts](supabaseClient.ts).
