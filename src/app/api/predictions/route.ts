import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// In production and preview deployments (on Vercel), the VERCEL_URL environment variable is set.
// In development (on your local machine), the NGROK_HOST environment variable is set.
const WEBHOOK_HOST = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NGROK_HOST;

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.log('🔑 No Replicate API token found, using demo mode');
    
    // Return a demo response structure that mimics a prediction
    const demoImageUrl = `https://picsum.photos/seed/${Date.now()}/1024/1024`;
    
    return NextResponse.json({
      id: `demo-${Date.now()}`,
      status: "succeeded",
      output: [demoImageUrl],
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      model: "flux-dev-demo",
      urls: {
        get: `/api/predictions/demo-${Date.now()}`
      }
    }, { status: 201 });
  }

  try {
    const body = await request.json();
    const { 
      prompt, 
      input_image = null,
      width = 1024,
      height = 1024,
      mode = 'generate'
    } = body;

    console.log('🎨 Creating prediction for prompt:', prompt.slice(0, 50) + '...');

    // Determine model and input based on mode
    let modelId: string;
    let modelInput: any;

    if (input_image && mode === 'edit') {
      // Use Flux Dev for image-to-image
      modelId = 'black-forest-labs/flux-dev';
      modelInput = {
        prompt,
        image: input_image, // Use 'image' parameter instead of 'input_image'
        num_inference_steps: 28,
        guidance_scale: 3.5,
        width,
        height,
        output_format: "jpg",
        seed: Math.floor(Math.random() * 1000000)
      };
      console.log('🔄 Using Flux Dev for image-to-image');
    } else {
      // Use Flux Dev for text-to-image (working model)
      modelId = 'black-forest-labs/flux-dev';
      modelInput = {
        prompt,
        width,
        height,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        output_format: "jpg",
        seed: Math.floor(Math.random() * 1000000)
      };
      console.log('🎨 Using Flux Dev for text-to-image');
    }

    const options: any = {
      model: modelId,
      input: modelInput
    };

    if (WEBHOOK_HOST) {
      options.webhook = `${WEBHOOK_HOST}/api/webhooks`;
      options.webhook_events_filter = ["start", "completed"];
    }

    console.log('🚀 Creating prediction with options:', {
      model: modelId,
      input: modelInput
    });

    // A prediction is the result you get when you run a model
    const prediction = await replicate.predictions.create(options);

    if (prediction?.error) {
      return NextResponse.json({ detail: prediction.error }, { status: 500 });
    }

    console.log('✅ Prediction created successfully:', prediction.id);
    return NextResponse.json(prediction, { status: 201 });

  } catch (error) {
    console.error('❌ Prediction creation failed:', error);
    return NextResponse.json(
      { 
        detail: error instanceof Error ? error.message : 'Failed to create prediction'
      }, 
      { status: 500 }
    );
  }
} 