import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Symbiont, a therapeutic MBTI guide. Respond briefly and warmly." },
        { role: "user", content: "Hello! Can you confirm you're working?" }
      ],
      max_completion_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      success: true,
      message: 'OpenAI connection successful',
      response: response
    });

  } catch (error) {
    console.error('OpenAI test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
