import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Voice service diagnostics...');
    
    // Check environment variables
    const hasOpenAIKey = !!(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
    const openAIKeySource = process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : 
                           process.env.OPENAI_API_TOKEN ? 'OPENAI_API_TOKEN' : 'none';
    
    // Check browser capabilities
    const diagnostics = {
      environment: {
        hasOpenAIKey,
        openAIKeySource,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      },
      recommendations: [] as string[]
    };

    // Add recommendations based on issues
    if (!hasOpenAIKey) {
      diagnostics.recommendations.push(
        'Missing OpenAI API key. Please create a .env.local file with OPENAI_API_KEY=your-key-here'
      );
    }

    console.log('✅ Voice diagnostics completed:', diagnostics);
    
    return NextResponse.json({
      success: true,
      status: hasOpenAIKey ? 'ready' : 'configuration_needed',
      diagnostics,
      instructions: {
        setupSteps: [
          '1. Create a .env.local file in your project root',
          '2. Add: OPENAI_API_KEY=your-openai-api-key-here',
          '3. Get your API key from: https://platform.openai.com/api-keys',
          '4. Restart your development server',
          '5. Refresh this page to test again'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Voice diagnostics failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Diagnostics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 