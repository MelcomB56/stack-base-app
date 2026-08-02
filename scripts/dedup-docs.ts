import { db } from "../src/lib/db";

async function main() {
  const docs = await db.docPage.findMany({
    where: { appId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true },
  });

  const seen = new Map<string, string>();
  const toDelete: string[] = [];
  for (const d of docs) {
    if (seen.has(d.title)) {
      toDelete.push(d.id);
      console.log("DUPLICATE:", d.title);
    } else {
      seen.set(d.title, d.id);
      console.log("KEEP:     ", d.title);
    }
  }

  if (toDelete.length > 0) {
    await db.docPage.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`\n${toDelete.length} Duplikat(e) gelöscht.`);
  } else {
    console.log("\nKeine Duplikate gefunden.");
  }

  await db.$disconnect();
}

main();
