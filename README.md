# Three Takes Admin

The admin area for [Three Takes](https://github.com/zw3186nb/Project_One), the photo-caption
rating app. It uses the **same Supabase database** as the main app.

## What it does

| Section | Access |
| --- | --- |
| **Dashboard** | Statistics: votes per day, which AI voice wins most, busiest voting hours, whether longer captions win, funniest and most divisive caption, top voters and photographers, recognized locations, AI models used |
| **Users** | READ every profile with activity counts |
| **AI captions** | CREATE (generate with AI, or write by hand), READ, UPDATE, DELETE the AI-generated captions |
| **Votes** | READ every upvote/downvote on captions and jokes |

## Security: three locks

1. **Login wall** (`proxy.ts`): every route except `/login` and `/auth/callback` redirects
   signed-out visitors to Google sign-in.
2. **Admin gate** (`app/(admin)/layout.tsx`, `lib/admin.ts`): signed-in users whose
   `profiles.is_superadmin` is not `true` are sent to `/denied`. Every server action checks again.
3. **The database itself** (`supabase/week6-admin.sql`): Row Level Security policies only let
   admins read other people's profiles and votes or change captions. Even a request that
   skipped the website would be refused.

### "Won't I be locked out?"

Nobody can make themselves an admin through the app: a trigger rejects any change to
`is_superadmin` coming from the API roles (`anon`, `authenticated`). The way in is the
**project owner's access**: in the Supabase SQL Editor (which runs as the database owner,
not as a website user) run once:

```sql
update public.profiles set is_superadmin = true where email = 'you@example.com';
```

## Run locally

```bash
cp .env.example .env.local   # fill in the same Supabase URL and anon key as Three Takes
npm install
npm run dev                  # http://localhost:3000
```

Add `http://localhost:3000/auth/callback` and the deployed `/auth/callback` URL to
Supabase → Authentication → URL Configuration → Redirect URLs.
