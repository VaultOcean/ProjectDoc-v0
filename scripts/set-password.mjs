import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function setPassword() {
  const email = "sakthigsundar@gmail.com";
  const password = "VaultOcean@123"; // Change this to your desired password

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = await db.user.update({
      where: { email },
      data: { passwordHash: hash },
    });

    console.log("✅ Password set successfully!");
    console.log("\nLogin credentials:");
    console.log("  Email:", email);
    console.log("  Password:", password);
    console.log("\nAccess at: http://localhost:3000/login");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

setPassword();
