import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCronSchedule(schedule: string): string {
  try {
    const parts = schedule.split(' ');
    if (parts.length < 2) return schedule;

    const minute = parseInt(parts[0]);
    const hour = parseInt(parts[1]);

    if (isNaN(minute) || isNaN(hour)) return schedule;

    // Manual formatting for consistency across server/client
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const hour24 = hour.toString().padStart(2, '0');
    const minuteStr = minute.toString().padStart(2, '0');

    return `${hour24}:${minuteStr} ~ ${hour12}:${minuteStr} ${period} `;
  } catch (e) {
    return schedule;
  }
}
