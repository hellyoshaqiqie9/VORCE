import { NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    fs.writeFileSync('c:/vorce/tasks_debug.json', JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
