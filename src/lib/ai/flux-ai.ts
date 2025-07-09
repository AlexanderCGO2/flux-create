import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// API configuration
const FLUX_API_BASE = process.env.NEXT_PUBLIC_FLUX_API_BASE || 'https://api.flux.ai';
const FLUX_API_KEY = process.env.FLUX_API_KEY || '';

// Flux model configurations
export const FLUX_MODELS = {
  'flux-schnell': {
    name: 'Flux Schnell',
    description: 'Fast generation, good for quick prototypes',
    maxResolution: '1024x1024',
    avgTime: '2-4 seconds',
    cost: 0.003
  },
  'flux-dev': {
    name: 'Flux Dev',
    description: 'Balanced quality and speed for development',
    maxResolution: '1024x1024',
    avgTime: '4-8 seconds',
    cost: 0.005
  },
  'flux-pro': {
    name: 'Flux Pro',
    description: 'Highest quality, professional results',
    maxResolution: '2048x2048',
    avgTime: '8-15 seconds',
    cost: 0.015
  }
};

// Request/Response schemas
const ImageGenerationRequest = z.object({
  prompt: z.string(),
  model: z.enum(['flux-schnell', 'flux-dev', 'flux-pro']),
  width: z.number().min(256).max(2048),
  height: z.number().min(256).max(2048),
  steps: z.number().min(1).max(50).optional(),
  guidance: z.number().min(1).max(20).optional(),
  seed: z.number().optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
  stylePreset: z.string().optional(),
  negativePrompt: z.string().optional()
});

const ImageEnhancementRequest = z.object({
  imageData: z.string(), // base64 encoded image
  operation: z.enum(['upscale', 'enhance', 'denoise', 'colorize', 'restore']),
  strength: z.number().min(0.1).max(1.0).optional(),
  model: z.enum(['flux-schnell', 'flux-dev', 'flux-pro']),
  preserveDetails: z.boolean().optional()
});

const VoiceCommandSchema = z.object({
  action: z.enum(['generate', 'enhance', 'adjust', 'filter', 'transform']),
  target: z.string(),
  parameters: z.record(z.any()),
  confidence: z.number().min(0).max(1)
});

// AI Service Class
export class FluxAI {
  private apiKey: string;
  private baseUrl: string;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || FLUX_API_KEY;
    this.baseUrl = baseUrl || FLUX_API_BASE;
  }

  // Voice command processing
  async processVoiceCommand(transcript: string): Promise<any> {
    console.log('Processing voice command:', transcript);
    
    try {
      // Use OpenAI to understand the voice command
      const result = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: VoiceCommandSchema,
        prompt: `
          Parse this voice command for image editing: "${transcript}"
          
          Identify the action (generate, enhance, adjust, filter, transform) and extract parameters.
          
          Examples:
          - "make it brighter" -> action: adjust, target: brightness, parameters: {value: 0.2}
          - "generate a sunset background" -> action: generate, target: background, parameters: {prompt: "sunset background"}
          - "apply vintage filter" -> action: filter, target: vintage, parameters: {type: "vintage"}
          - "crop the image" -> action: transform, target: crop, parameters: {operation: "crop"}
          - "remove the person" -> action: enhance, target: object-removal, parameters: {object: "person"}
          
          Return confidence score based on how clear the command is.
        `
      });

      console.log('Voice command parsed:', result.object);
      return result.object;
    } catch (error) {
      console.error('Voice command processing error:', error);
      throw new Error('Failed to process voice command');
    }
  }

  // Image generation
  async generateImage(params: z.infer<typeof ImageGenerationRequest>): Promise<{
    imageUrl: string;
    imageData: string;
    metadata: any;
  }> {
    console.log('Generating image with Flux AI:', params);
    
    const validatedParams = ImageGenerationRequest.parse(params);
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          ...validatedParams,
          response_format: 'b64_json'
        })
      });

      if (!response.ok) {
        throw new Error(`Flux API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        imageUrl: `data:image/png;base64,${data.data[0].b64_json}`,
        imageData: data.data[0].b64_json,
        metadata: {
          model: validatedParams.model,
          prompt: validatedParams.prompt,
          resolution: `${validatedParams.width}x${validatedParams.height}`,
          generatedAt: new Date().toISOString(),
          cost: FLUX_MODELS[validatedParams.model].cost
        }
      };
    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error('Failed to generate image');
    }
  }

  // Image enhancement
  async enhanceImage(params: z.infer<typeof ImageEnhancementRequest>): Promise<{
    imageUrl: string;
    imageData: string;
    metadata: any;
  }> {
    console.log('Enhancing image:', params.operation);
    
    const validatedParams = ImageEnhancementRequest.parse(params);
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/images/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          image: validatedParams.imageData,
          operation: validatedParams.operation,
          strength: validatedParams.strength || 0.7,
          model: validatedParams.model,
          preserve_details: validatedParams.preserveDetails || true
        })
      });

      if (!response.ok) {
        throw new Error(`Flux API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        imageUrl: `data:image/png;base64,${data.image}`,
        imageData: data.image,
        metadata: {
          operation: validatedParams.operation,
          model: validatedParams.model,
          strength: validatedParams.strength,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Image enhancement error:', error);
      throw new Error('Failed to enhance image');
    }
  }

  // Smart prompt generation from natural language
  async generatePromptFromVoice(naturalLanguage: string): Promise<string> {
    console.log('Generating prompt from voice:', naturalLanguage);
    
    try {
      const result = await generateText({
        model: openai('gpt-4-turbo'),
        prompt: `
          Convert this natural language description into a detailed image generation prompt:
          "${naturalLanguage}"
          
          Create a detailed, artistic prompt that would work well with AI image generation.
          Include style, composition, lighting, and quality keywords.
          
          Examples:
          - "sunset over mountains" -> "Beautiful sunset over majestic mountains, golden hour lighting, dramatic clouds, landscape photography, high resolution, cinematic composition"
          - "modern office space" -> "Modern minimalist office interior, clean lines, natural lighting, contemporary furniture, professional atmosphere, architectural photography"
          
          Return only the enhanced prompt, no explanations.
        `
      });

      console.log('Generated prompt:', result.text);
      return result.text;
    } catch (error) {
      console.error('Prompt generation error:', error);
      return naturalLanguage; // Fallback to original
    }
  }

  // Background removal
  async removeBackground(imageData: string): Promise<{
    imageUrl: string;
    imageData: string;
    mask: string;
  }> {
    console.log('Removing background from image');
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/images/remove-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          image: imageData,
          return_mask: true
        })
      });

      if (!response.ok) {
        throw new Error(`Background removal error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        imageUrl: `data:image/png;base64,${data.image}`,
        imageData: data.image,
        mask: data.mask
      };
    } catch (error) {
      console.error('Background removal error:', error);
      throw new Error('Failed to remove background');
    }
  }

  // Object removal/inpainting
  async removeObject(imageData: string, maskData: string, prompt?: string): Promise<{
    imageUrl: string;
    imageData: string;
  }> {
    console.log('Removing object from image');
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/images/inpaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          image: imageData,
          mask: maskData,
          prompt: prompt || 'remove object, fill with background',
          model: 'flux-pro'
        })
      });

      if (!response.ok) {
        throw new Error(`Object removal error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        imageUrl: `data:image/png;base64,${data.image}`,
        imageData: data.image
      };
    } catch (error) {
      console.error('Object removal error:', error);
      throw new Error('Failed to remove object');
    }
  }

  // Style transfer
  async applyStyle(imageData: string, stylePrompt: string): Promise<{
    imageUrl: string;
    imageData: string;
  }> {
    console.log('Applying style:', stylePrompt);
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/images/style-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          image: imageData,
          style_prompt: stylePrompt,
          strength: 0.7,
          model: 'flux-dev'
        })
      });

      if (!response.ok) {
        throw new Error(`Style transfer error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        imageUrl: `data:image/png;base64,${data.image}`,
        imageData: data.image
      };
    } catch (error) {
      console.error('Style transfer error:', error);
      throw new Error('Failed to apply style');
    }
  }

  // Batch processing for multiple operations
  async batchProcess(operations: Array<{
    type: 'generate' | 'enhance' | 'style' | 'remove-bg';
    params: any;
  }>): Promise<Array<{ success: boolean; result?: any; error?: string }>> {
    console.log('Processing batch operations:', operations.length);
    
    const results: Array<{ success: boolean; result?: any; error?: string }> = [];
    
    for (const operation of operations) {
      try {
        let result;
        
        switch (operation.type) {
          case 'generate':
            result = await this.generateImage(operation.params);
            break;
          case 'enhance':
            result = await this.enhanceImage(operation.params);
            break;
          case 'style':
            result = await this.applyStyle(operation.params.imageData, operation.params.stylePrompt);
            break;
          case 'remove-bg':
            result = await this.removeBackground(operation.params.imageData);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        
        results.push({ success: true, result });
      } catch (error) {
        console.error(`Batch operation failed:`, error);
        results.push({ success: false, error: (error as Error).message });
      }
    }
    
    return results;
  }

  // Get model information
  getModelInfo(modelId: string) {
    return FLUX_MODELS[modelId] || null;
  }

  // Check API health
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get usage statistics
  async getUsage(): Promise<{
    imagesGenerated: number;
    tokensUsed: number;
    costThisMonth: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/usage`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get usage stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Usage stats error:', error);
      return { imagesGenerated: 0, tokensUsed: 0, costThisMonth: 0 };
    }
  }
}

// Export singleton instance
export const fluxAI = new FluxAI();

// Voice command helpers
export const VOICE_COMMANDS = {
  GENERATION: [
    'generate',
    'create',
    'make',
    'draw',
    'produce',
    'design'
  ],
  ENHANCEMENT: [
    'enhance',
    'improve',
    'upgrade',
    'refine',
    'polish'
  ],
  ADJUSTMENT: [
    'adjust',
    'change',
    'modify',
    'alter',
    'tweak'
  ],
  FILTER: [
    'filter',
    'effect',
    'style',
    'apply'
  ],
  REMOVAL: [
    'remove',
    'delete',
    'erase',
    'clear'
  ]
};

// Educational content for KI Academy integration
export const AI_TUTORIALS = {
  'voice-basics': {
    title: 'Voice Command Basics',
    description: 'Learn fundamental voice commands for image editing',
    lessons: [
      'Activating voice control',
      'Basic adjustment commands',
      'Image generation prompts',
      'Tool selection via voice'
    ]
  },
  'ai-generation': {
    title: 'AI Image Generation',
    description: 'Master prompt engineering and generation techniques',
    lessons: [
      'Writing effective prompts',
      'Understanding model differences',
      'Style and composition control',
      'Advanced generation techniques'
    ]
  },
  'accessibility': {
    title: 'Accessible Design',
    description: 'Create inclusive designs with voice control',
    lessons: [
      'Voice navigation techniques',
      'Screen reader compatibility',
      'Keyboard shortcuts',
      'High contrast modes'
    ]
  }
};

// Voice command processing utilities
export function extractVoiceIntent(transcript: string): {
  action: string;
  confidence: number;
  parameters: Record<string, any>;
} {
  const lowerTranscript = transcript.toLowerCase();
  
  // Simple intent detection (would be enhanced with ML)
  const intents = {
    generate: VOICE_COMMANDS.GENERATION.some(cmd => lowerTranscript.includes(cmd)),
    enhance: VOICE_COMMANDS.ENHANCEMENT.some(cmd => lowerTranscript.includes(cmd)),
    adjust: VOICE_COMMANDS.ADJUSTMENT.some(cmd => lowerTranscript.includes(cmd)),
    filter: VOICE_COMMANDS.FILTER.some(cmd => lowerTranscript.includes(cmd)),
    remove: VOICE_COMMANDS.REMOVAL.some(cmd => lowerTranscript.includes(cmd))
  };
  
  // Find the strongest intent
  const detectedAction = Object.entries(intents).find(([_, detected]) => detected)?.[0] || 'unknown';
  
  return {
    action: detectedAction,
    confidence: 0.8, // Would be calculated based on ML model
    parameters: {
      originalText: transcript,
      detectedWords: lowerTranscript.split(' ')
    }
  };
}