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
    // Priority 1: Check for !3d and !4d parameters (actual place coordinates)
    // Example: ...!3d-20.4239807!4d57.6978035...
    const placeRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const placeMatch = url.match(placeRegex);
    if (placeMatch && placeMatch.length >= 3) {
      return {
        lat: parseFloat(placeMatch[1]),
        lng: parseFloat(placeMatch[2])
      };
    }

    // Priority 2: Regex to find @lat,lng (viewport center)
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match && match.length >= 3) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    // Priority 3: Fallback for other formats like ?q=lat,lng or ll=lat,lng
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
