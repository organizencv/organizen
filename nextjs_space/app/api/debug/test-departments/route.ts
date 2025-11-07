
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Debug endpoint - This will be implemented in runtime',
    timestamp: new Date().toISOString()
  })
}
