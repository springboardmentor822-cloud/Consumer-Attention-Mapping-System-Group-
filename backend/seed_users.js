const { sequelize } = require('./config/db');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected for seeding...');

    // The users to seed
    const usersToCreate = [
      {
        username: 'muhsina',
        email: 'muhsina@gmail.com',
        password: '12345678',
        full_name: 'Muhsina Admin',
        role: 'admin'
      },
      {
        username: 'samesh',
        email: 'samesh@gmail.com',
        password: '12345678',
        full_name: 'Samesh Store',
        role: 'store_manager'
      },
      {
        username: 'sumesh',
        email: 'sumesh@gmail.com',
        password: '12345678',
        full_name: 'Sumesh Store',
        role: 'store_manager'
      },
      {
        username: 'ramesh',
        email: 'ramesh@gmail.com',
        password: '12345678',
        full_name: 'Ramesh Analyst',
        role: 'retail_analyst'
      },
      {
        username: 'manesh',
        email: 'manesh@gmail.com',
        password: '12345678',
        full_name: 'Manesh Marketing',
        role: 'marketing_manager'
      }
    ];

    for (const userData of usersToCreate) {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (!existingUser) {
        await User.create(userData);
        console.log(`Created user: ${userData.email} with role: ${userData.role}`);
      } else {
        // Update password and role just in case
        existingUser.password = userData.password;
        existingUser.role = userData.role;
        await existingUser.save();
        console.log(`Updated user: ${userData.email} with role: ${userData.role}`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed users:', error);
    process.exit(1);
  }
};

seedUsers();
