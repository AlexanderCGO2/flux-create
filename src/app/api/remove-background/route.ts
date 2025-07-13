import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, model_type = 'general' } = body

    // Validate required fields
    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '❌ Image data is required' },
        { status: 400 }
      )
    }

    console.log('🎭 Starting background removal...', { 
      model_type,
      imageLength: image.length 
    })

    // Use the proven working REMBG model with exact version from your cURL command
    const output = await replicate.run(
      'lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1' as `${string}/${string}:${string}`,
      {
        input: {
          image: image
        }
      }
    )

    console.log('✅ Background removal completed successfully')
    console.log('🔍 Raw output type:', typeof output, 'Output:', output)
    
    // Handle output format - Replicate can return various formats
    let imageUrl: string
    if (typeof output === 'string') {
      imageUrl = output
    } else if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0]
    } else if (output && typeof output === 'object' && 'url' in output) {
      imageUrl = (output as any).url
    } else if (output && typeof output === 'object' && 'image' in output) {
      imageUrl = (output as any).image
    } else {
      console.error('❌ Unexpected output format:', { output, type: typeof output })
      // Try to extract any URL-like string from the output
      const outputStr = JSON.stringify(output)
      const urlMatch = outputStr.match(/https?:\/\/[^\s"]+/)
      if (urlMatch) {
        imageUrl = urlMatch[0]
        console.log('✅ Extracted URL from output:', imageUrl)
      } else {
        throw new Error(`Unexpected output format from background removal: ${typeof output}`)
      }
    }

    return NextResponse.json({ 
      success: true,
      imageUrl,
      model_type
    })

  } catch (error: any) {
    console.error('❌ Background removal error:', error)
    return NextResponse.json(
      { 
        error: error.message || '❌ Failed to remove background',
        details: error.toString()
      },
      { status: 500 }
    )
  }
} 