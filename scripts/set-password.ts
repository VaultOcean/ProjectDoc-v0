import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

async function setPassword() {
  const email = "sakthigsundar@gmail.com";
  const password = "VaultOcean@123"; // Change this to your desired password

  try {
    const hash = await hashPassword(password);
    const user = await db.user.update({
      where: { email },
      data: { passwordHash: hash },
    });

    console.log("✅ Password set successfully!");
    console.log("\nLogin credentials:");
    console.log("  Email:", email);
    console.log("  Password:", password);
    console.log("\nAccess at: http://localhost:3000/login");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

setPassword().then(() => process.exit(0));
