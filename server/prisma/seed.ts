import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Fields that need to be mapped from Int to UUID
const userRefFields = [
  "userId",
  "createdById",
  "updatedById",
  "deletedById",
  "authorUserId",
  "assignedUserId",
  "uploadedById",
  "assignedToId",
  "productOwnerUserId",
  "projectManagerUserId",
  "changedById"
];

async function deleteAllData(orderedFileNames: string[]) {
  // Delete in REVERSE order of creation to respect foreign keys
  // (e.g. Delete Tasks before Users)
  const deleteOrder = [...orderedFileNames].reverse();

  const modelNames = deleteOrder.map((fileName) => {
    const modelName = path.basename(fileName, path.extname(fileName));
    return modelName.charAt(0).toUpperCase() + modelName.slice(1);
  });

  for (const modelName of modelNames) {
    const model: any = prisma[modelName as keyof typeof prisma];
    try {
      if (model) {
        await model.deleteMany({});
        console.log(`Cleared data from ${modelName}`);
      } else {
         console.warn(`Model ${modelName} not found in Prisma Client`);
      }
    } catch (error) {
      console.error(`Error clearing data from ${modelName}:`, error);
    }
  }
}

async function main() {
  const dataDirectory = path.join(__dirname, "seedData");

  // Order matters for creation! Users must exist before they are referenced.
  const orderedFileNames = [
    "user.json",           // Create Users FIRST (IDs generated here)
    "team.json",           // References Users
    "project.json",        // References Users
    "projectTeam.json",
    "task.json",           // References Users and Projects
    "timeLog.json",        // References Users and Tasks
    // "attachment.json",  // Removed: File missing in seedData
    "comment.json",        // References Users and Tasks
    "taskAssignment.json", // References Users and Tasks
    "teamMembership.json"  // References Users and Teams
  ];

  await deleteAllData(orderedFileNames);

  // Mapping from Old Intra-seed ID (Int) -> New UUID (String)
  const userMap: Record<number, string> = {};

  for (const fileName of orderedFileNames) {
    const filePath = path.join(dataDirectory, fileName);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const modelName = path.basename(fileName, path.extname(fileName));
    const model: any = prisma[modelName as keyof typeof prisma];

    if (!model) {
      console.warn(`Model ${modelName} not found, skipping.`);
      continue;
    }

    try {
      for (const data of jsonData) {
        // Process User model specifically to generate IDs map
        if (modelName === "user") {
           const oldId = data.userId;
           if (oldId) {
             const newId = uuidv4();
             userMap[oldId] = newId;
             data.userId = newId; 
           }
        }

        // Replace any fields that reference users with the new UUIDs
        for (const [key, value] of Object.entries(data)) {
           if (userRefFields.includes(key) && typeof value === 'number') {
              if (userMap[value]) {
                 data[key] = userMap[value];
              } else {
                 console.warn(`Warning: Could not find UUID for User ID ${value} in ${fileName} (field: ${key})`);
                 // Optionally set to null if allowed, or leave as is (will likely fail validation)
                 // For now, let's assume seed integrity and maybe set to null if optional? 
                 // But most are NOT optional in current schema logic if present.
              }
           }
        }

        await model.create({ data });
      }
      console.log(`Seeded ${modelName} with data from ${fileName}`);
    } catch (error) {
      console.error(`Error seeding data for ${modelName}:`, error);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());