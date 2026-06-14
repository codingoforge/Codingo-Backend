import { clerkClient } from "@clerk/clerk-sdk-node";
import User from "./user.model.js";

export const findOrCreateUser = async (clerkId) => {
  let user = await User.findOne({ clerkId });

  if (!user) {
    // Pull real name + email from Clerk so MongoDB is always populated
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      user = await User.create({
        clerkId,
        name:  `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      });
    } catch {
      // Fallback if Clerk call fails — still create the user
      user = await User.create({ clerkId });
    }
  }

  return user;
};