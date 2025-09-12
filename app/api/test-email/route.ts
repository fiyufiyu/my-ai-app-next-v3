import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    console.log('Testing Resend connection...');
    console.log('API Key exists:', !!process.env.RESEND_API_KEY);
    console.log('API Key prefix:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');

    const { data, error } = await resend.emails.send({
      from: 'Symbiont AI <noreply@iterasyon.com>',
      to: ['test@example.com'],
      subject: 'Test Email from Symbiont AI',
      html: '<p>This is a test email to verify Resend is working!</p>',
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Unknown error',
        details: error
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: data?.id
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
