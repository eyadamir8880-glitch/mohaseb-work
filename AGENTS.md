## Project Convention

- Use named import for `supabaseClient`:
  ```ts
  import { isSupabaseConfigured, supabaseClient } from './supabase';
  ```
  NOT:
  ```ts
  import supabaseClient from './supabase';
  ```
  Named exports create live bindings; default exports capture a snapshot of the value.

## Commands

- `npm run dev` — run dev server
- `npm run build` — build for production
- `npm run lint` — lint check
- `git add -A; git commit -m "msg"` — commit
- `git push <url> main` — push to GitHub
