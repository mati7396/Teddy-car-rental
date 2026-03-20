require('dotenv').config();
const prisma = require('../src/utils/prismaClient');

async function main() {
    // Get all users with their bookings
    const users = await prisma.user.findMany({
        where: {
            role: 'CUSTOMER'
        },
        include: {
            customerProfile: true,
            bookings: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    console.log('\n=== ALL CUSTOMER USERS ===\n');
    
    for (const user of users) {
        console.log(`Email: ${user.email}`);
        console.log(`Agreement Signed: ${user.customerProfile?.agreementSigned || false}`);
        console.log(`Has Documents: ${!!(user.customerProfile?.idCardUrl && user.customerProfile?.driverLicenseUrl)}`);
        console.log(`Total Bookings: ${user.bookings.length}`);
        
        if (user.bookings.length > 0) {
            console.log('\nBookings:');
            user.bookings.forEach((booking, idx) => {
                console.log(`  ${idx + 1}. ID: ${booking.id}, Status: ${booking.status}, Created: ${booking.createdAt}`);
            });
        }
        
        const hasVerified = user.bookings.some(b => ['VERIFIED', 'APPROVED', 'PAID', 'ACTIVE', 'COMPLETED'].includes(b.status));
        console.log(`Has Verified Booking: ${hasVerified}`);
        console.log('\n---\n');
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
