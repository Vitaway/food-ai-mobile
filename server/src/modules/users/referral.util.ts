import { usersRepository } from "../users/users.repository";
import { generateReferralCode } from "../../utils/referral-code";

export async function ensureUserReferralCode(userId: string): Promise<string> {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.referralCode) {
    return user.referralCode;
  }

  let code = generateReferralCode();
  while (await usersRepository.findByReferralCode(code)) {
    code = generateReferralCode();
  }

  user.referralCode = code;
  await usersRepository.save(user);
  return code;
}
