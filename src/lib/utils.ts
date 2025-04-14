import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add a utility function to check if a user is a member of a group
export function isUserInGroup(userId: string, group: { members: string[] }) {
  return group.members.includes(userId);
}
