
import React from 'react';
import { 
  Pen, 
  MousePointer2, 
  Trash2, 
  Download, 
  Image as ImageIcon, 
  Palette,
  Maximize2,
  Settings2,
  FileText,
  Save,
  RotateCcw,
  Layers,
  Lock,
  Unlock
} from 'lucide-react';
import { AppState } from '../types';
import { cn, INK_COLORS, PAPER_STYLES } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExportPDF: () => void;
  onClear: () => void;
  onImageImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddNokta: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUpdateSelectedNokta?: (props: any) => void;
  onSaveHistory?: (snapshot: AppState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  state, 
  setState, 
  onExportPDF, 
  onClear, 
  onImageImport, 
  onAddNokta, 
  onSave, 
  onUndo, 
  onRedo,
  canUndo,
  canRedo,
  onUpdateSelectedNokta,
  onSaveHistory
}) => {
  const [activeTab, setActiveTab] = React.useState<'tools' | 'paper' | 'images' | 'export'>('tools');

  return (
    <div className="w-80 h-screen bg-natural-sidebar border-r border-natural-border flex flex-col shadow-xl z-20">
      <div className="p-6 border-b border-natural-border flex items-center justify-center bg-natural-bg/50">
        <h1 className="font-cinzel text-xl font-bold tracking-widest text-natural-accent">HAT USTASI</h1>
      </div>

      <div className="flex border-b border-natural-border">
        {(['tools', 'paper', 'images', 'export'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-all relative overflow-hidden font-sans px-1",
              activeTab === tab ? "text-natural-accent" : "text-natural-subtext hover:text-natural-text"
            )}
          >
            {tab === 'tools' && 'KALEM'}
            {tab === 'paper' && 'KAĞIT'}
            {tab === 'images' && 'GÖRSEL'}
            {tab === 'export' && 'İŞLEM'}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-natural-accent" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {activeTab === 'tools' && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <section className="space-y-4">
              <label className="text-[10px] font-bold text-natural-subtext uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={12} /> Kalem Ayarları
              </label>
              
              {/* Pen Nib Preview Box */}
              <div className="w-full aspect-video bg-natural-bg rounded-xl border border-natural-border flex items-center justify-center relative overflow-hidden shadow-inner mb-2">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
                  <div 
                    className="bg-natural-text transition-all duration-75"
                    style={{ 
                      width: '2px', 
                      height: `${state.penSize}px`,
                      transform: `rotate(${state.penAngle}deg)`,
                      boxShadow: '0 0 15px rgba(0,0,0,0.2)'
                    }}
                  />
                  <span className="absolute bottom-2 right-2 text-[8px] font-mono opacity-30 tracking-tighter uppercase">Meşk Kutusu</span>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-natural-text">
                    <span>Uç Genişliği</span>
                    <span className="font-mono">{state.penSize}px</span>
                  </div>
                  <input 
                    type="range" min="1" max="100" value={state.penSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setState(p => ({ ...p, penSize: val }));
                      onUpdateSelectedNokta?.({ size: val });
                    }}
                    onMouseUp={() => {
                      const latestState = { ...state };
                      onSaveHistory?.(latestState);
                    }}
                    className="w-full accent-natural-accent"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-natural-text">
                    <span>Kalem Açısı</span>
                    <span className="font-mono">{state.penAngle}°</span>
                  </div>
                  <input 
                    type="range" min="0" max="360" value={state.penAngle}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setState(p => ({ ...p, penAngle: val }));
                      onUpdateSelectedNokta?.({ rotation: val });
                    }}
                    onMouseUp={() => {
                      const latestState = { ...state };
                      onSaveHistory?.(latestState);
                    }}
                    className="w-full accent-natural-accent"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <label className="text-[10px] font-bold text-natural-subtext uppercase tracking-widest flex items-center gap-2">
                <Palette size={12} /> Mürekkep Hokkaları (Hokka)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {INK_COLORS.map((ink) => (
                  <button
                    key={ink.color}
                    onClick={() => {
                      const newState = { ...state, inkColor: ink.color };
                      setState(newState);
                      onUpdateSelectedNokta?.({ color: ink.color });
                      onSaveHistory?.(newState);
                    }}
                    className={cn(
                      "group relative flex flex-col items-center gap-1.5 transition-all p-1 rounded-xl",
                      state.inkColor === ink.color ? "bg-natural-accent/5 scale-105" : "hover:bg-natural-bg opacity-70"
                    )}
                  >
                    <div className="relative w-10 h-10">
                        {/* Hokka Body */}
                        <div className="absolute inset-0 bg-stone-800 rounded-lg shadow-lg border border-white/5" />
                        <div className="absolute inset-x-2 top-2 h-5 rounded-md shadow-inner transition-colors" 
                             style={{ backgroundColor: ink.color }} />
                        
                        {state.inkColor === ink.color && (
                            <motion.div layoutId="color-select" className="absolute -inset-1.5 border border-natural-accent rounded-xl" />
                        )}
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-tighter text-natural-subtext text-center leading-none truncate w-full">
                        {ink.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <label className="text-[10px] font-bold text-natural-subtext uppercase tracking-widest flex items-center gap-2">
                <Maximize2 size={12} /> Ölçüm Aletleri
              </label>
              <button 
                onClick={onAddNokta}
                className={cn(
                  "w-full flex items-center justify-between p-4 border rounded-xl transition-all",
                  state.mode === 'nokta' 
                    ? "border-natural-accent bg-natural-accent/10 text-natural-accent ring-2 ring-natural-accent/20" 
                    : "border-natural-accent/20 bg-natural-accent/5 text-natural-accent hover:bg-natural-accent/10"
                )}
              >
                  <div className="flex items-center gap-3">
                      <div className={cn("w-4 h-4 rotate-45 transition-colors", state.mode === 'nokta' ? "bg-natural-accent" : "bg-natural-accent/60")} />
                      <div className="text-left">
                          <div className="text-xs font-bold uppercase tracking-tight">Nokta Yerleştir</div>
                          <div className="text-[10px] opacity-70 italic">
                            {state.mode === 'nokta' ? 'Tuvale tıklayarak yerleştirin' : 'Ölçü birimi için nokta ekle'}
                          </div>
                      </div>
                  </div>
              </button>
            </section>
          </motion.div>
        )}

        {activeTab === 'paper' && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
             <section className="space-y-4">
                <label className="text-[10px] font-bold text-natural-subtext uppercase tracking-widest flex items-center gap-2">
                  <Layers size={12} /> Zemin ve Kağıtlar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PAPER_STYLES).map(([key, style]) => (
                    <button
                      key={key}
                      onClick={() => {
                        const newState = { ...state, paperType: key as any };
                        setState(newState);
                        onSaveHistory?.(newState);
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left group relative overflow-hidden",
                        state.paperType === key ? "border-natural-accent bg-natural-accent/5 ring-2 ring-natural-accent/10" : "border-natural-border hover:bg-natural-bg"
                      )}
                    >
                        <div className={cn("w-full h-8 mb-2 rounded-sm shadow-inner transition-opacity", style)} />
                        <div className="text-[10px] font-bold uppercase tracking-tight text-natural-text truncate">
                          {key === 'aharli' && 'Aharlı Kağıt'}
                          {key === 'antik' && 'Antik Meşk'}
                          {key === 'seher' && 'Seher Mavisi'}
                          {key === 'ebru' && 'Ebru Kenarlı'}
                          {key === 'matte' && 'Mat Beyaz'}
                          {key === 'dark' && 'Koyu Zemin'}
                        </div>
                    </button>
                  ))}
                </div>
             </section>
          </motion.div>
        )}

        {activeTab === 'images' && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
             <section className="space-y-4">
                <label className="text-[10px] font-bold text-natural-subtext uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={12} /> Görsel ve Arka Plan
                </label>
                <div className="space-y-3">
                   {state.images.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <div className="text-[9px] font-bold text-natural-subtext uppercase tracking-wider mb-1">Yüklü Görseller</div>
                        {state.images.map(img => (
                          <div key={img.id} className="flex items-center justify-between p-2 bg-natural-bg rounded-lg border border-natural-border group">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-8 h-8 rounded bg-natural-canvas border border-natural-border overflow-hidden flex-shrink-0">
                                   <img src={img.src} alt="" className="w-full h-full object-cover opacity-50" />
                                </div>
                                <span className="text-[10px] truncate opacity-60">Görsel #{img.id.slice(0,4)}</span>
                             </div>
                             <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => {
                                    const updated = state.images.map(i => i.id === img.id ? { ...i, isLocked: !i.isLocked } : i);
                                    const newState = { ...state, images: updated, selectedId: state.selectedId === img.id ? null : state.selectedId };
                                    setState(newState);
                                    onSaveHistory?.(newState);
                                  }}
                                  className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    img.isLocked ? "bg-red-50 text-red-600" : "hover:bg-natural-border text-natural-subtext"
                                  )}
                                  title={img.isLocked ? "Kilidi Aç" : "Kilitle"}
                                >
                                  {img.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                                </button>
                                <button 
                                  onClick={() => {
                                    const updated = state.images.filter(i => i.id !== img.id);
                                    const newState = { ...state, images: updated, selectedId: state.selectedId === img.id ? null : state.selectedId };
                                    setState(newState);
                                    onSaveHistory?.(newState);
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-md transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                             </div>
                          </div>
                        ))}
                      </div>
                   )}

                   <div className="relative group">
                      <input 
                        type="file" accept="image/*" onChange={onImageImport}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="p-6 border border-dashed border-natural-border rounded-xl flex flex-col items-center gap-2 group-hover:border-natural-accent group-hover:bg-natural-accent/5 transition-all">
                        <ImageIcon size={20} className="text-natural-subtext group-hover:text-natural-accent" />
                        <span className="text-[9px] font-bold text-natural-subtext uppercase tracking-widest text-center">
                          Yeni Görsel Ekle <br/>
                          <span className="opacity-50 lowercase font-normal italic">(üzerinde meşk etmek için)</span>
                        </span>
                      </div>
                   </div>
                   <p className="text-[9px] text-natural-subtext italic mt-2">Buraya bir hat örneği yükleyerek üzerine şeffaf bir şekilde meşk edebilirsiniz.</p>
                </div>
             </section>
 
             {state.selectedId && state.images.some(img => img.id === state.selectedId) && (
               <section className="space-y-4 pt-4 border-t border-natural-border">
                  <label className="text-[10px] font-bold text-natural-subtext uppercase tracking-widest flex items-center gap-2">
                    <Settings2 size={12} /> Görsel Ayarları
                  </label>
                  <div className="space-y-3">
                     <div className="flex justify-between text-xs text-natural-text">
                       <span>Opaklık (Meşk Modu)</span>
                       <span className="font-mono">%{Math.round((state.images.find(img => img.id === state.selectedId)?.opacity ?? 1) * 100)}</span>
                     </div>
                     <input 
                       type="range" min="0" max="1" step="0.01" 
                       value={state.images.find(img => img.id === state.selectedId)?.opacity ?? 1}
                       onChange={(e) => {
                         const val = parseFloat(e.target.value);
                         onUpdateSelectedNokta?.({ opacity: val });
                       }}
                       onMouseUp={() => {
                         const latestState = { ...state };
                         onSaveHistory?.(latestState);
                       }}
                       className="w-full accent-natural-accent"
                     />
                     <p className="text-[9px] text-natural-subtext italic">Opaklığı düşürerek resmin detaylarını daha rahat görebilirsiniz.</p>
                  </div>
               </section>
             )}
          </motion.div>
        )}

        {activeTab === 'export' && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
             <button 
                onClick={onExportPDF}
                className="w-full flex items-center justify-between p-4 bg-natural-accent text-white rounded-xl hover:opacity-90 transition-all group shadow-md"
             >
                <div className="flex items-center gap-3">
                    <FileText size={20} className="text-natural-bg group-hover:text-white" />
                    <div className="text-left">
                        <div className="text-xs font-bold uppercase tracking-tight">PDF Dışa Aktar</div>
                        <div className="text-[10px] text-natural-bg/70 font-mono">vektörel kalitede çıktı</div>
                    </div>
                </div>
                <Download size={18} />
             </button>

             <button 
                onClick={onSave}
                className="w-full flex items-center justify-between p-4 border border-natural-border bg-white/50 rounded-xl hover:bg-white transition-all shadow-sm"
             >
                <div className="flex items-center gap-3 text-natural-text font-sans">
                    <Save size={20} className="text-natural-accent" />
                    <div className="text-left">
                        <div className="text-xs font-bold uppercase tracking-tight">Projeyi Kaydet</div>
                        <div className="text-[10px] text-natural-subtext font-sans">mevcut çalışmanızı saklayın</div>
                    </div>
                </div>
             </button>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-natural-border/20 border-t border-natural-border italic text-[10px] text-natural-subtext text-center">
        Hat sanatının dijital meşki. "Elif-ba"dan "Müsenna"ya...
      </div>
    </div>
  );
};
