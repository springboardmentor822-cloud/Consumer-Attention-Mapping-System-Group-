import { NextResponse } from 'next/server';
import { DEMO_USERS } from '@/lib/cams-data';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = DEMO_USERS.find(u => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate mock JWT Token matching Milestone 1 Auth contract
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }))}.signature`;

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: true,
        name: user.name,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
