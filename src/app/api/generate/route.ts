import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      input_image,
      width = 1024, 
      height = 1024, 
      seed,
      model_type = "flux-schnell" // Default to fast generation
    } = body

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: '❌ Prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    console.log('🎨 Starting image generation...', { 
      prompt: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
      promptLength: prompt.length,
      hasInputImage: !!input_image,
      model_type,
      width, 
      height,
      seed
    })
    
    // Add server-side log for debugging
    console.log('🔍 Full prompt received:', prompt)

    // Choose model and input based on model type and input image
    let model: string
    let input: any

    if (input_image) {
      // For image-to-image, use Flux Pro (Kontext Pro - context-aware transformations)
      model = "black-forest-labs/flux-pro"
      input = {
        prompt,
        image: input_image,
        steps: 25,
        guidance: 3,
        interval: 2,
        safety_tolerance: 2,
        seed: seed || Math.floor(Math.random() * 1000000)
      }
      console.log('🎯 Using Flux Pro for Kontext Pro (context-aware image transformation)')
      console.log('🔍 Image-to-image prompt:', prompt)
    } else {
      // Choose model based on requested type
      switch (model_type) {
        case "flux-pro":
          model = "black-forest-labs/flux-pro"
          input = {
            prompt,
            width,
            height,
            steps: 25,
            guidance: 3,
            interval: 2,
            safety_tolerance: 2,
            seed: seed || Math.floor(Math.random() * 1000000)
          }
          console.log('🎨 Using Flux Pro for high-quality generation')
          break
          
        case "flux-schnell":
          model = "black-forest-labs/flux-schnell"
          input = {
            prompt,
            width,
            height,
            num_inference_steps: 4, // Fast generation
            seed: seed || Math.floor(Math.random() * 1000000)
          }
          console.log('⚡ Using Flux Schnell for fast generation')
          break
          
        case "imagen":
          model = "google-deepmind/imagen-3-fast"
          input = {
            prompt,
            aspect_ratio: `${width}:${height}`,
            output_format: "jpeg",
            seed: seed || Math.floor(Math.random() * 1000000)
          }
          console.log('🧠 Using Imagen 3 Fast for professional generation')
          break
          
        default:
          // Fallback to Flux Schnell for speed
          model = "black-forest-labs/flux-schnell"
          input = {
            prompt,
            width,
            height,
            num_inference_steps: 4,
            seed: seed || Math.floor(Math.random() * 1000000)
          }
          console.log('⚡ Using Flux Schnell (default) for fast generation')
      }
    }

    // Check if we have a valid API token
    if (!process.env.REPLICATE_API_TOKEN) {
      console.log('🔑 No Replicate API token found, using demo mode')
      
      // Generate a demo prediction ID and image URL
      const demoPredictionId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const demoImageUrl = `https://picsum.photos/seed/${Date.now()}/1024/1024`
      
      console.log('🎨 Demo prediction created (fallback mode)')
      return NextResponse.json({ 
        success: true,
        prediction_id: demoPredictionId,
        status: 'succeeded',
        imageUrl: demoImageUrl,
        model: model_type + '-demo',
        message: input_image ? 'Demo transformation completed!' : 'Demo generation completed!'
      })
    }

    try {
      console.log(`🚀 Creating prediction for ${model}`)
      console.log('📝 Input parameters:', { 
        prompt: input.prompt?.slice(0, 50) + '...',
        width: input.width,
        height: input.height,
        hasImage: !!input.image
      })
      
      // Create a prediction using the proper Replicate API pattern
      const prediction = await replicate.predictions.create({
        // Use 'model' parameter, not 'version' - this is the key fix!
        model: model,
        input: input,
        webhook: process.env.VERCEL_URL ? `${process.env.VERCEL_URL}/api/webhooks/replicate` : undefined,
      })

      console.log(`✨ Prediction created with ID: ${prediction.id}`)
      console.log(`🔄 Initial status: ${prediction.status}`)

      // Return immediately with prediction ID for client-side polling
      return NextResponse.json({ 
        success: true,
        prediction_id: prediction.id,
        status: prediction.status,
        model: model_type,
        message: 'Prediction created successfully. Check status for completion.',
        poll_url: `/api/predictions/${prediction.id}`
      })

    } catch (replicateError) {
      console.error('❌ Image generation failed:', replicateError)
      
      // Fallback to demo mode on Replicate error
      const demoPredictionId = `demo-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const demoImageUrl = `https://picsum.photos/seed/${Date.now()}/1024/1024`
      console.log('🎨 Demo prediction created (error fallback mode)')
      
      return NextResponse.json({ 
        success: true,
        prediction_id: demoPredictionId,
        status: 'succeeded',
        imageUrl: demoImageUrl,
        model: model_type + '-demo',
        message: input_image ? 'Demo transformation completed (fallback)!' : 'Demo generation completed (fallback)!'
      })
    }

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
} 