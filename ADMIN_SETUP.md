# Creating an Admin Account

## Default Admin Credentials

**Email:** `admin@telemed.com`  
**Password:** `Admin@123456`

⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## Setup Instructions

### Method 1: Create Admin via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**

   - Navigate to: Authentication → Users

2. **Click "Add User"**

   - Email: `admin@telemed.com`
   - Password: `Admin@123456`
   - Auto Confirm User: ✅ (check this box)
   - Click "Create User"

3. **Copy the User ID**

   - After creating, click on the user to see details
   - Copy the UUID (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

4. **Run SQL to Create Admin Profile**
   - Go to: SQL Editor
   - Paste this SQL (replace `USER_ID` with the copied UUID):

```sql
INSERT INTO profiles (id, email, full_name, role, is_blocked, created_at, updated_at)
VALUES (
    '95edfe85-577b-49fd-b6e6-2fec0a108707',  -- Replace with the UUID you copied
    'group6bsakm@gmail.com',
    'System Administrator',
    'admin',
    false,
    NOW(),
    NOW()
);
```

5. **Test Login**
   - Go to `http://localhost:3001/login`
   - Login with: `admin@telemed.com` / `Admin@123456`
   - You should be redirected to `/admin/dashboard`

---

### Method 2: Upgrade Existing Account to Admin

If you already created an account through the signup page:

1. **Go to Supabase Dashboard** → SQL Editor

2. **Run this SQL** (replace with your email):

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

3. **Logout and login again** to get admin access

---

### Method 3: Use Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Create user via CLI
supabase auth users create admin@telemed.com --password Admin@123456

# Get the user ID from the output, then run:
supabase db execute "INSERT INTO profiles (id, email, full_name, role) VALUES ('USER_ID', 'admin@telemed.com', 'System Administrator', 'admin');"
```

---

## Verification

To verify the admin account was created correctly:

```sql
SELECT id, email, full_name, role, is_blocked, created_at
FROM profiles
WHERE role = 'admin';
```

You should see one row with:

- Email: `admin@telemed.com`
- Role: `admin`
- Is Blocked: `false`

---

## Security Notes

1. **Change the default password immediately** after first login
2. **Remove or protect** the `create-admin.sql` file in production
3. **Enable 2FA** for admin accounts (configure in Supabase)
4. **Limit admin access** to trusted IP addresses if possible
5. **Monitor admin actions** using the `admin_actions` audit log table

---

## Troubleshooting

### "User already exists" error

- The email is already registered in Supabase Auth
- Use Method 2 to upgrade the existing account to admin

### "Cannot login" after creating admin

- Make sure you clicked "Auto Confirm User" when creating in Supabase
- Or manually confirm the user in Supabase Dashboard

### "Redirected to /" instead of "/admin/dashboard"

- Check that the profile role is set to 'admin' in the database
- Logout and login again to refresh the session

---

## Next Steps

After creating your admin account:

1. ✅ Login as admin
2. ✅ Change the default password
3. ✅ Approve pending doctor registrations
4. ✅ Configure system settings
5. ✅ Create additional admin accounts if needed
