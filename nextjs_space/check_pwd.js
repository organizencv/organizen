const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function checkPassword() {
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'maria.silva@empresa.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('User name:', user.name);
    console.log('Stored hash:', user.password.substring(0, 30) + '...');
    
    const isValid = await bcrypt.compare('teste123', user.password);
    console.log('\nPassword "teste123" is valid:', isValid);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();
