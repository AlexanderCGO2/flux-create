import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = (process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN) ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN,
}) : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      action, 
      audioData, 
      text,
      voice = "alloy",
      model = "whisper-1"
    } = body

    console.log('🎤 Voice API called with action:', action)
    console.log('🔑 API Key Status:', {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasOpenAIToken: !!process.env.OPENAI_API_TOKEN,
      openaiConfigured: !!openai,
      keyLength: process.env.OPENAI_API_KEY?.length || process.env.OPENAI_API_TOKEN?.length || 0
    })

    switch (action) {
      case 'transcribe':
        // Speech-to-text using Whisper
        if (!audioData) {
          return NextResponse.json(
            { error: 'Audio data is required for transcription' },
            { status: 400 }
          )
        }

        try {
          if (!openai) {
            return NextResponse.json(
              { error: 'OpenAI API not configured' },
              { status: 503 }
            )
          }

          console.log('🎤 Starting speech-to-text transcription...')
          
          // Convert base64 audio data to buffer
          const audioBuffer = Buffer.from(audioData.split(',')[1], 'base64')
          const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' })

          const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: model,
            language: 'en',
            response_format: 'json',
          })

          console.log('✅ Transcription completed:', transcription.text)
          
          return NextResponse.json({
            success: true,
            text: transcription.text,
            action: 'transcribe'
          })
        } catch (transcriptionError) {
          console.error('❌ Transcription failed:', transcriptionError)
          return NextResponse.json(
            { error: 'Transcription failed', details: transcriptionError },
            { status: 500 }
          )
        }

      case 'synthesize':
        // Text-to-speech using OpenAI TTS
        if (!text) {
          return NextResponse.json(
            { error: 'Text is required for speech synthesis' },
            { status: 400 }
          )
        }

        try {
          if (!openai) {
            return NextResponse.json(
              { error: 'OpenAI API not configured' },
              { status: 503 }
            )
          }

          console.log('🔊 Starting text-to-speech synthesis...')
          
          const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as any,
            input: text,
            response_format: 'mp3',
          })

          const buffer = Buffer.from(await mp3.arrayBuffer())
          const audioBase64 = buffer.toString('base64')
          const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`

          console.log('✅ Speech synthesis completed')
          
          return NextResponse.json({
            success: true,
            audioUrl: audioDataUrl,
            action: 'synthesize'
          })
        } catch (synthesisError) {
          console.error('❌ Speech synthesis failed:', synthesisError)
          return NextResponse.json(
            { error: 'Speech synthesis failed', details: synthesisError },
            { status: 500 }
          )
        }

      case 'realtime':
        // For WebSocket realtime communication (handled separately)
        return NextResponse.json({
          success: true,
          message: 'Use WebSocket endpoint for realtime communication',
          wsUrl: '/api/voice/ws'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: transcribe, synthesize, or realtime' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Voice API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Voice API error',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'Voice API is running',
    features: ['transcribe', 'synthesize', 'realtime'],
    models: {
      speech_to_text: 'whisper-1',
      text_to_speech: 'tts-1',
      voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    }
  })
} 