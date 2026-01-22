
import React, { useState, useCallback } from 'react';
import { AuthForm } from './components/AuthForm';
import { ThreeView } from './components/ThreeView';
import { DrawingCanvas } from './components/DrawingCanvas';
import { VoiceControl } from './components/VoiceControl';
import { User, ShapeConfig, ShapeType } from './types';
import { 
  Box, Maximize, Ruler, Database, 
  Settings, Download, LogOut, Cpu, Plus, 
  Trash2, Layers, Search, Type as TypeIcon
} from 'lucide-react';
import * as THREE from 'three';
import { generateSTL, downloadSTL } from './services/stlExporter';
import { interpretShapeRequest } from './services/gemini';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shapes, setShapes] = useState<ShapeConfig[]>([
    { id: '1', type: 'box', params: { width: 10, height: 2, depth: 10 }, position: [0, 1, 0], color: '#3b82f6', label: 'Workpiece Base' }
  ]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>('1');
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddShape = async (description: string, imageData?: string) => {
    setIsProcessing(true);
    try {
      const interpreted = await interpretShapeRequest(description, imageData);
      if (interpreted.type) {
        const newShape: ShapeConfig = {
          id: Date.now().toString(),
          type: (interpreted.type as ShapeType).toLowerCase() as ShapeType,
          params: {
            width: 10, height: 10, depth: 10, radius: 5, tube: 2,
            ...interpreted.params
          },
          position: [0, 5, 0], // Place new objects at center but elevated
          color: '#3b82f6',
          label: interpreted.label || 'Synthesized Shape'
        };
        setShapes([...shapes, newShape]);
        setSelectedShapeId(newShape.id);
      }
    } catch (err) {
      console.error("AI Interpretation Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportSTL = () => {
    if (!scene) return;
    const meshes: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) meshes.push(obj);
    });
    const stlContent = generateSTL(meshes);
    downloadSTL(stlContent, `simpaad_model_${Date.now()}.stl`);
  };

  const updateSelectedShape = (field: string, value: any) => {
    setShapes(prev => prev.map(s => {
      if (s.id !== selectedShapeId) return s;
      
      if (field === 'type') {
        const newType = value as ShapeType;
        const defaultParams: any = { ...s.params };
        // Ensure required params exist for the specific type to prevent empty geometry
        if (newType === 'box' && (!defaultParams.width || !defaultParams.height || !defaultParams.depth)) {
          defaultParams.width = 10; defaultParams.height = 10; defaultParams.depth = 10;
        }
        if ((newType === 'sphere' || newType === 'cylinder' || newType === 'cone') && !defaultParams.radius) {
          defaultParams.radius = 5;
          if (newType !== 'sphere' && !defaultParams.height) defaultParams.height = 10;
        }
        if (newType === 'torus') {
          if (!defaultParams.radius) defaultParams.radius = 5;
          if (!defaultParams.tube) defaultParams.tube = 2;
        }
        return { ...s, type: newType, params: defaultParams };
      }
      
      if (field === 'params') {
        return { ...s, params: { ...s.params, ...value } };
      }
      
      return { ...s, [field]: value };
    }));
  };

  if (!user) {
    return (
      <div className="h-screen w-screen cad-bg flex items-center justify-center p-4">
        <AuthForm onAuthSuccess={setUser} />
      </div>
    );
  }

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase italic">SimpAAD</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 rounded-xl border border-slate-700/50 focus-within:border-blue-500/50 transition-all">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              placeholder="Magic Search: 'Add a 10mm sphere'" 
              className="bg-transparent border-none outline-none text-sm w-72 placeholder:text-slate-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddShape(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
          <button 
            onClick={handleExportSTL}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <Download className="w-4 h-4" /> Export STL
          </button>
          <div className="h-8 w-[1px] bg-slate-800" />
          <button 
            onClick={() => setUser(null)}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Design & Layers */}
        <aside className="w-80 border-r border-white/10 bg-slate-900/40 backdrop-blur-md flex flex-col overflow-y-auto z-10">
          <div className="p-5 space-y-8">
            {/* Hierarchy Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Scene Hierarchy
                </h3>
                <button 
                  onClick={() => {
                    const id = Date.now().toString();
                    setShapes([...shapes, { id, type: 'box', params: { width: 10, height: 10, depth: 10 }, position: [0, 5, 0], color: '#3b82f6', label: `Part ${shapes.length + 1}` }]);
                    setSelectedShapeId(id);
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {shapes.map(shape => (
                  <div 
                    key={shape.id}
                    onClick={() => setSelectedShapeId(shape.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                      selectedShapeId === shape.id 
                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-inner' 
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Box className={`w-4 h-4 ${selectedShapeId === shape.id ? 'text-blue-500' : 'text-slate-600'}`} />
                      <span className="text-sm truncate w-40 font-semibold">{shape.label}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newShapes = shapes.filter(s => s.id !== shape.id);
                        setShapes(newShapes);
                        if (selectedShapeId === shape.id) setSelectedShapeId(newShapes[0]?.id || null);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Properties Section */}
            {selectedShape ? (
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Geometry Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block">Label</label>
                    <input 
                      value={selectedShape.label}
                      onChange={(e) => updateSelectedShape('label', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-slate-950 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block">Primitive Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['box', 'sphere', 'cylinder', 'cone', 'torus'] as ShapeType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => updateSelectedShape('type', t)}
                          className={`px-3 py-2 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all border ${
                            selectedShape.type === t 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                              : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {Object.entries(selectedShape.params).map(([key, val]) => (
                      <div key={key}>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block">{key} (mm)</label>
                        <input 
                          type="number"
                          step="0.5"
                          value={val}
                          onChange={(e) => updateSelectedShape('params', { [key]: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xs text-slate-600 italic">Select a part to edit its properties</p>
              </div>
            )}
          </div>
        </aside>

        {/* Center View - 3D Viewport */}
        <main className="flex-1 relative bg-slate-950 overflow-hidden">
          {isProcessing && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-600/20 rounded-full"></div>
                  <div className="absolute top-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg tracking-tight">Synthesizing Geometry</p>
                  <p className="text-blue-400 text-sm animate-pulse">Consulting SimpAAD AI Engine...</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute inset-0">
            <ThreeView shapes={shapes} onSceneUpdate={setScene} />
          </div>
          
          {/* View Controls Overlay */}
          <div className="absolute top-6 right-6 flex flex-col gap-3">
            {[Ruler, Maximize, Settings].map((Icon, i) => (
              <button key={i} className="p-3.5 bg-slate-900/90 backdrop-blur border border-white/10 rounded-2xl hover:bg-blue-600 group transition-all shadow-2xl">
                <Icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </main>

        {/* Right Sidebar - AI Tools (Sketch & Voice) */}
        <aside className="w-96 border-l border-white/10 bg-slate-900/40 backdrop-blur-md flex flex-col overflow-y-auto z-10">
          <div className="p-6 space-y-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight italic">
                <Database className="w-5 h-5 text-blue-500" /> AI INTELLIGENCE
              </h2>
              <p className="text-xs text-slate-500 font-medium">Turn imagination into printable physical objects.</p>
            </div>

            <div className="p-1 bg-slate-800/30 rounded-2xl border border-white/5">
              <DrawingCanvas onCapture={(img) => handleAddShape("I drew this shape, convert to 3D primitive", img)} />
            </div>
            
            <hr className="border-white/5" />

            <VoiceControl onShapeUpdate={() => {}} />

            <div className="p-5 rounded-2xl bg-blue-600/5 border border-blue-500/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                  <Cpu className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Assistant Tips</h4>
              </div>
              <ul className="text-[11px] text-slate-500 space-y-2 leading-relaxed font-medium">
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  "Draw a rough circle to create a high-precision sphere."
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  "Use voice to say: 'Give me a box that is 100mm wide'."
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  "Sketches are analyzed by Gemini Vision to determine the best primitive."
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer / Status Bar */}
      <footer className="h-10 border-t border-white/5 flex items-center justify-between px-6 text-[10px] text-slate-500 bg-slate-950/90 backdrop-blur font-mono tracking-tighter">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> ENGINE: STABLE</span>
          <span>MESHES: {shapes.length}</span>
          <span>UNITS: MM</span>
        </div>
        <div className="flex gap-6 uppercase font-black text-[9px] tracking-[0.1em]">
          <span className="text-slate-700">COORD_X: 0.00</span>
          <span className="text-slate-700">COORD_Y: 0.00</span>
          <span className="text-blue-500/50 hover:text-blue-500 cursor-pointer transition-colors">Documentation</span>
          <span className="text-green-500/50">v3_PRO_ACTIVE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
