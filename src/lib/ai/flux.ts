'use client'

import Replicate from 'replicate'

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

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
  private isInitialized = false

  constructor() {
    // Check for environment variable in multiple contexts
    const token = process.env.REPLICATE_API_TOKEN || 
                  (typeof window !== 'undefined' ? (window as any).__REPLICATE_TOKEN__ : null)
    
    this.isInitialized = !!token
    
    if (this.isInitialized) {
      console.log('✅ Replicate API token found and initialized')
    } else {
      console.log('🔑 Replicate API token not found. Please set REPLICATE_API_TOKEN environment variable.')
    }
  }

  static getInstance(): FluxAIService {
    if (!FluxAIService.instance) {
      FluxAIService.instance = new FluxAIService()
    }
    return FluxAIService.instance
  }

  async generateImage(options: FluxGenerationOptions): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('⚠️ Replicate API token not configured. Please set REPLICATE_API_TOKEN environment variable or create a .env.local file with your token.')
    }

    console.log('🎨 Starting Flux Pro image generation...', options.prompt)

    try {
      const output = await replicate.run(
        "black-forest-labs/flux-kontext-pro:637a4f3a0a7b20d3e4aac7b1e1a5a7f0e1b2c3d4e5f6789abcdef0123456789abc",
        {
          input: {
            prompt: options.prompt,
            width: options.width || 1024,
            height: options.height || 1024,
            num_inference_steps: options.num_inference_steps || 50,
            guidance_scale: options.guidance_scale || 7.5,
            seed: options.seed,
            ...(options.image && { image: options.image }),
            ...(options.mask && { mask: options.mask }),
            ...(options.strength && { strength: options.strength }),
          }
        }
      ) as unknown as string[]

      const imageUrl = Array.isArray(output) ? output[0] : output as string
      console.log('✅ Flux Pro generation completed successfully')
      return imageUrl
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
    if (!this.isInitialized) {
      throw new Error('Replicate API token not configured')
    }

    console.log('✏️ Editing image with Flux Kontext Pro...', { 
      prompt: options.prompt,
      hasMask: !!options.mask
    })

    try {
      const output = await replicate.run(
        "black-forest-labs/flux-kontext-pro:13a79db7306ceb4ccdc08edfee73f84cb8ce4d1a9dcd91c73e27d7ee7b9f9e83",
        {
          input: {
            image: options.image,
            prompt: options.prompt,
            mask: options.mask,
            strength: options.strength || 0.75,
            guidance_scale: options.guidance_scale || 3.5,
            num_inference_steps: options.num_inference_steps || 30,
            output_format: "png",
            output_quality: 100
          }
        }
      ) as string[]

      console.log('✅ Image editing completed successfully')
      return Array.isArray(output) ? output : [output as string]
    } catch (error) {
      console.error('❌ Flux editing failed:', error)
      throw new Error(`Image editing failed: ${error}`)
    }
  }

  async upscaleImage(imageUrl: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Replicate API token not configured')
    }

    console.log('🔍 Upscaling image...')

    try {
      const output = await replicate.run(
        "jingyunliang/swinir:660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9c8f9d47a021a",
        {
          input: {
            image: imageUrl,
            task: "real_sr",
            scale: 4
          }
        }
      ) as unknown as string

      console.log('✅ Image upscaling completed successfully')
      return output
    } catch (error) {
      console.error('❌ Image upscaling failed:', error)
      throw new Error(`Image upscaling failed: ${error}`)
    }
  }

  async removeBackground(imageUrl: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Replicate API token not configured')
    }

    console.log('🎭 Removing background...')

    try {
      const output = await replicate.run(
        "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        {
          input: {
            image: imageUrl
          }
        }
      ) as unknown as string

      console.log('✅ Background removal completed successfully')
      return output
    } catch (error) {
      console.error('❌ Background removal failed:', error)
      throw new Error(`Background removal failed: ${error}`)
    }
  }

  // Utility method to check if service is ready
  isReady(): boolean {
    return this.isInitialized
  }

  // Get service status
  getStatus(): { ready: boolean; message: string } {
    if (this.isInitialized) {
      return { ready: true, message: 'Flux AI service is ready' }
    } else {
      return { 
        ready: false, 
        message: 'Replicate API token not configured. Please set REPLICATE_API_TOKEN environment variable.' 
      }
    }
  }
}

// Export singleton instance
export const fluxAI = FluxAIService.getInstance() 