import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const predictionId = params.id

    if (!predictionId) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
        { status: 400 }
      )
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
        { error: 'Replicate API token not configured' },
      { status: 500 }
      )
  }

    console.log(`🔍 Checking prediction status for ID: ${predictionId}`)

    const prediction = await replicate.predictions.get(predictionId)

    console.log(`📊 Prediction ${predictionId} status: ${prediction.status}`)

    // Return the prediction data
    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      logs: prediction.logs,
      created_at: prediction.created_at,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
    })

  } catch (error) {
    console.error('❌ Error fetching prediction:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch prediction',
        success: false 
      }, 
      { status: 500 }
    )
  }
} 