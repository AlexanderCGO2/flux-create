import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

interface FilterValues {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  hue: number
  sepia: number
  grayscale: number
  invert: number
}

interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'tiff' | 'pdf'
  quality?: number
  width?: number
  height?: number
  dpi?: number
  background?: string
  metadata?: Record<string, any>
  filters?: FilterValues
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      image,
      imageData, 
      format = 'png',
      quality = 90,
      width,
      height,
      dpi = 300,
      background = 'transparent',
      metadata = {},
      filters
    }: { image?: string; imageData?: string } & ExportOptions = body

    // Handle both 'image' and 'imageData' field names for compatibility
    const inputImage = image || imageData

    // Validate required fields
    if (!inputImage || typeof inputImage !== 'string') {
      return NextResponse.json(
        { error: '❌ Image data is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Processing export:', { format, quality, width, height, dpi, hasFilters: !!filters })

    // Convert base64 to buffer
    let imageBuffer: Buffer
    try {
      // Remove data URL prefix if present
      const base64Data = inputImage.replace(/^data:image\/[a-z]+;base64,/, '')
      imageBuffer = Buffer.from(base64Data, 'base64')
    } catch (error) {
      return NextResponse.json(
        { error: '❌ Invalid image data format' },
        { status: 400 }
      )
    }

    // Initialize Sharp processing
    let sharpImage = sharp(imageBuffer)

    // Apply filters using Sharp if provided
    if (filters) {
      console.log('🎨 Applying filters:', filters)
      
      // Apply modulation (brightness, saturation, hue)
      if (filters.brightness !== 0 || filters.saturation !== 0 || filters.hue !== 0) {
        sharpImage = sharpImage.modulate({
          brightness: filters.brightness !== 0 ? 1 + (filters.brightness / 100) : undefined,
          saturation: filters.saturation !== 0 ? 1 + (filters.saturation / 100) : undefined,
          hue: filters.hue !== 0 ? filters.hue : undefined
        })
      }
      
      // Apply grayscale
      if (filters.grayscale > 0) {
        sharpImage = sharpImage.grayscale()
      }
      
      // Apply blur
      if (filters.blur > 0) {
        sharpImage = sharpImage.blur(filters.blur)
      }
      
      // Apply gamma for contrast adjustment
      if (filters.contrast !== 0) {
        const gamma = filters.contrast > 0 ? 1 + (filters.contrast / 100) : 1 / (1 + Math.abs(filters.contrast) / 100)
        sharpImage = sharpImage.gamma(gamma)
      }
      
      // Apply negate for invert
      if (filters.invert > 0) {
        sharpImage = sharpImage.negate()
      }
    }

    // Apply resize if dimensions specified
    if (width || height) {
      sharpImage = sharpImage.resize(width, height, {
        fit: 'contain',
        background: background === 'transparent' ? { r: 0, g: 0, b: 0, alpha: 0 } : background
      })
    }

    // Set DPI metadata
    if (dpi && dpi !== 72) {
      sharpImage = sharpImage.withMetadata({
        density: dpi
      })
    }

    // Add custom metadata
    if (Object.keys(metadata).length > 0) {
      sharpImage = sharpImage.withMetadata(metadata)
    }

    // Process based on format
    let outputBuffer: Buffer
    let mimeType: string
    
    switch (format) {
      case 'jpeg':
        outputBuffer = await sharpImage
          .jpeg({ 
            quality: Math.max(1, Math.min(100, quality)),
            progressive: true,
            mozjpeg: true
          })
          .toBuffer()
        mimeType = 'image/jpeg'
        break

      case 'webp':
        outputBuffer = await sharpImage
          .webp({ 
            quality: Math.max(1, Math.min(100, quality)),
            lossless: quality >= 100,
            effort: 6
          })
          .toBuffer()
        mimeType = 'image/webp'
        break

      case 'tiff':
        outputBuffer = await sharpImage
          .tiff({ 
            quality: Math.max(1, Math.min(100, quality)),
            compression: 'lzw',
            predictor: 'horizontal'
          })
          .toBuffer()
        mimeType = 'image/tiff'
        break

      case 'pdf':
        // For PDF, we'll use a simple approach - convert to high-quality PNG first
        const pngBuffer = await sharpImage
          .png({ quality: 100, compressionLevel: 0 })
          .toBuffer()
        
        // Create a simple PDF with the image
        // Note: In a real implementation, you'd use a proper PDF library like PDFKit
        const pdfContent = createSimplePDF(pngBuffer, width, height)
        outputBuffer = Buffer.from(pdfContent)
        mimeType = 'application/pdf'
        break

      case 'png':
      default:
        outputBuffer = await sharpImage
          .png({ 
            quality: Math.max(1, Math.min(100, quality)),
            compressionLevel: quality < 50 ? 9 : quality < 80 ? 6 : 3,
            progressive: true
          })
          .toBuffer()
        mimeType = 'image/png'
        break
    }

    // Convert to base64 for response
    const base64Output = outputBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64Output}`

    // Get file size and optimization info
    const originalSize = imageBuffer.length
    const outputSize = outputBuffer.length
    const compressionRatio = ((originalSize - outputSize) / originalSize * 100).toFixed(1)

    console.log('✅ Export completed:', {
      format,
      originalSize: `${(originalSize / 1024).toFixed(1)}KB`,
      outputSize: `${(outputSize / 1024).toFixed(1)}KB`,
      compressionRatio: `${compressionRatio}%`
    })

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      format,
      fileSize: outputSize,
      compression: {
        originalSize,
        outputSize,
        ratio: compressionRatio
      },
      metadata: {
        width: width || 'original',
        height: height || 'original',
        dpi,
        quality,
        format
      },
      processed_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Export processing error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || '❌ Failed to process export',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

// Simple PDF creation function (basic implementation)
function createSimplePDF(imageBuffer: Buffer, width?: number, height?: number): string {
  // This is a very basic PDF structure - in production, use a proper PDF library
  const base64Image = imageBuffer.toString('base64')
  
  const pdfWidth = width || 595 // A4 width in points
  const pdfHeight = height || 842 // A4 height in points
  
  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>
endobj

4 0 obj
<< /Type /XObject /Subtype /Image /Width ${width || 800} /Height ${height || 600} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${base64Image.length} >>
stream
${base64Image}
endstream
endobj

5 0 obj
<< /Length 44 >>
stream
q
${pdfWidth} 0 0 ${pdfHeight} 0 0 cm
/Im1 Do
Q
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000279 00000 n 
0000000456 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
544
%%EOF`
}

// Batch export endpoint for multiple formats
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageData, formats }: { imageData: string, formats: ExportOptions[] } = body

    if (!imageData || !formats || !Array.isArray(formats)) {
      return NextResponse.json(
        { error: '❌ Image data and formats array required' },
        { status: 400 }
      )
    }

    console.log('🔄 Processing batch export for', formats.length, 'formats')

    const results = []
    for (const formatOptions of formats) {
      try {
        // Process each format (reuse the logic from POST)
        const response = await POST(new NextRequest(request.url, {
          method: 'POST',
          body: JSON.stringify({ imageData, ...formatOptions })
        }))
        
        const result = await response.json()
        results.push({
          format: formatOptions.format,
          success: result.success,
          ...result
        })
      } catch (error: any) {
        results.push({
          format: formatOptions.format,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      processed_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Batch export error:', error)
    return NextResponse.json(
      { error: '❌ Batch export failed', details: error.toString() },
      { status: 500 }
    )
  }
} 