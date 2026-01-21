
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetTable(tableName: string, idColumn: string = "id") {
    try {
        const maxIdResult = await prisma.$queryRawUnsafe(`SELECT MAX("${idColumn}") as max_id FROM "${tableName}"`);
        // @ts-ignore
        const maxId = maxIdResult[0]?.max_id || 0;
        console.log(`[${tableName}] Max ID: ${maxId}`);

        // Reset
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${tableName}"', '${idColumn}'), coalesce(max("${idColumn}")+1, 1), false) FROM "${tableName}";`);
        console.log(`[${tableName}] Sequence reset successfully.`);
    } catch (e) {
        console.error(`[${tableName}] Error resetting:`, e);
    }
}

async function main() {
  try {
    // Core Tables
    await resetTable("User", "userId");
    await resetTable("Team");
    await resetTable("Project");
    await resetTable("Task");
    
    // Joint/Relation Tables
    await resetTable("ProjectTeam");
    await resetTable("TeamMembership");
    await resetTable("TaskAssignment");
    await resetTable("ProjectTicket");
    await resetTable("ProjectVersion");
    await resetTable("ProjectStatusHistory");
    
    // Content/Activity Tables
    await resetTable("Activity");
    await resetTable("Attachment");
    await resetTable("Comment");
    await resetTable("TimeLog");
    
    // Product Maintenance Tables
    await resetTable("ProductMaintenance");
    await resetTable("MaintenanceTask");
    await resetTable("ProductMaintainer");
    await resetTable("ProductMaintenanceStatusHistory");
    await resetTable("MaintenanceTaskTicket");
  } catch (error) {
    console.error("Error in main:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
