import { NextResponse } from 'next/server';

// This is a sample API Route that other websites would call
// using the API key you generate for them.
export async function GET(request: Request) {
  // 1. Get the API key from the headers
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid API key' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.split(' ')[1];

  // 2. Here you would normally check the database to see if the apiKey exists and is valid
  // const isValid = await database.checkApiKey(apiKey);
  
  // For this demonstration, we'll just mock the validation
  if (apiKey !== 'mock-api-key-123') {
    return NextResponse.json(
      { error: 'Invalid API key provided' },
      { status: 401 }
    );
  }

  // 3. If valid, return the requested data
  return NextResponse.json({
    success: true,
    message: 'API Key is valid! Here is your secure data.',
    data: {
      items: ['Apple', 'Banana', 'Orange'],
      timestamp: new Date().toISOString()
    }
  });
}
