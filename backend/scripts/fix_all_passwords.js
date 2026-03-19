require('dotenv').config();
const prisma = require('../src/utils/prismaClient');
const { hashPassword } = require('../src/utils/hash');

async function main() {
    console.log('Fixing all admin and employee passwords...\n');

    // Fix admin passwords
    const admins = [
        { email: 'admin@teddyrental.com', password: 'Password123!' },
        { email: 'admin2@teddyrental.com', password: 'Password123!' }
    ];

    for (const admin of admins) {
        try {
            const user = await prisma.user.findUnique({
                where: { email: admin.email }
            });

            if (user) {
                const hashedPassword = await hashPassword(admin.password);
                await prisma.user.update({
                    where: { email: admin.email },
                    data: { password: hashedPassword }
                });
                console.log(`✅ Fixed password for admin: ${admin.email}`);
            } else {
                console.log(`⚠️  Admin not found: ${admin.email}`);
            }
        } catch (error) {
            console.error(`❌ Error fixing ${admin.email}:`, error.message);
        }
    }

    // Fix employee passwords
    const employees = [
        { email: 'employee@teddyrental.com', password: 'Password123!' },
        { email: 'employee2@teddyrental.com', password: 'Password123!' },
        { email: 'employee3@teddyrental.com', password: 'Password123!' }
    ];

    for (const emp of employees) {
        try {
            const user = await prisma.user.findUnique({
                where: { email: emp.email }
            });

            if (user) {
                const hashedPassword = await hashPassword(emp.password);
                await prisma.user.update({
                    where: { email: emp.email },
                    data: { password: hashedPassword }
                });
                console.log(`✅ Fixed password for employee: ${emp.email}`);
            } else {
                console.log(`⚠️  Employee not found: ${emp.email}`);
            }
        } catch (error) {
            console.error(`❌ Error fixing ${emp.email}:`, error.message);
        }
    }

    console.log('\n✅ All passwords have been fixed!');
    console.log('All accounts now use password: Password123!');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
