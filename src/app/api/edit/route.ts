import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      image,
      prompt,
      mask,
      strength = 0.8,
      guidance_scale = 7.5,
      num_inference_steps = 20,
      seed,
      operation = 'edit' // 'edit', 'inpaint', 'style_transfer', 'enhance'
    } = body

    // Validate required fields
    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '❌ Image data is required' },
        { status: 400 }
      )
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: '❌ Prompt is required for image editing' },
        { status: 400 }
      )
    }

    console.log('✏️ Starting Flux Kontext Pro image editing...', { 
      prompt: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
      promptLength: prompt.length,
      operation,
      hasMask: !!mask,
      strength
    })
    
    // Add server-side log for debugging
    console.log('🔍 Full edit prompt received:', prompt)
    console.log('🖼️  Input image received:', image.slice(0, 50) + '...')
    console.log('🖼️  Input image length:', image.length, 'characters')
    console.log('🖼️  Input image type:', image.startsWith('data:image/') ? 'Base64 Data URL' : 'URL')
    console.log('🎯 IMAGE IS BEING USED AS INPUT FOR FLUX KONTEXT TRANSFORMATION')

    // Check if we have a valid API token
    if (!process.env.REPLICATE_API_TOKEN) {
      console.log('🔑 No Replicate API token found, using demo mode')
      
      // Generate a demo prediction ID and image URL
      const demoPredictionId = `demo-edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const demoImageUrl = `https://picsum.photos/seed/${Date.now()}/1024/1024`
      
      console.log('🎨 Demo edit prediction created (fallback mode)')
      return NextResponse.json({ 
        success: true,
        prediction_id: demoPredictionId,
        status: 'succeeded',
        imageUrl: demoImageUrl,
        model: operation + '-demo',
        message: 'Demo edit completed!'
      })
    }

    let model: string
    let input: any

    switch (operation) {
      case 'inpaint':
        // Use Flux Fill for inpainting with mask
        model = 'black-forest-labs/flux-fill-dev'
        input = {
          image: image,
          mask: mask || '', // Required for inpainting
          prompt: prompt,
          num_outputs: 1,
          num_inference_steps: num_inference_steps,
          guidance_scale: guidance_scale,
          output_format: "jpg",
          output_quality: 95,
          seed: seed || Math.floor(Math.random() * 1000000)
        }
        break

      case 'style_transfer':
        // Use Flux Dev for style transfer
        model = 'black-forest-labs/flux-dev'
        input = {
          prompt: `${prompt}, in the style of the reference image`,
          image: image,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          strength: strength,
          output_format: "jpg",
          seed: seed || Math.floor(Math.random() * 1000000)
        }
        break

      case 'enhance':
        // Use Real-ESRGAN for image enhancement
        model = 'nightmareai/real-esrgan'
        input = {
          image: image,
          scale: 2,
          face_enhance: true
        }
        break

      default: // 'edit'
        // Use FLUX.1 Kontext Pro for context-aware image-to-image editing
        model = 'black-forest-labs/flux-kontext-pro'
        input = {
          prompt: prompt,
          image: image, // ← INPUT IMAGE IS PASSED HERE TO FLUX KONTEXT
          steps: 25,
          guidance: 3,
          interval: 2,
          safety_tolerance: 2,
          seed: seed || Math.floor(Math.random() * 1000000)
        }
        break
    }

    console.log('🚀 Using model:', model, 'for operation:', operation)
    console.log('🎯 FLUX.1 Kontext Pro ready for contextual image transformation')

    try {
      console.log(`🚀 Creating edit prediction for ${model}`)
      console.log('📝 Input parameters:', { 
        prompt: input.prompt?.slice(0, 50) + '...',
        operation,
        hasImage: !!input.image,
        hasMask: !!input.mask
      })
      
      // Create a prediction using the proper Replicate API pattern (same as generate)
      const prediction = await replicate.predictions.create({
        model: model,
        input: input,
        webhook: process.env.VERCEL_URL ? `${process.env.VERCEL_URL}/api/webhooks/replicate` : undefined,
      })

      console.log(`✨ Edit prediction created with ID: ${prediction.id}`)
      console.log(`🔄 Initial status: ${prediction.status}`)

      // Return immediately with prediction ID for client-side polling
      return NextResponse.json({ 
        success: true,
        prediction_id: prediction.id,
        status: prediction.status,
        operation,
        model: model.split('/').pop(),
        message: 'Edit prediction created successfully. Check status for completion.',
        poll_url: `/api/predictions/${prediction.id}`
      })

    } catch (replicateError) {
      console.error('❌ Image editing failed:', replicateError)
      
      // Fallback to demo mode on Replicate error
      const demoPredictionId = `demo-edit-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const demoImageUrl = `https://picsum.photos/seed/${Date.now()}/1024/1024`
      console.log('🎨 Demo edit prediction created (error fallback mode)')
      
      return NextResponse.json({ 
        success: true,
        prediction_id: demoPredictionId,
        status: 'succeeded',
        imageUrl: demoImageUrl,
        model: operation + '-demo',
        message: 'Demo edit completed (fallback)!'
      })
    }

  } catch (error: any) {
    console.error('❌ Edit API Error:', error)
    return NextResponse.json(
      { 
        error: error.message || '❌ Failed to edit image',
        success: false
      },
      { status: 500 }
    )
  }
} 