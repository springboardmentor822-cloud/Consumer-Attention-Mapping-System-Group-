import { NextResponse } from 'next/server';
import { PRODUCTS_CATALOG } from '@/lib/cams-data';

export async function GET(request, { params }) {
  const { storeId } = params;

  const shelves = [
    { shelf_id: 'sh_01', store_id: storeId, shelf_name: 'Shelf 1 - Eye Level (ROI 1)', zone_coordinates: [[20, 30], [200, 150]], products_count: 8 },
    { shelf_id: 'sh_02', store_id: storeId, shelf_name: 'Shelf 2 - Middle Slot (ROI 2)', zone_coordinates: [[20, 160], [200, 280]], products_count: 12 },
    { shelf_id: 'sh_03', store_id: storeId, shelf_name: 'Shelf 3 - Bottom Slot (ROI 3)', zone_coordinates: [[20, 290], [200, 400]], products_count: 6 },
  ];

  return NextResponse.json({ store_id: storeId, shelves });
}

export async function POST(request, { params }) {
  try {
    const { storeId } = params;
    const body = await request.json();

    return NextResponse.json({
      message: 'Shelf created successfully',
      shelf: {
        shelf_id: `sh_${Date.now()}`,
        store_id: storeId,
        shelf_name: body.shelf_name || 'New Shelf Display',
        zone_coordinates: body.zone_coordinates || [[0, 0], [100, 100]]
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create shelf' }, { status: 400 });
  }
}
