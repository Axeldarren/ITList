
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   console.log("Starting data migration: isAdmin -> role");
  
//   const admins = await prisma.user.findMany({
//     where: { isAdmin: true },
//   });

//   console.log(`Found ${admins.length} admins to migrate.`);

//   // Update Admins
//   const updateAdmins = await prisma.user.updateMany({
//     where: { isAdmin: true },
//     data: { role: 'ADMIN' },
//   });

//   console.log(`Updated ${updateAdmins.count} users to role='ADMIN'.`);
  
//   // Verify defaults
//   const others = await prisma.user.count({
//     where: { role: 'DEVELOPER' },
//   });
//   console.log(`Count of DEVELOPER roles: ${others}`);
// }

// main()
//   .catch((e) => console.error(e))
//   .finally(async () => await prisma.$disconnect());
