# Supabase Setup Instructions

## Step 1: Get Your Database Password

1. Go to: https://app.supabase.com/projects
2. Click on your project "xsbrmsibiyzymeilpber"
3. Go to **Settings** → **Database**
4. Copy your **password** (or reset it if you forgot)

## Step 2: Update backend/.env

Replace `[YOUR_PASSWORD]` in the DATABASE_URL with your actual Supabase database password:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@xsbrmsibiyzymeilpber.supabase.co:5432/postgres"
```

Example:
```env
DATABASE_URL="postgresql://postgres:MySecurePassword123!@xsbrmsibiyzymeilpber.supabase.co:5432/postgres"
```

## Step 3: Verify Connection

After updating .env, run:
```bash
cd backend
npx prisma db push
```

This will:
- Verify the connection to Supabase
- Create all tables (Vehicle, Driver, Customer, Trip, Expense, etc.)
- Sync your schema with Supabase

## Step 4: Restart Servers

Once schema is pushed, restart:
1. Backend: `npm run dev` (in backend folder)
2. Frontend: `npm run dev` (in root folder)

## Connection Details

- **Supabase URL:** https://xsbrmsibiyzymeilpber.supabase.co
- **Database Host:** xsbrmsibiyzymeilpber.supabase.co
- **Database Name:** postgres
- **Database Port:** 5432
- **Database User:** postgres

## What's Connected

✅ All Vehicle data
✅ All Driver data
✅ All Customer data
✅ All Trip data
✅ All Expense data
✅ Dashboard analytics

All data is now stored in Supabase PostgreSQL cloud database!
