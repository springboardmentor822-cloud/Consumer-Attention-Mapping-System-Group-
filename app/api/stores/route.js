import { NextResponse } from 'next/server';
import { STORES } from '@/lib/cams-data';

export async function GET() {
  const storeLayouts = STORES.map(s => ({
    layout_id: s.id,
    name: s.name,
    location: s.location,
    total_cameras: s.totalCameras,
    zones: [
      { zone_id: 1, name: 'Zone 1: Entrance/Exit Foyer', coordinates: [[10, 20], [400, 300]] },
      { zone_id: 2, name: 'Zone 2: Main Grocery Aisle', coordinates: [[50, 60], [550, 450]] },
      { zone_id: 3, name: 'Zone 3: Checkout Lanes', coordinates: [[100, 100], [600, 500]] }
    ]
  }));

  return NextResponse.json({ stores: storeLayouts });
}

export async function POST(request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'Store created successfully',
      store: {
        layout_id: `store_${Date.now()}`,
        name: body.name || 'New Retail Store',
        location: body.location || 'Central Location',
        zones: body.zones || []
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create store' }, { status: 400 });
  }
}
