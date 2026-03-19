require('dotenv').config();
const prisma = require('../src/utils/prismaClient');

async function main() {
    console.log('Checking users and their isActive status...\n');
    
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { role: 'ADMIN' },
                { role: 'EMPLOYEE' }
            ]
        },
        include: { customerProfile: true }
    });

    console.log(`Found ${users.length} staff members:\n`);
    
    users.forEach(user => {
        const name = user.customerProfile 
            ? `${user.customerProfile.firstName} ${user.customerProfile.lastName}`
            : 'No name';
        
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${name}`);
        console.log(`Role: ${user.role}`);
        console.log(`isActive: ${user.isActive}`);
        console.log('---');
    });
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
