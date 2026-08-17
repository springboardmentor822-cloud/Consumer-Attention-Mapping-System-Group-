const { sequelize } = require('./config/db');
const User = require('./models/User');
const Store = require('./models/store');
const Camera = require('./models/camera');
const Shelf = require('./models/shelf');
const Product = require('./models/product');
const Zone = require('./models/zone');
const Promotion = require('./models/promotion');
const Customer = require('./models/customer');
const Transaction = require('./models/transaction');

async function seed() {
  try {
    console.log('🔄 Re-syncing database models (force: true)...');
    await sequelize.sync({ force: true });
    console.log('✅ Database models synced.');

    // 1. Create Users
    console.log('👤 Seeding users...');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@cams-retail.com',
      password: '$2b$10$YourHashedPasswordHere',
      full_name: 'System Administrator',
      role: 'admin',
      is_active: true
    });

    const manager = await User.create({
      username: 'manager',
      email: 'manager@cams-retail.com',
      password: '$2b$10$YourHashedPasswordHere',
      full_name: 'Store Manager',
      role: 'store_manager',
      is_active: true
    });

    // 2. Create Stores
    console.log('🏪 Seeding stores...');
    const store1 = await Store.create({
      store_id: 'STR-101',
      name: 'Downtown Flagship',
      location: 'Downtown',
      address: '123 Main St, New York',
      store_type: 'supermarket',
      total_area_sqft: 28000,
      layout_type: 'grid',
      status: 'active'
    });

    const store2 = await Store.create({
      store_id: 'STR-102',
      name: 'Westside Mall',
      location: 'Los Angeles',
      address: '456 West Blvd, Los Angeles',
      store_type: 'retail',
      total_area_sqft: 22000,
      layout_type: 'grid',
      status: 'active'
    });

    const store3 = await Store.create({
      store_id: 'STR-103',
      name: 'Metro Center',
      location: 'Chicago',
      address: '789 Central Ave, Chicago',
      store_type: 'retail',
      total_area_sqft: 16000,
      layout_type: 'grid',
      status: 'maintenance'
    });

    // 3. Create Zones
    console.log('📍 Seeding zones...');
    const zonesData = [
      { zone_id: 'ZN-01', name: 'Bakery', store_id: store1.id, status: 'Active', color: '#F97316' },
      { zone_id: 'ZN-02', name: 'Dairy', store_id: store1.id, status: 'Active', color: '#10B981' },
      { zone_id: 'ZN-03', name: 'Produce', store_id: store1.id, status: 'Active', color: '#8B5CF6' },
      { zone_id: 'ZN-04', name: 'Cosmetics', store_id: store1.id, status: 'Active', color: '#F59E0B' },
      { zone_id: 'ZN-05', name: 'Electronics', store_id: store1.id, status: 'Active', color: '#06B6D4' },
      { zone_id: 'ZN-06', name: 'Household', store_id: store1.id, status: 'Active', color: '#F97316' },
      { zone_id: 'ZN-07', name: 'Frozen Foods', store_id: store1.id, status: 'Active', color: '#14B8A6' },
      { zone_id: 'ZN-08', name: 'Checkout', store_id: store1.id, status: 'Active', color: '#EF4444' }
    ];
    await Zone.bulkCreate(zonesData);

    // 4. Create Shelves (12 shelves)
    console.log('📦 Seeding shelves...');
    const shelvesData = [
      { shelf_id: 'SH-101', name: 'Shelf A1 - Bread & Pastry', store_id: store1.id, shelf_number: 'A1', section: 'Produce', aisle: 'Aisle 1', shelf_type: 'gondola', position_x: 14.0, position_y: 5.2, width: 2.0, height: 1.6, levels: 4, zone: 'Bakery', product_categories: ['Bakery'] },
      { shelf_id: 'SH-102', name: 'Shelf B2 - Dairy & Eggs', store_id: store1.id, shelf_number: 'B2', section: 'Dairy', aisle: 'Aisle 2', shelf_type: 'gondola', position_x: 8.5, position_y: 18.3, width: 3.2, height: 2.0, levels: 4, zone: 'Dairy', product_categories: ['Dairy'] },
      { shelf_id: 'SH-103', name: 'Shelf C1 - Fresh Produce', store_id: store1.id, shelf_number: 'C1', section: 'Produce', aisle: 'Aisle 1', shelf_type: 'gondola', position_x: 22.4, position_y: 12.1, width: 1.8, height: 1.5, levels: 4, zone: 'Produce', product_categories: ['Produce'] },
      { shelf_id: 'SH-104', name: 'Shelf D4 - Cosmetics Wall', store_id: store1.id, shelf_number: 'D4', section: 'Cosmetics', aisle: 'Aisle 3', shelf_type: 'wall', position_x: 30.1, position_y: 15.6, width: 2.8, height: 1.8, levels: 4, zone: 'Cosmetics', product_categories: ['Cosmetics'] },
      { shelf_id: 'SH-105', name: 'Shelf E1 - Electronics Display', store_id: store1.id, shelf_number: 'E1', section: 'Electronics', aisle: 'Aisle 4', shelf_type: 'island', position_x: 16.2, position_y: 8.7, width: 2.4, height: 1.8, levels: 4, zone: 'Electronics', product_categories: ['Electronics'] },
      { shelf_id: 'SH-106', name: 'Shelf F1 - Household Cleaner', store_id: store1.id, shelf_number: 'F1', section: 'Household', aisle: 'Aisle 5', shelf_type: 'gondola', position_x: 34.5, position_y: 20.2, width: 3.0, height: 2.2, levels: 4, zone: 'Household', product_categories: ['Household'] },
      
      { shelf_id: 'SH-107', name: 'Shelf G1 - Frozen Pizza', store_id: store1.id, shelf_number: 'G1', section: 'Frozen', aisle: 'Aisle 6', shelf_type: 'cooler', position_x: 5.0, position_y: 25.0, width: 2.5, height: 2.0, levels: 3, zone: 'Frozen Foods', product_categories: ['Frozen Foods'] },
      { shelf_id: 'SH-108', name: 'Shelf H1 - Checkout Impulse', store_id: store1.id, shelf_number: 'H1', section: 'Checkout', aisle: 'Checkout 1', shelf_type: 'endcap', position_x: 40.0, position_y: 32.0, width: 1.2, height: 1.2, levels: 5, zone: 'Checkout', product_categories: ['Snacks & Beverages'] },
      { shelf_id: 'SH-109', name: 'Shelf A2 - Bakery Endcap', store_id: store1.id, shelf_number: 'A2', section: 'Produce', aisle: 'Aisle 1', shelf_type: 'endcap', position_x: 18.0, position_y: 5.2, width: 1.5, height: 1.6, levels: 4, zone: 'Bakery', product_categories: ['Bakery'] },
      { shelf_id: 'SH-110', name: 'Shelf B3 - Organic Yogurt', store_id: store1.id, shelf_number: 'B3', section: 'Dairy', aisle: 'Aisle 2', shelf_type: 'cooler', position_x: 12.0, position_y: 18.3, width: 2.0, height: 2.0, levels: 4, zone: 'Dairy', product_categories: ['Dairy'] },
      { shelf_id: 'SH-111', name: 'Shelf C2 - Salad Bar', store_id: store1.id, shelf_number: 'C2', section: 'Produce', aisle: 'Aisle 1', shelf_type: 'island', position_x: 26.0, position_y: 12.1, width: 3.0, height: 1.2, levels: 2, zone: 'Produce', product_categories: ['Produce'] },
      { shelf_id: 'SH-112', name: 'Shelf E2 - Smart Home Demo', store_id: store1.id, shelf_number: 'E2', section: 'Electronics', aisle: 'Aisle 4', shelf_type: 'island', position_x: 20.0, position_y: 8.7, width: 2.4, height: 1.8, levels: 3, zone: 'Electronics', product_categories: ['Electronics'] }
    ];
    const createdShelves = await Shelf.bulkCreate(shelvesData);
    const shelfMap = {};
    createdShelves.forEach(s => {
      shelfMap[s.shelf_id] = s.id;
    });

    // 5. Create Cameras
    console.log('📹 Seeding cameras...');
    await Camera.bulkCreate([
      {
        camera_id: 'CAM-01',
        store_id: store1.id,
        name: 'Camera 1 - Main Central Aisle',
        camera_type: 'fixed',
        camera_url: '192.168.1.101',
        stream_url: '/videos/store1.mp4',
        location: 'Main Entrance',
        fps: 30,
        resolution: '1080p FHD',
        zones: ['Produce', 'Dairy'],
        is_active: true,
        position_x: 4.0,
        position_y: 4.0
      },
      {
        camera_id: 'CAM-02',
        store_id: store1.id,
        name: 'Camera 2 - Bakery Endcap Camera',
        camera_type: 'fixed',
        camera_url: '192.168.1.102',
        stream_url: '/videos/aisle1.mp4',
        location: 'Bakery Endcap',
        fps: 30,
        resolution: '1080p FHD',
        zones: ['Bakery'],
        is_active: true,
        position_x: 12.0,
        position_y: 8.0
      },
      {
        camera_id: 'CAM-03',
        store_id: store1.id,
        name: 'Camera 3 - Checkout Counter #1',
        camera_type: 'fixed',
        camera_url: '192.168.1.103',
        stream_url: '/videos/checkout1.mp4',
        location: 'Cosmetics Wall',
        fps: 28,
        resolution: '1080p FHD',
        zones: ['Cosmetics', 'Checkout'],
        is_active: true,
        position_x: 32.0,
        position_y: 14.0
      },
      {
        camera_id: 'CAM-04',
        store_id: store1.id,
        name: 'Camera 4 - Checkout Counter #2',
        camera_type: 'fixed',
        camera_url: '192.168.1.104',
        stream_url: '/videos/checkout2.mp4',
        location: 'Checkout Line',
        fps: 30,
        resolution: '1080p FHD',
        zones: ['Checkout'],
        is_active: false,
        position_x: 40.0,
        position_y: 30.0
      }
    ]);

    // 6. Create Products
    console.log('🛍️ Seeding products...');
    const productsData = [
      { product_id: 'P-001', name: 'Artisan Sourdough Bread', sku: 'SKU-1001', category: 'Bakery', subcategory: 'Bread', brand: 'Bakers Pride', price: 7.50, selling_price: 7.50, cost_price: 5.00, profit: 2.50, stock_qty: 45, shelf: 'SH-101', shelf_id: shelfMap['SH-101'], store: 'Downtown Flagship', promo: 'Summer Sale Spectacular', status: 'active', position_x: 14.0, position_y: 5.2 },
      { product_id: 'P-002', name: 'Organic Almond Milk', sku: 'SKU-1002', category: 'Dairy', subcategory: 'Milk', brand: 'BioNature', price: 7.00, selling_price: 7.00, cost_price: 4.50, profit: 2.50, stock_qty: 60, shelf: 'SH-102', shelf_id: shelfMap['SH-102'], store: 'Downtown Flagship', promo: 'Weekend Bonanza', status: 'active', position_x: 8.5, position_y: 18.3 },
      { product_id: 'P-003', name: 'Premium Greek Yogurt', sku: 'SKU-1003', category: 'Dairy', subcategory: 'Yogurt', brand: 'Chobani', price: 7.00, selling_price: 7.00, cost_price: 4.00, profit: 3.00, stock_qty: 80, shelf: 'SH-102', shelf_id: shelfMap['SH-102'], store: 'Downtown Flagship', promo: 'None', status: 'active', position_x: 8.6, position_y: 18.3 },
      { product_id: 'P-004', name: 'Free-Range Eggs (12pk)', sku: 'SKU-1004', category: 'Dairy', subcategory: 'Eggs', brand: 'Eggland', price: 7.00, selling_price: 7.00, cost_price: 3.80, profit: 3.20, stock_qty: 50, shelf: 'SH-102', shelf_id: shelfMap['SH-102'], store: 'Downtown Flagship', promo: 'None', status: 'active', position_x: 8.7, position_y: 18.3 },
      { product_id: 'P-005', name: 'Avocado (Hass, 4-pack)', sku: 'SKU-1005', category: 'Produce', subcategory: 'Fruits', brand: 'FreshGrow', price: 8.00, selling_price: 8.00, cost_price: 5.20, profit: 2.80, stock_qty: 30, shelf: 'SH-103', shelf_id: shelfMap['SH-103'], store: 'Downtown Flagship', promo: 'None', status: 'active', position_x: 22.4, position_y: 12.1 },
      { product_id: 'P-006', name: 'Luxury Face Serum', sku: 'SKU-1006', category: 'Cosmetics', subcategory: 'Skincare', brand: 'Estee', price: 35.00, selling_price: 35.00, cost_price: 20.00, profit: 15.00, stock_qty: 15, shelf: 'SH-104', shelf_id: shelfMap['SH-104'], store: 'Downtown Flagship', promo: 'None', status: 'active', position_x: 30.1, position_y: 15.6 },
      { product_id: 'P-007', name: 'Wireless Earbuds Pro', sku: 'SKU-1007', category: 'Electronics', subcategory: 'Audio', brand: 'Sony', price: 80.00, selling_price: 80.00, cost_price: 55.00, profit: 25.00, stock_qty: 25, shelf: 'SH-105', shelf_id: shelfMap['SH-105'], store: 'Downtown Flagship', promo: 'New Arrival Launch', status: 'active', position_x: 16.2, position_y: 8.7 },
      { product_id: 'P-008', name: 'Multi-Surface Cleaner', sku: 'SKU-1008', category: 'Household', subcategory: 'Cleaner', brand: 'Clorox', price: 8.00, selling_price: 8.00, cost_price: 5.00, profit: 3.00, stock_qty: 75, shelf: 'SH-106', shelf_id: shelfMap['SH-106'], store: 'Downtown Flagship', promo: 'None', status: 'active', position_x: 34.5, position_y: 20.2 },
      { product_id: 'P-009', name: 'Organic Granola Mix', sku: 'SKU-1009', category: 'Bakery', subcategory: 'Cereal', brand: 'BioNature', price: 8.00, selling_price: 8.00, cost_price: 5.50, profit: 2.50, stock_qty: 40, shelf: 'SH-101', shelf_id: shelfMap['SH-101'], store: 'Downtown Flagship', promo: 'None', status: 'active', position_x: 14.1, position_y: 5.2 },
      { product_id: 'P-010', name: 'Fresh Salmon Fillet', sku: 'SKU-1010', category: 'Produce', subcategory: 'Fish', brand: 'OceanCatch', price: 20.00, selling_price: 20.00, cost_price: 13.00, profit: 7.00, stock_qty: 25, shelf: 'SH-103', shelf_id: shelfMap['SH-103'], store: 'Downtown Flagship', promo: 'None', status: 'active', position_x: 22.5, position_y: 12.1 }
    ];
    await Product.bulkCreate(productsData);

    // 7. Create Promotions
    console.log('🏷️ Seeding promotions...');
    await Promotion.bulkCreate([
      { promo_id: 'PRM-001', name: 'Summer Sale Spectacular', zone: 'Bakery', category: 'Bakery', type: 'Discount', value: '20% Off', lift: '+28%', revenue: 15000.0, status: 'Active', start_date: '2026-08-01', end_date: '2026-08-31', products: ['P-001'] },
      { promo_id: 'PRM-002', name: 'Weekend Bonanza', zone: 'Dairy', category: 'Dairy', type: 'Bundle', value: 'Buy 2 Get 1', lift: '+15%', revenue: 9800.0, status: 'Active', start_date: '2026-08-05', end_date: '2026-08-28', products: ['P-002'] },
      { promo_id: 'PRM-003', name: 'New Arrival Launch', zone: 'Electronics', category: 'Electronics', type: 'Display', value: 'Demo Highlight', lift: '+35%', revenue: 45000.0, status: 'Active', start_date: '2026-08-10', end_date: '2026-08-25', products: ['P-007'] }
    ]);

    // 8. Create Customers (200 records)
    console.log('👥 Seeding historical customer sessions...');
    const customersList = [];
    const transactionsList = [];

    // Helper functions for seeding deterministic customers
    function seededRandom(seed) {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    const zonesList = ['Bakery', 'Dairy', 'Produce', 'Cosmetics', 'Electronics', 'Household', 'Frozen Foods', 'Checkout'];
    
    // Generate dates: Today, Yesterday, and the last 30 days
    const dates = [];
    const today = new Date(2026, 7, 14); // August 14, 2026
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }

    let customerSeq = 1;
    let transactionSeq = 1;

    dates.forEach((dateStr, dIdx) => {
      // 5-8 customer sessions per day
      const dailyCount = 6 + Math.floor(seededRandom(dIdx) * 3);
      for (let c = 0; c < dailyCount; c++) {
        const cSeed = dIdx * 100 + c;
        const r1 = seededRandom(cSeed);
        const r2 = seededRandom(cSeed + 1);
        const r3 = seededRandom(cSeed + 2);
        const r4 = seededRandom(cSeed + 3);

        const customerId = `CUST-TRK-${customerSeq++}`;
        const entryHour = 8 + Math.floor(r1 * 13);
        const entryMin = Math.floor(r2 * 60);
        const entryTime = `${String(entryHour).padStart(2, '0')}:${String(entryMin).padStart(2, '0')}`;

        const dwellMinutes = 10 + Math.floor(r3 * 50);
        let exitHour = entryHour;
        let exitMin = entryMin + dwellMinutes;
        if (exitMin >= 60) {
          exitHour += Math.floor(exitMin / 60);
          exitMin = exitMin % 60;
        }
        const exitTime = `${String(exitHour).padStart(2, '0')}:${String(exitMin).padStart(2, '0')}`;

        const zone = zonesList[Math.floor(r4 * zonesList.length)];
        const isPurchased = seededRandom(cSeed + 15) < 0.45;
        
        let purchaseStatus = 'No Purchase';
        let purchaseAmount = 0.0;
        let transactionId = '—';

        // Select a product corresponding to the zone
        let activeProd = productsData.find(p => p.category === zone) || productsData[0];

        if (isPurchased) {
          purchaseStatus = 'Purchased';
          purchaseAmount = activeProd.price;
          transactionId = `TXN-TRK-${transactionSeq++}`;

          transactionsList.push({
            transaction_id: transactionId,
            customer_id: customerId,
            date: dateStr,
            time: exitTime,
            products: activeProd.name,
            quantity: 1,
            amount: purchaseAmount,
            profit: activeProd.profit,
            payment_status: 'Completed'
          });
        }

        customersList.push({
          customer_id: customerId,
          visit_date: dateStr,
          entry_time: entryTime,
          exit_time: exitTime,
          dwell_time: parseFloat((dwellMinutes / 60).toFixed(2)),
          purchase_status: purchaseStatus,
          purchase_amount: purchaseAmount,
          transaction_id: transactionId,
          store: 'Downtown Flagship',
          zone: zone,
          products_viewed: [activeProd],
          products_purchased: isPurchased ? [activeProd] : [],
          is_active: false
        });
      }
    });

    await Customer.bulkCreate(customersList);
    await Transaction.bulkCreate(transactionsList);

    console.log(`✅ Seeding completed! Row counts:
      Stores: ${await Store.count()}
      Zones: ${await Zone.count()}
      Shelves: ${await Shelf.count()}
      Cameras: ${await Camera.count()}
      Products: ${await Product.count()}
      Customers: ${await Customer.count()}
      Transactions: ${await Transaction.count()}
      Promotions: ${await Promotion.count()}`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await sequelize.close();
  }
}

seed();
