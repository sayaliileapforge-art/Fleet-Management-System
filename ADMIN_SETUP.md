# Admin User Setup Guide

## Create Admin User in Supabase

Follow these steps to create a secure admin account:

### Step 1: Access Supabase Console
1. Go to https://app.supabase.com
2. Select your project: **xsbrmsibiyzvmeilpber**
3. Click on **Authentication** in the left sidebar
4. Click on the **Users** tab

### Step 2: Create Admin User
1. Click the **"Invite"** button (or **"Add User"** button)
2. Enter admin email and password:
   - **Email:** `admin@fleetpro.com`
   - **Password:** `Admin@123456` (or your preferred secure password)
3. Click **"Send invite"** or **"Create User"**

### Step 3: Verify User Created
- The user should appear in the Users list
- Status should be **"Active"** (not pending invitation)

---

## Login to FleetPro

Once admin user is created:

1. Go to http://localhost:3000
2. Enter:
   - **Email:** `admin@fleetpro.com`
   - **Password:** `Admin@123456`
3. Click **Sign In**

You will be logged in and can now access all features!

---

## Important Security Notes

✅ **DO:**
- Use a strong password (mix of upper, lower, numbers, special chars)
- Keep the password confidential
- Change default password after first login
- Enable 2FA if available in Supabase

❌ **DON'T:**
- Share credentials with others
- Use simple passwords like "123456"
- Commit credentials to version control
- Leave credentials in comments

---

## Change Password

If you need to change the admin password:

1. Go to Supabase Console
2. Click **Authentication** → **Users**
3. Find the admin user
4. Click on the user
5. Click **"Reset Password"** button
6. Enter new password

---

## Reset Forgotten Password

If you forget the password:

1. Go to http://localhost:3000
2. Click **"Forgot Password?"**
3. Enter admin email: `admin@fleetpro.com`
4. Check email for reset link
5. Follow link to set new password

---

## Multiple Admin Users (Optional)

To add more admin users, repeat the process:

1. Go to Supabase Console
2. Click **Authentication** → **Users** → **Invite**
3. Add new user email and password
4. They can log in immediately

---

## Database Access

All authenticated users can access:
- ✅ Vehicles (create, read, update, delete)
- ✅ Drivers, Customers, Trips, Expenses
- ✅ Dashboard analytics
- ✅ Reports and exports

RLS (Row Level Security) is configured to allow all authenticated users access. You can restrict this in Supabase policies if needed.

---

## Troubleshooting

**Q: Login fails with "Invalid credentials"**
- Verify email and password are correct
- Check email for typos
- Ensure user is created in Supabase

**Q: "Invalid email format" error**
- Enter valid email address (e.g., admin@company.com)
- Email must contain @

**Q: Reset password email not received**
- Check spam folder
- Verify email address in Supabase
- Wait a few minutes and retry

**Q: User shows as "Unconfirmed"**
- User needs to confirm email first
- Check email for confirmation link
- Or reset password to auto-confirm

---

## Next Steps

After admin user is created and you're logged in:

1. Create vehicles, drivers, customers
2. Create trips and track them
3. Monitor expenses and revenue
4. View analytics on dashboard
5. Export reports

All data is stored securely in Supabase!
