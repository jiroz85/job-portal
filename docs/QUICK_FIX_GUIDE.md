# 🔧 Quick Fix for 403 Authentication Errors

## 🎯 **Problem:**

You're getting 403 Forbidden errors because:

- The frontend is trying to access admin-only API endpoints
- You're either not logged in, or not logged in as an admin/employer

## 🚀 **Solution Options:**

### **Option 1: Check Your Current Login Status**

1. Open your browser and go to your application
2. Open browser console (F12)
3. Paste this code and press Enter:

```javascript
console.log("=== Authentication Debug ===");
console.log("Token:", localStorage.getItem("token"));
console.log("User:", localStorage.getItem("user"));

try {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("User Role:", user.role);
  console.log("User Email:", user.email);
  console.log("Is Admin:", user.role === "admin");
  console.log("Is Employer:", user.role === "employer");
} catch (e) {
  console.log("Error parsing user data:", e);
}
```

### **Option 2: Log Out and Log Back In**

1. Go to `/login` in your application
2. Log out if you're logged in
3. Log in with an **admin** or **employer** account

### **Option 3: Create an Admin Account**

If you don't have an admin account, create one:

1. **Register a new account** at `/register`
2. **Update the user role to admin** in the database:

```sql
UPDATE Users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### **Option 4: Use Existing Admin Credentials**

Check if you have these default accounts:

- **Email:** `admin@example.com`
- **Password:** `admin123`

Or check your database for existing admin users.

---

## 🎯 **What I Fixed:**

I updated the `UserContext.jsx` to:

- ✅ Check user role before making admin requests
- ✅ Only fetch admin data if user is actually an admin
- ✅ Prevent 403 errors for non-admin users

---

## 🚀 **Next Steps:**

1. **Check your login status** with the debug code above
2. **Log in as admin/employer** if needed
3. **Refresh the page** - errors should be gone
4. **Test the employer workflow** - it should work now!

---

## 📱 **Testing the System:**

Once logged in correctly:

1. **Go to employer dashboard:** `/employer`
2. **See workflow demo:** Click "See Workflow Demo" button
3. **View applications:** Go to `/employer/jobs/1/applicants`
4. **Test actions:** Click "Actions" → "Send Message", etc.

---

## 🔍 **If You Still Have Issues:**

1. **Check browser console** for error messages
2. **Verify user role** is 'admin' or 'employer'
3. **Check token** exists in localStorage
4. **Make sure backend is running** on port 3001

---

## 🎉 **Expected Result:**

After fixing authentication:

- ✅ No more 403 errors
- ✅ Employer dashboard loads properly
- ✅ Can see applications and take actions
- ✅ Workflow demo works
- ✅ Real-time notifications work

---

**Your job application system should work perfectly after this!** 🚀
