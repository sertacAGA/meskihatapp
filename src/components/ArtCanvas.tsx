
import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage, Transformer, Group } from 'react-konva';
import { Stroke, CanvasImage, AppState } from '../types';
import useImage from 'use-image';

interface ArtCanvasProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  containerRef: React.RefObject<HTMLDivElement>;
  onAddNoktaAt?: (x: number, y: number) => void;
  onSaveHistory?: (snapshot: AppState) => void;
}

const URLImage = ({ image, isSelected, onSelect, onChange }: { 
  image: CanvasImage, 
  isSelected: boolean, 
  onSelect: () => void,
  onChange: (newAttrs: Partial<CanvasImage>) => void 
}) => {
  const [img] = useImage(image.src, 'anonymous');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaImage
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        rotation={image.rotation}
        opacity={image.opacity ?? 1}
        ref={shapeRef}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        draggable={!image.isLocked}
        listening={!image.isLocked}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const NoktaItem = ({ nokta, isSelected, onSelect, onChange }: { 
  nokta: any, 
  isSelected: boolean, 
  onSelect: () => void,
  onChange: (newAttrs: Partial<any>) => void 
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Rect
        key={nokta.id}
        x={nokta.x}
        y={nokta.y}
        width={nokta.size}
        height={nokta.size}
        fill={nokta.color}
        rotation={nokta.rotation}
        offsetX={nokta.size / 2}
        offsetY={nokta.size / 2}
        ref={shapeRef}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        draggable
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            size: Math.max(5, node.width() * scaleX),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export const ArtCanvas = React.forwardRef<any, ArtCanvasProps>(({ state, setState, containerRef, onAddNoktaAt, onSaveHistory }, ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const internalStageRef = useRef<any>(null);
  
  // Combine refs
  const stageRef = (ref as React.MutableRefObject<any>) || internalStageRef;

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  // Map paper styles to colors for the export background
  const getPaperColor = () => {
    switch(state.paperType) {
      case 'aharli': return '#F5E6D3';
      case 'ebru': return '#FFF9F0';
      case 'dark': return '#2C2520';
      case 'matte': default: return '#FFFFFF';
    }
  };

  const handleMouseDown = (e: any) => {
    const isStage = e.target === e.target.getStage();
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    const scale = stage.scaleX();
    const stagePos = stage.position();
    const x = (pos.x - stagePos.x) / scale;
    const y = (pos.y - stagePos.y) / scale;

    if (isStage) {
      setState(prev => ({ ...prev, selectedId: null }));
    }

    if (state.mode === 'select' || !isStage) return;

    // IMPORTANT: Only allow drawing/nokta in specific modes
    if (state.mode !== 'draw' && state.mode !== 'eraser' && state.mode !== 'nokta') return;

    if (state.mode === 'nokta') {
      onAddNoktaAt?.(x, y);
      return;
    }

    setState((prev) => ({
      ...prev,
      isDrawing: true,
      strokes: [
        ...prev.strokes,
        {
          id: Math.random().toString(36).substr(2, 9),
          points: [x, y],
          color: prev.mode === 'eraser' ? '#000000' : prev.inkColor,
          width: prev.penSize,
          angle: prev.penAngle,
          type: prev.mode === 'eraser' ? 'eraser' : 'qalam',
        },
      ],
    }));
  };

  const handleMouseMove = (e: any) => {
    if (!state.isDrawing) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    const scale = stage.scaleX();
    const stagePos = stage.position();

    const x = (pos.x - stagePos.x) / scale;
    const y = (pos.y - stagePos.y) / scale;

    const lastStroke = state.strokes[state.strokes.length - 1];
    
    // Add point to last stroke
    const newStrokes = state.strokes.slice(0, -1);
    newStrokes.push({
      ...lastStroke,
      points: [...lastStroke.points, x, y],
    });

    setState((prev) => ({
      ...prev,
      strokes: newStrokes,
    }));
  };

  const handleMouseUp = () => {
    if (state.isDrawing) {
      onSaveHistory?.(state);
    }
    setState((prev) => ({ ...prev, isDrawing: false }));
  };

  return (
    <Stage
      width={size.width}
      height={size.height}
      scaleX={state.scale}
      scaleY={state.scale}
      x={state.stagePos.x}
      y={state.stagePos.y}
      pixelRatio={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      draggable={state.mode === 'select'}
      onDragEnd={(e) => {
        if (e.target === stageRef.current) {
          setState(prev => ({
            ...prev,
            stagePos: { x: e.target.x(), y: e.target.y() }
          }));
        }
      }}
      ref={stageRef}
      id="main-stage"
    >
      {/* Background layer for export - only visible when capturing stage */}
      <Layer>
        <Rect 
          width={10000}
          height={10000}
          x={-5000}
          y={-5000}
          fill={getPaperColor()}
          listening={false}
        />
      </Layer>

      <Layer id="image-layer">
        {state.images.map((img) => (
          <URLImage
            key={img.id}
            image={img}
            isSelected={img.id === state.selectedId}
            onSelect={() => setState(prev => ({ ...prev, selectedId: img.id }))}
            onChange={(newAttrs) => {
              const imgs = state.images.map(i => i.id === img.id ? { ...i, ...newAttrs } : i);
              const newState = { ...state, images: imgs };
              setState(newState);
              onSaveHistory?.(newState);
            }}
          />
        ))}
      </Layer>

      <Layer id="drawing-layer">
        {state.noktas.map((nokta) => (
          <NoktaItem
            key={nokta.id}
            nokta={nokta}
            isSelected={nokta.id === state.selectedId}
            onSelect={() => setState(prev => ({ ...prev, selectedId: nokta.id }))}
            onChange={(newAttrs) => {
              const updated = state.noktas.map(n => n.id === nokta.id ? { ...n, ...newAttrs } : n);
              const newState = { ...state, noktas: updated };
              setState(newState);
              onSaveHistory?.(newState);
            }}
          />
        ))}

        {state.strokes.map((stroke) => {
          const angleRad = (stroke.angle * Math.PI) / 180;
          
          return (
            <Group key={stroke.id}>
              <Line
                points={stroke.points}
                stroke={stroke.color}
                strokeWidth={1}
                opacity={1}
                globalCompositeOperation={stroke.type === 'eraser' ? 'destination-out' : 'source-over'}
                sceneFunc={(context, shape) => {
                  const points = stroke.points;
                  if (points.length < 4) return;
                  
                  context.beginPath();
                  context.fillStyle = stroke.color;

                  // High-fidelity calligraphy stroke drawing
                  // Instead of just lines, we draw the "nib trail"
                  for (let i = 0; i < points.length; i += 2) {
                    const x = points[i];
                    const y = points[i+1];
                    
                    context.save();
                    context.translate(x, y);
                    context.rotate(angleRad);
                    
                    // The nib is a flat edge. We draw it.
                    // We also draw a connecting polygon to the previous point for smoothness if needed, 
                    // but many small rects at high frequency usually look okay. 
                    // For better performance, we can draw every N points or use a path.
                    
                    context.fillRect(-0.5, -stroke.width / 2, 1, stroke.width);
                    context.restore();

                    // Connect edges for smoothness
                    if (i > 0) {
                      const px = points[i-2];
                      const py = points[i-1];
                      
                      // Calculate corner points of the current and previous nib positions
                      const cos = Math.cos(angleRad + Math.PI/2);
                      const sin = Math.sin(angleRad + Math.PI/2);
                      const half = stroke.width / 2;

                      const c1x = x + cos * half;
                      const c1y = y + sin * half;
                      const c2x = x - cos * half;
                      const c2y = y - sin * half;
                      
                      const p1x = px + cos * half;
                      const p1y = py + sin * half;
                      const p2x = px - cos * half;
                      const p2y = py - sin * half;

                      context.beginPath();
                      context.moveTo(p1x, p1y);
                      context.lineTo(c1x, c1y);
                      context.lineTo(c2x, c2y);
                      context.lineTo(p2x, p2y);
                      context.closePath();
                      context.fill();
                    }
                  }
                }}
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
});
