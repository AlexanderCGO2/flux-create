import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  console.log('🧪 Test endpoint called')
  
  return NextResponse.json({
    success: true,
    message: '✅ FluxCreate API is working perfectly!',
    timestamp: new Date().toISOString(),
    status: 'operational',
    services: {
      nextjs: 'running',
      api_routes: 'operational',
      flux_integration: 'ready'
    },
    version: '1.0.0'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🧪 Test POST with body:', body)
    
    return NextResponse.json({
      success: true,
      message: '✅ POST endpoint working!',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse JSON body'
    }, { status: 400 })
  }
} 