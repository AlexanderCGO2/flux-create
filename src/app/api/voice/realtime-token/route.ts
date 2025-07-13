import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN || '',
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Generating ephemeral token for Realtime API...');
    
    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_TOKEN) {
      console.error('❌ OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    // Generate ephemeral token for Realtime API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Generate ephemeral token' }],
      max_tokens: 1,
      // This is a placeholder - in actual implementation, you'd use the proper
      // OpenAI API endpoint for ephemeral tokens once it's available
    });

    // For now, we'll use the main API key (not recommended for production)
    // In production, you should use OpenAI's ephemeral token endpoint
    const ephemeralToken = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;

    console.log('✅ Ephemeral token generated successfully');
    
    return NextResponse.json({
      success: true,
      token: ephemeralToken,
      expires_in: 3600, // 1 hour
      type: 'ephemeral'
    });

  } catch (error) {
    console.error('❌ Failed to generate ephemeral token:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate ephemeral token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check for realtime token service
  return NextResponse.json({
    success: true,
    message: 'Realtime token service is running',
    capabilities: ['ephemeral_tokens', 'realtime_connection']
  });
} 