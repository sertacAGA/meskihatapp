/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ArtCanvas } from './components/ArtCanvas';
import { AppState, PaperType } from './types';
import { PAPER_STYLES } from './lib/utils';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Menu, X, RotateCcw, RotateCw, Trash2, Save, Download, FilePlus, Lock, Unlock, ZoomIn, ZoomOut, Maximize, Maximize2, Eraser, PenTool, MousePointer2 } from 'lucide-react';

const INITIAL_STATE: AppState = {
  strokes: [],
  images: [],
  noktas: [],
  selectedId: null,
  paperType: 'aharli',
  penSize: 15,
  penAngle: 45,
  inkColor: '#1A1A1B',
  isDrawing: false,
  mode: 'draw',
  scale: 1,
  stagePos: { x: 0, y: 0 },
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('mesk_i_hat_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [historyStack, setHistoryStack] = useState<AppState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const artCanvasRef = useRef<any>(null);

  // Improved history committer that avoids closure issues by using stateRef
  const commitToHistory = (customState?: AppState) => {
    const stateToSave = customState || stateRef.current;
    setHistoryStack(prevStack => {
      const newStack = prevStack.slice(0, historyIndex + 1);
      if (newStack.length > 50) newStack.shift();
      return [...newStack, JSON.parse(JSON.stringify(stateToSave))];
    });
    setHistoryIndex(prev => {
      const nextIdx = prev + 1;
      return nextIdx > 49 ? 49 : nextIdx;
    });
  };

  const handleSave = () => {
    localStorage.setItem('mesk_i_hat_save', JSON.stringify(state));
    alert('Çalışma kaydedildi.');
  };

  const handleAddNoktaAt = (x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newState: AppState = {
      ...state,
      noktas: [
        ...state.noktas,
        {
          id,
          x,
          y,
          size: state.penSize,
          color: state.inkColor,
          rotation: state.penAngle
        }
      ],
      selectedId: id,
      mode: 'draw' // Reset mode after adding nokta
    };
    setState(newState);
    commitToHistory(newState);
  };

  const handleZoom = (factor: number) => {
    setState(prev => ({
      ...prev,
      scale: Math.min(Math.max(0.1, prev.scale * factor), 5)
    }));
  };

  const handleResetZoom = () => {
    setState(prev => ({ ...prev, scale: 1, stagePos: { x: 0, y: 0 } }));
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleUpdateSelectedObject = (props: any) => {
    if (!state.selectedId) return;
    const newState: AppState = {
      ...state,
      noktas: state.noktas.map(n => n.id === state.selectedId ? { ...n, ...props } : n),
      images: state.images.map(img => img.id === state.selectedId ? { ...img, ...props } : img)
    };
    setState(newState);
  };

  const handleHistorySave = (snapshot?: AppState) => {
     commitToHistory(snapshot);
  };

  const handleExportPDF = () => {
    const stage = artCanvasRef.current;
    if (!stage) return;
    
    // Deselect before export for a clean look
    setState(p => ({ ...p, selectedId: null }));

    // Small delay to allow state update/deselect to render
    setTimeout(() => {
      try {
        // High-density capture
        // We capture the whole stage
        const dataURL = stage.toDataURL({ 
          pixelRatio: 3, // Even higher quality
          mimeType: 'image/png'
        });

        const width = stage.width();
        const height = stage.height();

        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height]
        });

        pdf.addImage(dataURL, 'PNG', 0, 0, width, height);
        pdf.save('mesk-i-hat_calismasi.pdf');
        alert('PDF başarıyla oluşturuldu ve indirildi.');
      } catch (error) {
        console.error('PDF Export Error:', error);
        alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }, 100);
  };

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newState: AppState = {
          ...state,
          images: [
            ...state.images,
            {
              id,
              src: event.target?.result as string,
              x: 100,
              y: 100,
              width: 200,
              height: 200,
              rotation: 0,
              opacity: 1
            }
          ]
        };
        setState(newState);
        commitToHistory(newState);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    if (confirm('Tüm çalışmayı temizlemek istediğinize emin misiniz?')) {
      setState(INITIAL_STATE);
      commitToHistory(INITIAL_STATE);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const snapshot = historyStack[newIndex];
      if (snapshot) {
        setHistoryIndex(newIndex);
        setState(JSON.parse(JSON.stringify(snapshot)));
      }
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setState(INITIAL_STATE);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIndex = historyIndex + 1;
      const snapshot = historyStack[newIndex];
      if (snapshot) {
        setHistoryIndex(newIndex);
        setState(JSON.parse(JSON.stringify(snapshot)));
      }
    }
  };

  const handleDeleteSelected = () => {
    if (!state.selectedId) return;
    const newState: AppState = {
      ...state,
      noktas: state.noktas.filter(n => n.id !== state.selectedId),
      images: state.images.filter(img => img.id !== state.selectedId),
      selectedId: null
    };
    setState(newState);
    commitToHistory(newState);
  };

  const handleToggleLock = () => {
    if (!state.selectedId) return;
    const isImage = state.images.some(img => img.id === state.selectedId);
    if (!isImage) return;

    setState(prev => {
      const targetImg = prev.images.find(img => img.id === prev.selectedId);
      if (!targetImg) return prev;
      
      const newIsLocked = !targetImg.isLocked;
      const newState = {
        ...prev,
        images: prev.images.map(img => 
          img.id === prev.selectedId ? { ...img, isLocked: newIsLocked } : img
        ),
        // If it's now locked, deselect it because it won't be "listening" anymore
        selectedId: newIsLocked ? null : prev.selectedId
      };
      commitToHistory(newState);
      return newState;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent deleting if the user is in an input field
        if (document.activeElement?.tagName === 'INPUT') return;
        handleDeleteSelected();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedId]);

  return (
    <div className="flex h-screen w-full bg-natural-canvas overflow-hidden select-none font-serif">
      <div className={cn(
        "fixed inset-0 bg-black/20 z-30 transition-opacity lg:hidden",
        isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsSidebarOpen(false)} />

      <div className={cn(
        "fixed lg:static z-40 transition-transform duration-300 lg:translate-x-0 h-full",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          state={state} 
          setState={setState} 
          onExportPDF={handleExportPDF}
          onClear={handleClear}
          onImageImport={handleImageImport}
          onAddNokta={() => setState(p => ({ ...p, mode: 'nokta' }))}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex >= 0}
          canRedo={historyIndex < historyStack.length - 1}
          onUpdateSelectedNokta={handleUpdateSelectedObject}
          onSaveHistory={handleHistorySave}
        />
      </div>

      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-3 bg-natural-sidebar border border-natural-border rounded-xl shadow-lg lg:hidden text-natural-accent"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <main className="flex-1 relative flex items-center justify-center p-4 lg:p-12 overflow-hidden flex-col">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3D352E 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Global Toolbar Above Paper */}
        <div className="mb-6 flex items-center gap-1 bg-natural-sidebar/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-natural-border z-20 transition-all hover:shadow-2xl">
            <button 
              onClick={handleUndo}
              disabled={historyIndex < 0}
              className="p-3 hover:bg-natural-bg text-natural-text rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed group relative"
              title="Geri Al (Ctrl+Z)"
            >
              <RotateCcw size={18} className="rotate-[-45deg]" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Geri Al</span>
            </button>

            <button 
              onClick={handleRedo}
              disabled={historyIndex >= historyStack.length - 1}
              className="p-3 hover:bg-natural-bg text-natural-text rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed group relative"
              title="İleri Al (Ctrl+Y)"
            >
              <RotateCw size={18} className="rotate-[45deg]" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">İleri Al</span>
            </button>

            <div className="w-[1px] h-6 bg-natural-border mx-1" />

            <button 
              onClick={() => setState(p => ({ ...p, mode: 'select' }))}
              className={cn(
                "p-3 rounded-xl transition-all group relative",
                state.mode === 'select' ? "bg-natural-accent text-white" : "hover:bg-natural-bg text-natural-text"
              )}
              title="Zemini Kaydır (Pan/Move Stage)"
            >
              <MousePointer2 size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Zemini Kaydır (Pan)</span>
            </button>

            <button 
              onClick={() => setState(p => ({ ...p, mode: 'draw' }))}
              className={cn(
                "p-3 rounded-xl transition-all group relative",
                state.mode === 'draw' ? "bg-natural-accent text-white" : "hover:bg-natural-bg text-natural-text"
              )}
              title="Kalem"
            >
              <PenTool size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Kalem</span>
            </button>

            <button 
              onClick={() => setState(p => ({ ...p, mode: 'eraser' }))}
              className={cn(
                "p-3 rounded-xl transition-all group relative",
                state.mode === 'eraser' ? "bg-natural-accent text-white" : "hover:bg-natural-bg text-natural-text"
              )}
              title="Silgi"
            >
              <Eraser size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Silgi</span>
            </button>

            <div className="w-[1px] h-6 bg-natural-border mx-1" />

            <button 
              onClick={() => handleZoom(1.1)}
              className="p-3 hover:bg-natural-bg text-natural-text rounded-xl transition-all group relative"
              title="Yakınlaştır"
            >
              <ZoomIn size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Yakınlaştır</span>
            </button>

            <button 
              onClick={() => handleZoom(0.9)}
              className="p-3 hover:bg-natural-bg text-natural-text rounded-xl transition-all group relative"
              title="Uzaklaştır"
            >
              <ZoomOut size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Uzaklaştır</span>
            </button>

            <button 
              onClick={handleResetZoom}
              className="p-3 hover:bg-natural-bg text-natural-text rounded-xl transition-all group relative"
              title="Sığdır"
            >
              <Maximize size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Sığdır</span>
            </button>
            
            <button 
              onClick={toggleFullScreen}
              className="p-3 hover:bg-natural-bg text-natural-text rounded-xl transition-all group relative"
              title="Tam Ekran"
            >
              <Maximize2 size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Tam Ekran</span>
            </button>

            <div className="w-[1px] h-6 bg-natural-border mx-1" />

            <button 
              onClick={handleDeleteSelected}
              disabled={!state.selectedId}
              className="p-3 hover:bg-red-50 text-red-600 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed group relative"
              title="Seçiliyi Sil (Del/Backspace)"
            >
              <Trash2 size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Seçiliyi Sil</span>
            </button>

            {state.selectedId && state.images.some(img => img.id === state.selectedId) && (
              <button 
                onClick={handleToggleLock}
                className="p-3 hover:bg-orange-50 text-orange-600 rounded-xl transition-all group relative"
                title="Kilitle/Aç"
              >
                {state.images.find(img => img.id === state.selectedId)?.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                  {state.images.find(img => img.id === state.selectedId)?.isLocked ? 'Kilidi Aç' : 'Kilitle'}
                </span>
              </button>
            )}

            <button 
              onClick={handleClear}
              className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl transition-all group relative"
              title="Yeni Çizim"
            >
              <FilePlus size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Yeni Çizim</span>
            </button>

            <div className="w-[1px] h-6 bg-natural-border mx-1" />

            <button 
              onClick={handleSave}
              className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl transition-all group relative"
              title="Kaydet"
            >
              <Save size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Kaydet</span>
            </button>

            <button 
              onClick={handleExportPDF}
              className="p-3 hover:bg-green-50 text-green-600 rounded-xl transition-all group relative"
              title="Export PDF"
            >
              <Download size={18} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-natural-text text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Dışa Aktar</span>
            </button>
        </div>

        <motion.div 
          ref={containerRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "w-full lg:w-[85%] h-[70%] lg:h-[85%] shadow-2xl relative overflow-hidden transition-all duration-700 ease-in-out border-[8px] lg:border-[16px] border-natural-sidebar",
            PAPER_STYLES[state.paperType],
            state.paperType === 'ebru' && "rounded-sm"
          )}
        >
          {state.paperType === 'ebru' && (
              <div className="absolute inset-0 pointer-events-none border-[12px] border-double border-natural-accent/30 z-10 opacity-30 shadow-inner overflow-hidden">
                  {/* Ebru-like marbled background pattern using CSS gradients */}
                  <div className="absolute inset-0 opacity-20" 
                    style={{ 
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, #960018 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, #043927 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, #2C3E50 0%, transparent 50%),
                        radial-gradient(circle at 70% 60%, #D4AF37 0%, transparent 50%)
                      `,
                      filter: 'blur(40px)',
                      backgroundSize: '200% 200%'
                    }} 
                  />
                  <div className="w-full h-full opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 2px, transparent 2px, transparent 10px)' }} />
              </div>
          )}

          <ArtCanvas 
             ref={artCanvasRef}
             state={state} 
             setState={setState} 
             containerRef={containerRef}
             onAddNoktaAt={handleAddNoktaAt}
             onSaveHistory={handleHistorySave}
          />

          {/* Quick Info HUD */}
          <div className="absolute bottom-6 left-6 flex gap-6 pointer-events-none opacity-50 text-natural-text">
             <div className="text-[10px] font-sans font-bold uppercase tracking-widest">AÇI: {state.penAngle}°</div>
             <div className="text-[10px] font-sans font-bold uppercase tracking-widest">UÇ: {state.penSize}mm</div>
             <div className="text-[10px] font-sans font-bold uppercase tracking-widest">ÖLÇÜ: {Math.round(state.penSize / 3)} Nokta</div>
          </div>

          <div className="absolute bottom-6 right-6 text-[10px] italic text-natural-subtext opacity-60">
             {state.paperType === 'aharli' && 'Geleneksel Aharlı Kağıt Dokusu'}
             {state.paperType === 'ebru' && 'Lalezar Ebru Kenar Süslemesi'}
             {state.paperType === 'matte' && 'Saf Beyaz Zemin'}
             {state.paperType === 'dark' && 'Koyu Mürekkep Zemini'}
          </div>
        </motion.div>
        
        {/* Floating Tooltips or Help */}
        <AnimatePresence>
            {!state.strokes.length && !state.images.length && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-16 text-natural-subtext text-[10px] font-cinzel tracking-[0.3em] pointer-events-none text-center bg-natural-sidebar/80 px-6 py-2 rounded-full border border-natural-border backdrop-blur-sm"
                >
                    Hattın sesine kulak verin. Meşke başlayın...
                </motion.div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
}
