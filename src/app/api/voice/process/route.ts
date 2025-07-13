import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN || '',
})

interface VoiceCommand {
  action: string
  target?: string
  parameters?: Record<string, any>
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, context = {} } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: '❌ Voice transcript is required' },
        { status: 400 }
      )
    }

    console.log('🎤 Processing voice command:', transcript)

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_TOKEN) {
      console.log('⚠️ OpenAI API key not configured, using fallback parsing')
      const fallbackCommand = parseBasicCommands(transcript)
      return NextResponse.json({
        success: true,
        command: fallbackCommand,
        transcript,
        fallback: true,
        processed_at: new Date().toISOString()
      })
    }

    try {
      // Use OpenAI to interpret the voice command
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use the more cost-effective model
        messages: [
          {
            role: "system",
            content: `You are a voice command interpreter for an AI image editing application. 
            Parse natural language commands into structured actions.
            
            Available actions:
            - generate: Create new image from text
            - edit: Modify existing image
            - filter: Apply visual filters (vintage, bw, sepia, blur, sharpen, etc.)
            - adjust: Modify image properties (brightness, contrast, saturation, etc.)
            - crop: Crop image to specific area
            - rotate: Rotate image by degrees
            - flip: Flip horizontally or vertically
            - remove_background: Remove image background
            - inpaint: Fill masked areas with AI
            - enhance: Upscale or enhance image quality
            - save: Save current project
            - export: Export image in specific format
            - undo: Undo last action
            - redo: Redo last undone action
            - zoom: Zoom in/out on canvas
            - webcam: Start or capture webcam photo
            - upload: Upload image file
            - clear: Clear canvas
            - help: Show available commands
            
            Return JSON with: action, target (optional), parameters (optional), confidence (0-1)
            
            Examples:
            "Make it brighter" -> {"action": "adjust", "target": "brightness", "parameters": {"value": 20}, "confidence": 0.9}
            "Add vintage filter" -> {"action": "filter", "target": "vintage", "confidence": 0.95}
            "Generate a sunset" -> {"action": "generate", "parameters": {"prompt": "sunset"}, "confidence": 0.9}
            "Remove the background" -> {"action": "remove_background", "confidence": 0.95}
            "Rotate 90 degrees" -> {"action": "rotate", "parameters": {"angle": 90}, "confidence": 0.9}
            "Save this project" -> {"action": "save", "confidence": 0.95}
            "Take a photo" -> {"action": "webcam", "target": "capture", "confidence": 0.9}
            "Upload an image" -> {"action": "upload", "confidence": 0.9}
            
            Current context: ${JSON.stringify(context)}
            `
          },
          {
            role: "user",
            content: transcript
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })

      const responseText = completion.choices[0]?.message?.content
      if (!responseText) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response
      let command: VoiceCommand
      try {
        command = JSON.parse(responseText)
      } catch (parseError) {
        console.log('⚠️ Failed to parse OpenAI response, using fallback:', parseError)
        command = parseBasicCommands(transcript)
      }

      // Validate command structure
      if (!command.action || typeof command.confidence !== 'number') {
        throw new Error('Invalid command structure')
      }

      console.log('✅ Voice command processed:', command)

      return NextResponse.json({
        success: true,
        command,
        transcript,
        processed_at: new Date().toISOString()
      })

    } catch (openaiError) {
      console.error('❌ OpenAI processing failed, using fallback:', openaiError)
      const fallbackCommand = parseBasicCommands(transcript)
      
      return NextResponse.json({
        success: true,
        command: fallbackCommand,
        transcript,
        fallback: true,
        processed_at: new Date().toISOString()
      })
    }

  } catch (error: any) {
    console.error('❌ Voice processing error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || '❌ Failed to process voice command',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

// Enhanced fallback parser for basic commands
function parseBasicCommands(transcript: string): VoiceCommand {
  const text = transcript.toLowerCase().trim()
  
  // Generate/Create commands
  if (text.includes('generate') || text.includes('create')) {
    const prompt = text.replace(/generate|create|image|picture|an?\s+/gi, '').trim()
    return {
      action: 'generate',
      parameters: { prompt: prompt || 'a beautiful landscape' },
      confidence: 0.8
    }
  }
  
  // Brightness adjustments
  if (text.includes('brighter') || text.includes('brightness')) {
    const value = text.includes('much') || text.includes('very') ? 30 : 20
    return {
      action: 'adjust',
      target: 'brightness',
      parameters: { value },
      confidence: 0.9
    }
  }
  
  if (text.includes('darker') || text.includes('dim')) {
    const value = text.includes('much') || text.includes('very') ? -30 : -20
    return {
      action: 'adjust',
      target: 'brightness',
      parameters: { value },
      confidence: 0.9
    }
  }
  
  // Contrast adjustments
  if (text.includes('contrast')) {
    const value = text.includes('less') || text.includes('reduce') ? -20 : 20
    return {
      action: 'adjust',
      target: 'contrast',
      parameters: { value },
      confidence: 0.9
    }
  }
  
  // Filters
  if (text.includes('vintage') || text.includes('retro')) {
    return {
      action: 'filter',
      target: 'vintage',
      confidence: 0.9
    }
  }
  
  if (text.includes('black and white') || text.includes('grayscale') || text.includes('bw')) {
    return {
      action: 'filter',
      target: 'bw',
      confidence: 0.9
    }
  }
  
  if (text.includes('sepia')) {
    return {
      action: 'filter',
      target: 'sepia',
      confidence: 0.9
    }
  }
  
  if (text.includes('blur')) {
    return {
      action: 'filter',
      target: 'blur',
      confidence: 0.9
    }
  }
  
  if (text.includes('sharpen')) {
    return {
      action: 'filter',
      target: 'sharpen',
      confidence: 0.9
    }
  }
  
  // Background removal
  if (text.includes('remove background') || text.includes('background removal')) {
    return {
      action: 'remove_background',
      confidence: 0.95
    }
  }
  
  // Webcam commands
  if (text.includes('webcam') || text.includes('camera')) {
    if (text.includes('take') || text.includes('photo') || text.includes('capture')) {
      return {
        action: 'webcam',
        target: 'capture',
        confidence: 0.9
      }
    } else {
      return {
        action: 'webcam',
        target: 'start',
        confidence: 0.9
      }
    }
  }
  
  // Upload commands
  if (text.includes('upload') || text.includes('file') || text.includes('image file')) {
    return {
      action: 'upload',
      confidence: 0.9
    }
  }
  
  // Action commands
  if (text.includes('save')) {
    return {
      action: 'save',
      confidence: 0.95
    }
  }
  
  if (text.includes('export')) {
    const format = text.includes('jpg') || text.includes('jpeg') ? 'jpg' : 'png'
    return {
      action: 'export',
      parameters: { format },
      confidence: 0.9
    }
  }
  
  if (text.includes('undo')) {
    return {
      action: 'undo',
      confidence: 0.95
    }
  }
  
  if (text.includes('redo')) {
    return {
      action: 'redo',
      confidence: 0.95
    }
  }
  
  if (text.includes('clear')) {
    return {
      action: 'clear',
      confidence: 0.9
    }
  }
  
  // Rotation commands
  if (text.includes('rotate')) {
    let angle = 90 // default
    if (text.includes('180') || text.includes('around')) angle = 180
    if (text.includes('270') || text.includes('left')) angle = 270
    if (text.includes('45')) angle = 45
    
    return {
      action: 'rotate',
      parameters: { angle },
      confidence: 0.8
    }
  }
  
  // Flip commands
  if (text.includes('flip')) {
    const direction = text.includes('horizontal') || text.includes('left') || text.includes('right') ? 'horizontal' : 'vertical'
    return {
      action: 'flip',
      parameters: { direction },
      confidence: 0.9
    }
  }
  
  // Help command
  if (text.includes('help') || text.includes('commands')) {
    return {
      action: 'help',
      confidence: 0.95
    }
  }
  
  // Default: treat as generate command
  return {
    action: 'generate',
    parameters: { prompt: text },
    confidence: 0.6
  }
} 