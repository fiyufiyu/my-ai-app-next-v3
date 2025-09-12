# Deployment Guide for Symbiont AI

## ✅ Build Status
The application builds successfully and is ready for deployment to Vercel.

## Required Environment Variables

Before deploying, you need to set up the following environment variables in your Vercel project:

### 1. MongoDB Configuration
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=emails_recorded
MONGODB_COLLECTION=emails
```

### 2. OpenAI Configuration
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Resend Email Configuration
```
RESEND_API_KEY=re_your-resend-api-key-here
```

### 4. Next.js Configuration
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the environment variables in the Vercel dashboard
4. Deploy

### 3. Configure Domain (Optional)
- Update `NEXTAUTH_URL` to your custom domain if using one
- Update the email template in `lib/email.ts` if needed

## Features Included
- ✅ Magic link authentication
- ✅ MongoDB integration
- ✅ OpenAI GPT-4 integration
- ✅ Email sending via Resend
- ✅ Chat functionality with session management
- ✅ Responsive design
- ✅ Error handling and fallbacks

## Testing
After deployment, test these endpoints:
- `/` - Home page with email input
- `/auth/verify` - Magic link verification
- `/chat` - Chat interface
- `/api/test-openai` - OpenAI connection test
- `/api/test-db` - Database connection test

## Notes
- The app uses MongoDB for data persistence
- Magic links expire after 15 minutes
- Sessions last for 7 days
- All API routes are properly configured for production
