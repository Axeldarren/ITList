import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetSequence() {
  console.log("Starting Notification sequence reset...");
  try {
    // Get the current max ID
    const maxIdResult = await prisma.notification.aggregate({
      _max: {
        id: true,
      },
    });

    const maxId = maxIdResult._max.id || 0;
    console.log(`Current max Notification ID: ${maxId}`);

    // Reset the sequence. 
    // In PostgreSQL, the sequence name is usually table name + field name + _seq.
    // For @map("Notification"), it's likely "Notification_id_seq".
    // We use $executeRawUnsafe to run the setval command.
    await prisma.$executeRawUnsafe(
      `SELECT setval('"Notification_id_seq"', ${maxId + 1}, false)`
    );

    console.log(`Notification sequence reset to ${maxId + 1}.`);
  } catch (error) {
    console.error("Failed to reset Notification sequence:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSequence();
