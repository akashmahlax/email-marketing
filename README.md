# Email Marketing System Setup Guide

## 🚀 Quick Start

Your email marketing system is now ready! Here's how to access and use it:

### 1. **Start the Development Server**
```bash
bun run dev
```

### 2. **Access the Application**
Open your browser and go to: `http://localhost:3000`

### 3. **Authentication Setup**
The system uses Google OAuth for authentication. You'll need to:

1. **Create a Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

2. **Set Environment Variables:**
   Create a `.env.local` file in your project root with:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/email-marketing
   
   # NextAuth.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret-key
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Email Service (Choose ONE option below)
   ```

### 4. **Email Service Configuration (Nodemailer)**

Choose one of these email service options:

#### **Option 1: Gmail (Recommended for Testing)**
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

**Setup Gmail App Password:**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to "Security" → "App passwords"
4. Generate a new app password for "Mail"
5. Use this password in `GMAIL_APP_PASSWORD`

#### **Option 2: SMTP Server**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

#### **Option 3: Outlook/Hotmail**
```env
OUTLOOK_USER=your-email@outlook.com
OUTLOOK_PASSWORD=your-password
```

#### **Option 4: Yahoo**
```env
YAHOO_USER=your-email@yahoo.com
YAHOO_APP_PASSWORD=your-app-password
```

### 5. **Database Setup**
Make sure MongoDB is running locally or use MongoDB Atlas:
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env.local
```

## 📧 How to Send Emails

### **Step 1: Access the Dashboard**
1. Visit `http://localhost:3000`
2. Click "Sign In with Google"
3. You'll be redirected to the dashboard

### **Step 2: Create Subscribers**
1. Go to **Subscribers** in the sidebar
2. Click **"Add Subscriber"** or **"Import Subscribers"**
3. Add email addresses and names

### **Step 3: Create Subscriber Lists**
1. Go to **Subscriber Lists** in the sidebar
2. Click **"Create List"**
3. Add subscribers to your lists

### **Step 4: Create Email Templates**
1. Go to **Templates** in the sidebar
2. Click **"Create Template"**
3. Design your email using the template editor
4. Save the template

### **Step 5: Create a Campaign**
1. Go to **Campaigns** in the sidebar
2. Click **"Create Campaign"**
3. Fill in:
   - Campaign name
   - Subject line
   - Select template
   - Choose subscriber list
   - Set tracking options
4. Save as draft

### **Step 6: Send the Campaign**
1. Go to your campaign
2. Click **"Send Campaign"**
3. Review and confirm
4. The system will send emails to all subscribers using Nodemailer

## 🔧 Email Service Configuration Details

### **Gmail Setup (Recommended)**
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

**Why Gmail App Password?**
- Gmail requires app passwords for programmatic access
- Regular passwords won't work due to security restrictions
- App passwords are 16 characters long

### **SMTP Server Setup**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Testing Email Configuration**
You can test your email configuration by:
1. Going to the dashboard
2. Looking for any email configuration errors
3. The system will automatically detect your email provider

## 📊 Features Available

- ✅ **Campaign Management**: Create, edit, and send email campaigns
- ✅ **Subscriber Management**: Add, import, and organize subscribers
- ✅ **Email Templates**: Create reusable email templates with variables
- ✅ **Subscriber Lists**: Organize subscribers into targeted lists
- ✅ **Analytics**: Track opens, clicks, and engagement
- ✅ **Authentication**: Secure Google OAuth login
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Nodemailer Integration**: Support for Gmail, SMTP, Outlook, Yahoo

## 🛠️ Troubleshooting

### **Authentication Issues**
- Make sure Google OAuth credentials are correct
- Check that redirect URI matches exactly
- Verify NEXTAUTH_SECRET is set

### **Email Sending Issues**
- **Gmail**: Use app password, not regular password
- **SMTP**: Check port and security settings
- **Outlook**: May require app password
- **Yahoo**: Requires app password

### **Database Issues**
- Check MongoDB connection string
- Verify database permissions
- Restart the development server

### **Common Errors**
- **"No email provider configured"**: Set up email credentials in `.env.local`
- **"Authentication failed"**: Check email credentials
- **"Rate limit exceeded"**: System automatically handles rate limiting

## 🎯 Quick Setup Commands

```bash
# Create environment file
echo "MONGODB_URI=mongodb://localhost:27017/email-marketing
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password" > .env.local

# Start the server
bun run dev
```

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check the terminal for server errors
5. Test email configuration in the dashboard

Your email marketing system is now fully functional with Nodemailer! 🎉
