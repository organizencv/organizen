require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    const newPassword = 'teste123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log('New password:', newPassword);
    console.log('New hash:', hashedPassword);
    
    // Verify the hash works
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Hash verification:', isValid);
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    // Update all users
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log(`Updated password for: ${user.email}`);
    }
    
    console.log('\n✅ All passwords have been reset to: teste123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();
