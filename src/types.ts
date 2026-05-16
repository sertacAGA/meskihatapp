
export type Point = { x: number; y: number };

export interface Stroke {
  id: string;
  points: number[]; // [x1, y1, x2, y2, ...]
  color: string;
  width: number;
  angle: number; // in degrees
  type: 'qalam' | 'nokta' | 'eraser';
}

export interface CanvasImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isLocked?: boolean;
  opacity?: number;
}

export type PaperType = 'aharli' | 'ebru' | 'matte' | 'dark' | 'antik' | 'seher';

export interface Nokta {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

export type AppMode = 'draw' | 'nokta' | 'select' | 'eraser';

export interface AppState {
  strokes: Stroke[];
  images: CanvasImage[];
  noktas: Nokta[];
  selectedId: string | null;
  paperType: PaperType;
  penSize: number;
  penAngle: number;
  inkColor: string;
  isDrawing: boolean;
  mode: AppMode;
  scale: number;
  stagePos: { x: number; y: number };
}
