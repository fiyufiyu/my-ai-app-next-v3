import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(email: string, magicLink: string) {
  try {
    // Use your verified domain
    const fromAddress = 'Symbiont AI <noreply@iterasyon.com>';
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: 'Your Magic Link to Symbiont AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Magic Link to Symbiont AI</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: linear-gradient(135deg, #0f0f0f 0%, #000 100%);
              color: #e0e0e0;
              margin: 0;
              padding: 0;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              font-size: 28px;
              font-weight: 800;
              letter-spacing: -0.02em;
              text-transform: uppercase;
              background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 16px;
              font-weight: 400;
            }
            .content {
              background: rgba(17, 17, 17, 0.8);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 20px;
              color: #fff;
            }
            .description {
              font-size: 16px;
              color: #999;
              margin-bottom: 30px;
              line-height: 1.6;
            }
            .magic-button {
              display: inline-block;
              background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
              color: #000;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 700;
              font-size: 16px;
              transition: all 0.3s ease;
              margin-bottom: 20px;
            }
            .magic-button:hover {
              background: linear-gradient(135deg, #fff 0%, #e8e8e8 100%);
              transform: translateY(-2px);
            }
            .link-text {
              font-size: 14px;
              color: #666;
              word-break: break-all;
              background: rgba(0, 0, 0, 0.6);
              padding: 15px;
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .security-note {
              background: rgba(16, 185, 129, 0.1);
              border: 1px solid rgba(16, 185, 129, 0.3);
              border-radius: 12px;
              padding: 20px;
              margin-top: 30px;
              text-align: center;
            }
            .security-note h3 {
              color: #10b981;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .security-note p {
              color: #10b981;
              font-size: 14px;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Symbiont AI</div>
              <div class="subtitle">Your Personal MBTI Therapist</div>
            </div>
            
            <div class="content">
              <h1 class="title">Welcome to Symbiont AI</h1>
              <p class="description">
                Click the button below to access your personal MBTI AI therapist. 
                This link will expire in 15 minutes for your security.
              </p>
              
              <a href="${magicLink}" class="magic-button">
                Access Your AI Therapist
              </a>
              
              <p class="link-text">
                If the button doesn't work, copy and paste this link:<br>
                ${magicLink}
              </p>
            </div>
            
            <div class="security-note">
              <h3>🔒 Security Note</h3>
              <p>This magic link is unique to you and will expire in 15 minutes. Never share this link with anyone.</p>
            </div>
            
            <div class="footer">
              <p>If you didn't request this email, you can safely ignore it.</p>
              <p>© 2024 Symbiont AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}
