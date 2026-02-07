# XFlow Cards

אפליקציית ניהול כרטיסים עם אימות SMS OTP מאובטח.

## טכנולוגיות

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **SMS**: Make.com Webhook
- **Deployment**: Vercel

## התקנה מקומית

```bash
npm install
npm run dev
```

## פריסה

האפליקציה מתארחת ב-Vercel:
https://base44-test-liard.vercel.app

## מבנה הפרויקט

```
src/
├── api/          # Supabase client
├── components/   # React components
├── pages/        # Page components
└── lib/          # Utilities

supabase/
└── functions/    # Edge Functions (OTP)
```
