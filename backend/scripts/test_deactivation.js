require('dotenv').config();
const prisma = require('../src/utils/prismaClient');
const { hashPassword } = require('../src/utils/hash');

async function main() {
    console.log('Creating test employee...');
    
    // Create test employee
    const password = await hashPassword('test123');
    const testUser = await prisma.user.create({
        data: {
            email: 'test.employee@teddyrental.com',
            password: password,
            role: 'EMPLOYEE',
            customerProfile: {
                create: {
                    firstName: 'Test',
                    lastName: 'Employee',
                    phoneNumber: '0900000000',
                    address: 'Test Address'
                }
            }
        },
        include: { customerProfile: true }
    });
    
    console.log('✅ Test employee created:', testUser.email);
    console.log('ID:', testUser.id);
    console.log('isActive:', testUser.isActive);
    
    // Deactivate the user
    console.log('\nDeactivating user...');
    const deactivated = await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false }
    });
    
    console.log('✅ User deactivated');
    console.log('isActive:', deactivated.isActive);
    
    // Check if we can still find them
    const allUsers = await prisma.user.findMany({
        where: {
            OR: [
                { role: 'ADMIN' },
                { role: 'EMPLOYEE' }
            ]
        },
        include: { customerProfile: true }
    });
    
    const deactivatedUser = allUsers.find(u => u.id === testUser.id);
    console.log('\n✅ Deactivated user still in database:', !!deactivatedUser);
    if (deactivatedUser) {
        console.log('Email:', deactivatedUser.email);
        console.log('isActive:', deactivatedUser.isActive);
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
