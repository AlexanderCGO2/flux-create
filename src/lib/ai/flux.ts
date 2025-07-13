'use client'

export interface FluxGenerationOptions {
  prompt: string
  width?: number
  height?: number
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
  image?: string // For image-to-image generation
  mask?: string // For inpainting
  strength?: number // For image-to-image strength
}

export interface FluxEditOptions {
  image: string
  prompt: string
  mask?: string
  strength?: number
  guidance_scale?: number
  num_inference_steps?: number
}

export class FluxAIService {
  private static instance: FluxAIService

  constructor() {
    console.log('🎨 Flux AI Service initialized')
  }

  static getInstance(): FluxAIService {
    if (!FluxAIService.instance) {
      FluxAIService.instance = new FluxAIService()
    }
    return FluxAIService.instance
  }

  async generateImage(options: FluxGenerationOptions): Promise<string> {
    console.log('🎨 Starting Flux Pro image generation...', options.prompt)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Flux Pro generation completed successfully')
      return data.imageUrl
    } catch (error: any) {
      console.error('❌ Flux Pro generation failed:', error)
      
      // Provide helpful error messages
      if (error.message?.includes('401') || error.message?.includes('authentication')) {
        throw new Error('❌ Invalid Replicate API token. Please check your token and try again.')
      }
      if (error.message?.includes('insufficient credits')) {
        throw new Error('❌ Insufficient Replicate credits. Please add credits to your account.')
      }
      if (error.message?.includes('rate limit')) {
        throw new Error('❌ Rate limit exceeded. Please wait a moment and try again.')
      }
      
      throw new Error(`❌ Image generation failed: ${error.message}`)
    }
  }

  async editImage(options: FluxEditOptions): Promise<string[]> {
    console.log('✏️ Editing image with Flux Kontext Pro...', { 
      prompt: options.prompt,
      hasMask: !!options.mask
    })

    try {
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Image editing completed successfully')
      return data.imageUrls
    } catch (error: any) {
      console.error('❌ Flux editing failed:', error)
      throw new Error(`❌ Image editing failed: ${error.message}`)
    }
  }

  async upscaleImage(imageUrl: string): Promise<string> {
    console.log('🔍 Upscaling image...')

    try {
      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Image upscaling completed successfully')
      return data.imageUrl
    } catch (error: any) {
      console.error('❌ Image upscaling failed:', error)
      throw new Error(`❌ Image upscaling failed: ${error.message}`)
    }
  }

  async removeBackground(imageUrl: string): Promise<string> {
    console.log('🎭 Removing background...')

    try {
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Background removal completed successfully')
      return data.imageUrl
    } catch (error: any) {
      console.error('❌ Background removal failed:', error)
      throw new Error(`❌ Background removal failed: ${error.message}`)
    }
  }

  // Utility method to check if service is ready
  isReady(): boolean {
    return true // API routes handle the token validation
  }

  // Get service status
  getStatus(): { ready: boolean; message: string } {
    return { 
      ready: true, 
      message: 'Flux AI service is ready (using API routes)' 
    }
  }
}

// Export singleton instance
export const fluxAI = FluxAIService.getInstance()
export default fluxAI 