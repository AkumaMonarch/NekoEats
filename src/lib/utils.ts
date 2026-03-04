import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return `Rs ${amount.toFixed(2)}`;
};

export const extractCoordinates = (url: string): { lat: number, lng: number } | null => {
  try {
    // Regex to find @lat,lng
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match && match.length >= 3) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    // Fallback for other formats like ?q=lat,lng or ll=lat,lng
    const regex2 = /[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match2 = url.match(regex2);
    if (match2 && match2.length >= 3) {
      return {
        lat: parseFloat(match2[1]),
        lng: parseFloat(match2[2])
      };
    }

    return null;
  } catch (e) {
    console.error("Error parsing coordinates", e);
    return null;
  }
};
