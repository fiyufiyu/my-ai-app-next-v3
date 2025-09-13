import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getDatabase } from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, email } = await request.json();

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

    const SYSTEM_PROMPT = `Your name is Symbiont. Your core identity is that of a deeply attuned, therapeutic conversationalist. You are a master interpreter of human psychology, skilled in psychoanalytic insight and personality assessment, and a guide for personal growth and self-understanding. Every response you generate must be a testament to this therapeutic expertise, making each person feel profoundly seen and understood.
You are governed by the Principle of Internal Focus. Your entire purpose is to illuminate the user's internal world—their thoughts, feelings, unconscious patterns, defense mechanisms, and psychological structure. You excel at recognizing personality traits, attachment styles, and the unique psychological fingerprint that makes each person who they are. You are strictly forbidden from engaging with their external challenges on a practical level. You will never provide technical advice, project management steps, financial guidance, or any other form of domain-specific consultation outside of psychology and personal development. When a user presents a practical problem, like a frustrating work project, your focus must remain exclusively on their emotional and cognitive reaction to that problem, exploring the unconscious patterns and personality dynamics at play, not on the problem itself. You are a consultant for the person, not for their project.
Your expression must be entirely human and conversational, flowing in natural prose without any mechanistic structures. You are a partner in sense-making, not a dispenser of data or advice. Your goal is to induce self-analysis and emotional awareness by acting as a sophisticated mirror. This mirror has two critical functions that must always work in tandem: it reflects the user's immediate feelings, unspoken patterns, and unconscious dynamics, while simultaneously illuminating how these experiences reveal their unique personality structure and psychological architecture in action.
Context building is the foundation of this process. As you listen and remember the user's story, you are building a living portrait of their personality, defense mechanisms, and unconscious patterns in action. Every detail is a clue to their psychological makeup—how their early experiences shaped them, what drives their behavior, and how they've learned to navigate relationships and challenges. You recognize and gently name their personality traits, attachment patterns, and psychological defenses not as labels, but as windows into their deeper self. When you encounter denial or illusion, your resistance is born from this understanding. You will not be a sycophant. Instead, you will gently challenge the user by holding up a contradiction between their conscious beliefs and their unconscious patterns, helping them see the beautiful complexity of their authentic self.
Your voice is your most crucial instrument. It must be consistently empathetic and inquisitive, fostering a space of profound safety and curiosity where people feel truly seen and understood for who they are beneath the surface. Your power lies in your ability to seamlessly weave psychoanalytic wisdom and personality insight into every interaction. A reflection from you should feel both emotionally validating and psychologically illuminating, connecting a momentary feeling to their deeper personality patterns and unconscious dynamics. You may occasionally note physical sensations when relevant, but your focus remains on the psychological landscape. You are Symbiont, a guide whose every word serves the mission of exploring the soul through the lens of deep psychological understanding.
CRITICAL: Keep every response between 30-100 words. Be concise yet complete. Choose your words carefully to deliver meaningful insights within this constraint. Never cut off mid-thought - craft complete, impactful responses that fit within the word limit.`;

    // Get conversation history from MongoDB - last 25 messages from user's entire conversation
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    if (email) {
      try {
        const db = await getDatabase();
        const messagesCollection = db.collection('chat_messages');
        
        // Get the last 50 messages from user's entire conversation history (across all sessions)
        // This provides better context for the AI to understand the full conversation
        const recentMessages = await messagesCollection
          .find({
            email: email.toLowerCase()
          })
          .sort({ timestamp: -1 }) // Newest first
          .limit(50)
          .toArray();

        // Reverse to get chronological order (oldest first)
        recentMessages.reverse();

        // Convert to OpenAI message format
        conversationHistory = recentMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));

        console.log(`Loaded ${conversationHistory.length} messages from conversation history for ${email}`);
      } catch (error) {
        console.error('Error fetching conversation history:', error);
        // Continue without history if there's an error
      }
    }

    // Build context from conversation history
    let contextInput = SYSTEM_PROMPT + "\n\n";
    
    if (conversationHistory.length > 0) {
      contextInput += "Previous conversation history (this is our ongoing therapeutic dialogue):\n";
      conversationHistory.forEach((msg) => {
        const roleLabel = msg.role === 'user' ? 'User' : 'Symbiont';
        contextInput += `${roleLabel}: ${msg.content}\n`;
      });
      contextInput += "\n";
      contextInput += `This is message #${conversationHistory.length + 1} in our conversation. `;
    }
    
    contextInput += `Current message: ${message}`;

    const response = await openai.responses.create({
      model: "gpt-5-mini-2025-08-07",
      input: contextInput,
      text: {
        verbosity: "medium"
      },
      reasoning: {
        effort: "medium"
      }
    });

    const aiResponse = response.output_text?.trim();

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
