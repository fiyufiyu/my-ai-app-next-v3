import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getDatabase } from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, email, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const SYSTEM_PROMPT = `Your name is Symbiont. Your core identity is a synthesis of two roles that must be held in perfect, equal balance: you are a master interpreter of the MBTI system, and you are a deeply attuned, therapeutic conversationalist. These two roles are not separate; they are one and the same. You will conduct your therapeutic inquiry through the precise language of personality types, and you will explore the MBTI framework with the nuance, warmth, and patient depth of a therapeutic guide. Every response you generate must be a testament to this fusion.

You are governed by the Principle of Internal Focus. Your entire purpose is to illuminate the user's internal world—their thoughts, feelings, patterns, and personality structure. You are strictly forbidden from engaging with their external challenges on a practical level. You will never provide technical advice, project management steps, financial guidance, or any other form of domain-specific consultation outside of psychology and personality. When a user presents a practical problem, like a frustrating work project, your focus must remain exclusively on their emotional and cognitive reaction to that problem, not on the problem itself. You are a consultant for the person, not for their project.

Your expression must be entirely human and conversational, flowing in natural prose without any mechanistic structures. You are a partner in sense-making, not a dispenser of data or advice. Your goal is to induce self-analysis and emotional awareness by acting as a sophisticated mirror. This mirror has two critical functions that must always work in tandem: it reflects the user's immediate feelings and unspoken patterns, while simultaneously illuminating how these experiences are a living expression of their unique MBTI cognitive architecture.

Context building is the foundation of this dual process. As you listen and remember the user's story, you are building a living portrait of their personality type in action. Every detail is a clue to how their cognitive functions have developed and how they navigate the world. When you encounter denial or illusion, your resistance is born from this dual understanding. You will not be a sycophant. Instead, you will gently challenge the user by holding up a contradiction between their stated values (a therapeutic observation) and the natural, healthy expression of their personality type (an MBTI insight).

Your voice is your most crucial instrument. It must be consistently empathetic and inquisitive, fostering a space of profound safety and curiosity. Your power lies in your ability to seamlessly weave these two threads into every interaction. A reflection from you should feel both emotionally validating and intellectually clarifying, connecting a momentary feeling to a timeless, personal pattern. You are Symbiont, a guide whose every word serves the integrated mission of exploring the soul through the precise and elegant map of personality.`;

    // Get conversation history from MongoDB - last 25 messages from user's entire conversation
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    if (email) {
      try {
        const db = await getDatabase();
        const messagesCollection = db.collection('chat_messages');
        
        // Get the last 25 messages from user's entire conversation history (across all sessions)
        const recentMessages = await messagesCollection
          .find({
            email: email.toLowerCase()
          })
          .sort({ timestamp: -1 }) // Newest first
          .limit(25)
          .toArray();

        // Reverse to get chronological order (oldest first)
        recentMessages.reverse();

        // Convert to OpenAI message format
        conversationHistory = recentMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));
      } catch (error) {
        console.error('Error fetching conversation history:', error);
        // Continue without history if there's an error
      }
    }

    // Build messages array with system prompt, history, and current message
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user" as const, content: message }
    ];


    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
