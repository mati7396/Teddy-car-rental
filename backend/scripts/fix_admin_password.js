require('dotenv').config();
const prisma = require('../src/utils/prismaClient');
const { hashPassword } = require('../src/utils/hash');

async function main() {
    const email = 'admin@teddyrental.com';
    const password = 'Password123!';
    
    console.log('Updating admin password...');
    
    const hashedPassword = await hashPassword(password);
    
    const updatedUser = await prisma.user.update({
        where: { email },
        data: { 
            password: hashedPassword
        }
    });
    
    console.log('✅ Admin password updated successfully');
    console.log('Email:', updatedUser.email);
    console.log('You can now login with: Password123!');
    
    // Also create profile if missing
    const profile = await prisma.customerProfile.findUnique({
        where: { userId: updatedUser.id }
    });
    
    if (!profile) {
        await prisma.customerProfile.create({
            data: {
                userId: updatedUser.id,
                firstName: 'Teddy',
                lastName: 'Admin',
                phoneNumber: '0911000000',
                address: 'Addis Ababa'
            }
        });
        console.log('✅ Admin profile created');
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
