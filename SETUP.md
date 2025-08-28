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
   
   # Email Service (choose one)
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

### 4. **Database Setup**
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

### **Step 3: Create Email Templates**
1. Go to **Templates** in the sidebar
2. Click **"Create Template"**
3. Design your email using the template editor
4. Save the template

### **Step 4: Create a Campaign**
1. Go to **Campaigns** in the sidebar
2. Click **"Create Campaign"**
3. Fill in:
   - Campaign name
   - Subject line
   - Select template
   - Choose subscriber list
   - Set tracking options
4. Save as draft

### **Step 5: Send the Campaign**
1. Go to your campaign
2. Click **"Send Campaign"**
3. Review and confirm
4. The system will send emails to all subscribers

## 🔧 Email Service Configuration

### **Option 1: SendGrid (Recommended)**
```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### **Option 2: Resend**
```env
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### **Option 3: Mailgun**
```env
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

## 📊 Features Available

- ✅ **Campaign Management**: Create, edit, and send email campaigns
- ✅ **Subscriber Management**: Add, import, and organize subscribers
- ✅ **Email Templates**: Create reusable email templates
- ✅ **Subscriber Lists**: Organize subscribers into targeted lists
- ✅ **Analytics**: Track opens, clicks, and engagement
- ✅ **Authentication**: Secure Google OAuth login
- ✅ **Responsive Design**: Works on desktop and mobile

## 🛠️ Troubleshooting

### **Authentication Issues**
- Make sure Google OAuth credentials are correct
- Check that redirect URI matches exactly
- Verify NEXTAUTH_SECRET is set

### **Email Sending Issues**
- Verify email service API keys
- Check from email address is verified
- Ensure MongoDB is running

### **Database Issues**
- Check MongoDB connection string
- Verify database permissions
- Restart the development server

## 🎯 Next Steps

1. **Set up your email service** (SendGrid/Resend/Mailgun)
2. **Configure Google OAuth** for authentication
3. **Add your first subscribers**
4. **Create email templates**
5. **Send your first campaign!**

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check the terminal for server errors

Your email marketing system is now fully functional! 🎉
