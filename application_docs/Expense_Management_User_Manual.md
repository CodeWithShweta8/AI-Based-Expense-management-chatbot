# Expense Management Application – User Manual

## 1. Introduction
Welcome to the **Expense Management Application**! This web-based platform helps you track, split, and manage shared expenses with ease. Whether you are a regular user or a super admin, this manual will guide you through every feature and workflow.

---

## 2. Getting Started
### 2.1 Supported Browsers & Devices
- Latest versions of Chrome, Firefox, Edge, and Safari  
- Desktop or laptop recommended (mobile support coming soon)

### 2.2 Account Types
| Role | Description |
|------|-------------|
| User | Regular user who can create, view, and manage their own expenses |
| Super Admin | Has all user privileges plus the ability to manage users and view all expenses |

---

## 3. Logging In
1. Navigate to the application URL provided by your administrator.  
2. Enter your **Email** and **Password**.  
3. Click **Login**. A successful login generates a secure JWT token and redirects you to the **Dashboard**.

> **Tip:** If you forget your password, contact your Super Admin for assistance.

---

## 4. Dashboard Overview
After logging in, you will see:
- **Sidebar**: Quick links to *Dashboard, Expenses, Profile* (and *Admin* if you are a Super Admin).
- **Top App Bar**: Shows your name and a logout button.
- **Main Content Area**: Displays widgets like *Total Outstanding*, *Recent Expenses*, and *Quick Actions*.

---

## 5. Managing Your Profile
1. Click **Profile** in the sidebar.  
2. View or update your *Name* and *Email*.  
3. Click **Save** to apply changes.  
4. Your JWT token is refreshed automatically after profile updates.

---

## 6. Expense Management
### 6.1 Listing Expenses
- Navigate to **Expenses → My Expenses**.  
- The table lists description, amount, split status, and creation date.  
- Use filters or search to find specific expenses.

### 6.2 Creating an Expense
1. Click **Add Expense**.  
2. Fill in the **Description** and **Total Amount**.  
3. Choose involved users (equal to or fewer than the total user list).  
4. Click **Create**.

### 6.3 Updating or Deleting an Expense
- Click the *Edit* icon next to an expense to modify details.  
- Click the *Delete* icon to remove an expense (confirmation required).

> **Note:** Only the creator (or a Super Admin) can edit or delete an expense.

---

## 7. Splitting Expenses
### 7.1 Equal Split (Default)
- The system divides the *Total Amount* equally among selected users.  
- Example: Total = 300, Users = 3 → Each owes 100.

### 7.2 Custom Split
1. In the *Split* dialog, switch to **Custom** mode.  
2. Enter a custom amount for each user.  
3. Ensure the sum of all splits equals the *Total Amount* (the UI validates this).  
4. Click **Save Split**.

### 7.3 Viewing Split Details
- In **My Expenses**, click an expense row to expand and view per-user split amounts.

---

## 8. Admin Panel (Super Admin Only)
### 8.1 User Management
1. Click **Admin → User Management**.  
2. **Add User**: Provide *Name, Email, Password, Role* (User or Super Admin).  
3. **Edit User**: Update role or profile details.  
4. **Deactivate / Delete User**: Remove access or permanently delete.

### 8.2 Viewing All Expenses
- Navigate to **Admin → All Expenses** to see every expense created in the system.

---

## 9. Security & Privacy
- All passwords are stored using bcrypt hashing.  
- JWT tokens ensure secure, stateless sessions.  
- Only encrypted (HTTPS) connections are supported.  
- Role-based access controls prevent unauthorized actions.

---

## 10. Troubleshooting & FAQ
| Issue | Solution |
|-------|----------|
| Can’t log in | Verify credentials and browser compatibility. Contact Super Admin if issue persists. |
| Split totals don’t match | Ensure custom split amounts exactly add up to the total expense amount. |
| Unauthorized error (401) | Your session may have expired. Log out and log back in. |
| Feature not visible | You might not have the necessary role. Contact a Super Admin. |

---

## 11. Support
If you encounter issues not covered here, reach out to the support team at **support@example.com** or contact your Super Admin.

---

*Last updated: {{DATE}}* 