
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PAPER_STYLES: Record<string, string> = {
  aharli: 'bg-[#FDF6E3] shadow-inner', // Creamy paper
  antik: 'bg-[#E6D5B8]', // Aged parchment
  seher: 'bg-[#F0F4F8]', // Soft morning blue
  ebru: 'bg-[#F5F5F0] border-[16px] border-double border-[#8B4513]/30',
  matte: 'bg-[#FFFFFF]',
  dark: 'bg-[#1A1A1B]'
};

export const INK_COLORS = [
  { name: 'İsli Siyah', color: '#1A1A1B' },
  { name: 'Altın Varak', color: '#D4AF37' },
  { name: 'Gümüş Varak', color: '#C0C0C0' },
  { name: 'Lal Kırmızı', color: '#960018' },
  { name: 'Zümrüt Yeşil', color: '#043927' },
  { name: 'Gök Mavi', color: '#2C3E50' },
];

/**
 * Calculates the offset for a calligraphy nib at a given angle.
 * For a flat nib, the width is distributed along the angle.
 */
export function getNibOffset(width: number, angleDegrees: number) {
  const angleRad = (angleDegrees * Math.PI) / 180;
  return {
    x: (width / 2) * Math.cos(angleRad),
    y: (width / 2) * Math.sin(angleRad),
  };
}
