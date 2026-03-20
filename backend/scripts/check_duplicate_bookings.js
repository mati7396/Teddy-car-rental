require('dotenv').config();
const prisma = require('../src/utils/prismaClient');

async function main() {
    const email = process.argv[2];
    
    if (!email) {
        console.log('Usage: node scripts/check_duplicate_bookings.js <user-email>');
        return;
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            bookings: {
                include: {
                    car: true,
                    payment: true,
                    package: true
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`\nUser: ${email}`);
    console.log(`Total bookings: ${user.bookings.length}\n`);

    // Check for duplicates
    const bookingIds = user.bookings.map(b => b.id);
    const uniqueIds = [...new Set(bookingIds)];
    
    if (bookingIds.length !== uniqueIds.length) {
        console.log('⚠️  DUPLICATE BOOKINGS FOUND!');
        console.log('Booking IDs:', bookingIds);
    } else {
        console.log('✅ No duplicate bookings');
    }

    console.log('\nBookings:');
    user.bookings.forEach((booking, idx) => {
        console.log(`${idx + 1}. ID: ${booking.id}, Status: ${booking.status}, Car: ${booking.car?.make || 'N/A'}, Created: ${booking.createdAt}`);
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
