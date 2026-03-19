require('dotenv').config();
const prisma = require('../src/utils/prismaClient');
const { comparePassword } = require('../src/utils/hash');

async function main() {
    const email = 'admin@teddyrental.com';
    const testPassword = 'Password123!';

    const user = await prisma.user.findUnique({
        where: { email },
        include: { customerProfile: true }
    });

    if (!user) {
        console.log('❌ Admin user does NOT exist in database');
        console.log('Run: npm run seed (or node prisma/seed.js)');
        return;
    }

    console.log('✅ Admin user exists');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Has Profile:', !!user.customerProfile);
    
    const isPasswordValid = await comparePassword(testPassword, user.password);
    
    if (isPasswordValid) {
        console.log('✅ Password "Password123!" is CORRECT');
    } else {
        console.log('❌ Password "Password123!" does NOT match');
        console.log('The stored hash might be incorrect. Try re-seeding the database.');
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
