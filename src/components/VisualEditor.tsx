/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Block, BlockType, ColumnData } from '../types';
import { 
  ArrowUp, ArrowDown, Trash2, Plus, Settings, 
  Type, Image as ImageIcon, Video as VideoIcon, 
  Table as TableIcon, BarChart3, Percent, 
  Square, Layout, AlignLeft, AlignCenter, AlignRight, 
  Save, Eye, Check, RefreshCw, Link
} from 'lucide-react';

interface VisualEditorProps {
  initialBlocks: Block[];
  onSave: (blocks: Block[], changeSummary: string, publish: boolean) => void;
  onCancel: () => void;
}

export default function VisualEditor({ initialBlocks, onSave, onCancel }: VisualEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(JSON.parse(JSON.stringify(initialBlocks)));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    blocks.length > 0 ? blocks[0].id : null
  );
  const [changeSummary, setChangeSummary] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [urlChecking, setUrlChecking] = useState<Record<string, { loading: boolean; valid: boolean; error?: string; contentType?: string }>>({});

  const handleVerifyUrl = async (blockId: string, url: string, expectedType: 'image' | 'video') => {
    if (!url) {
      setUrlChecking((prev) => ({
        ...prev,
        [blockId]: { loading: false, valid: false, error: 'La URL no puede estar vacía.' },
      }));
      return;
    }

    setUrlChecking((prev) => ({
      ...prev,
      [blockId]: { loading: true, valid: false },
    }));

    try {
      const res = await fetch('/api/validate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, expectedType }),
      });

      if (res.ok) {
        const data = await res.json();
        setUrlChecking((prev) => ({
          ...prev,
          [blockId]: { 
            loading: false, 
            valid: data.valid, 
            error: data.error || 'Recurso inválido o inaccesible.', 
            contentType: data.contentType 
          },
        }));
      } else {
        const errData = await res.json().catch(() => ({}));
        setUrlChecking((prev) => ({
          ...prev,
          [blockId]: { 
            loading: false, 
            valid: false, 
            error: errData.message || `Error del servidor (HTTP ${res.status}).` 
          },
        }));
      }
    } catch (err: any) {
      setUrlChecking((prev) => ({
        ...prev,
        [blockId]: { loading: false, valid: false, error: `Error de red: ${err.message}` },
      }));
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  // Helper to trigger block edits
  const updateBlock = (blockId: string, updatedFields: Partial<Block>) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((b) => (b.id === blockId ? { ...b, ...updatedFields } : b))
    );
  };

  // Reorder blocks (position adjusters)
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    // Swap
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    setBlocks(newBlocks);
  };

  // Delete block
  const deleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // Add a new block
  const addBlock = (type: BlockType) => {
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const newId = `blk-${type}-${Date.now()}-${randSuffix}`;
    let newBlock: Block = { id: newId, type };

    // Initial default values for blocks
    if (type === 'text') {
      newBlock.text = { content: 'Haz doble clic para editar este texto...', style: 'body', alignment: 'left' };
    } else if (type === 'image') {
      newBlock.image = { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', caption: 'Nueva Imagen Informativa', aspectRatio: 'video' };
    } else if (type === 'video') {
      newBlock.video = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', provider: 'youtube' };
    } else if (type === 'table') {
      newBlock.table = { headers: ['Métrica', 'Q1', 'Q2'], rows: [['Ventas', '120', '150'], ['Leads', '340', '410']] };
    } else if (type === 'chart') {
      newBlock.chart = { title: 'Rendimiento Trimestral', chartType: 'bar', labels: ['Enero', 'Febrero', 'Marzo'], values: [100, 230, 180], color: '#3b82f6' };
    } else if (type === 'kpi') {
      newBlock.kpi = { label: 'Tasa de Rebote', value: '24.8%', change: '-5.2% hoy', isPositive: true, icon: 'Percent' };
    } else if (type === 'button') {
      newBlock.button = { label: 'Click Aquí', link: '#', style: 'primary', size: 'md' };
    } else if (type === 'form') {
      newBlock.form = { title: 'Formulario de Suscripción', submitLabel: 'Suscribirse', fields: [{ id: 'f1', label: 'Correo Electrónico', type: 'email', required: true }] };
    } else if (type === 'separator') {
      newBlock.separator = { style: 'solid', spacing: 'md' };
    } else if (type === 'columns') {
      const colRand = Math.random().toString(36).substring(2, 6);
      newBlock.columns = {
        layout: '1-1',
        cols: [
          { id: `col1-${Date.now()}-${colRand}`, blocks: [{ id: `sub-${Date.now()}-${colRand}-1`, type: 'text', text: { content: 'Columna Izquierda', style: 'heading-2', alignment: 'left' } }] },
          { id: `col2-${Date.now()}-${colRand}`, blocks: [{ id: `sub-${Date.now()}-${colRand}-2`, type: 'text', text: { content: 'Columna Derecha', style: 'body', alignment: 'left' } }] }
        ]
      };
    }

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newId);
  };

  const handleSaveDraft = () => {
    onSave(blocks, changeSummary || 'Cambios guardados como borrador', false);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      onSave(blocks, changeSummary || 'Publicación en tiempo real de nueva versión', true);
      setIsPublishing(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-140px)] min-h-[500px]">
      {/* 1. Selector de Bloques y Árbol de Elementos */}
      <div className="w-full xl:w-72 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col h-full overflow-y-auto">
        <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Insertar Bloques</h3>
        
        {/* Grilla de tipos de bloque */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button onClick={() => addBlock('text')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <Type className="h-4.5 w-4.5 mb-1" />
            <span className="text-[10px] font-semibold">Texto</span>
          </button>
          <button onClick={() => addBlock('image')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <ImageIcon className="h-4.5 w-4.5 mb-1" />
            <span className="text-[10px] font-semibold">Imagen</span>
          </button>
          <button onClick={() => addBlock('video')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <VideoIcon className="h-4.5 w-4.5 mb-1" />
            <span className="text-[10px] font-semibold">Video</span>
          </button>
          <button onClick={() => addBlock('table')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <TableIcon className="h-4.5 w-4.5 mb-1" />
            <span className="text-[10px] font-semibold">Tabla</span>
          </button>
          <button onClick={() => addBlock('chart')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <BarChart3 className="h-4.5 w-4.5 mb-1" />
            <span className="text-[10px] font-semibold">Gráfico</span>
          </button>
          <button onClick={() => addBlock('kpi')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <Percent className="h-4.5 w-4.5 mb-1" />
            <span className="text-[10px] font-semibold">KPI / Métrica</span>
          </button>
          <button onClick={() => addBlock('button')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <Square className="h-4.5 w-4.5 mb-1" />
            <span className="text-[10px] font-semibold">Botón</span>
          </button>
          <button onClick={() => addBlock('form')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <Settings className="h-4.5 w-4.5 mb-1" />
            <span className="text-[10px] font-semibold">Formulario</span>
          </button>
          <button onClick={() => addBlock('columns')} className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/40 hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 transition-all text-center">
            <Layout className="h-4.5 w-4.5" />
            <span className="text-[10px] font-bold">Distribuidor de Columnas</span>
          </button>
        </div>

        {/* Árbol de bloques en la página actual */}
        <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Estructura del Canvas</h3>
        <div className="flex-grow space-y-2 overflow-y-auto">
          {blocks.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic text-center py-6">Página sin bloques. Inserta uno arriba.</p>
          ) : (
            blocks.map((blk, idx) => (
              <div 
                key={blk.id}
                onClick={() => setSelectedBlockId(blk.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedBlockId === blk.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-mono">#{idx+1}</span>
                  <span className="text-xs uppercase font-mono">{blk.type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={idx === 0} 
                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'up'); }}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button 
                    disabled={idx === blocks.length - 1} 
                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'down'); }}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteBlock(blk.id); }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Lienzo Central / Vista previa interactiva */}
      <div className="flex-grow bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800/80 p-6 overflow-y-auto h-full flex flex-col justify-between">
        <div className="flex-grow space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800 mb-4">
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-blue-500" />
              Lienzo de Edición Activo
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
              {blocks.length} Bloques Totales
            </span>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {blocks.map((blk, idx) => {
              const isSelected = selectedBlockId === blk.id;
              return (
                <div 
                  key={blk.id}
                  onClick={() => setSelectedBlockId(blk.id)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/20 dark:bg-blue-950/15 border-blue-500 shadow-sm' 
                      : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800/80 hover:border-gray-300'
                  }`}
                >
                  {/* Etiqueta flotante */}
                  <span className={`absolute -top-2.5 left-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border shadow-sm ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                  }`}>
                    {blk.type} #{idx+1}
                  </span>

                  {/* Renderizado de Previsualización en Lienzo */}
                  <div className="pt-2">
                    {blk.type === 'text' && blk.text && (
                      <p className={`text-xs ${blk.text.style === 'heading-1' ? 'text-lg font-bold' : blk.text.style === 'heading-2' ? 'text-sm font-semibold text-gray-700' : 'text-gray-500'}`}>
                        {blk.text.content || '(Texto Vacío)'}
                      </p>
                    )}
                    {blk.type === 'image' && blk.image && (
                      <div className="flex items-center gap-3">
                        <img src={blk.image.url} className="h-10 w-16 object-cover rounded border" alt="" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{blk.image.caption}</p>
                          <p className="text-[9px] text-gray-400 font-mono truncate max-w-xs">{blk.image.url}</p>
                        </div>
                      </div>
                    )}
                    {blk.type === 'video' && blk.video && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                        <VideoIcon className="h-3.5 w-3.5" /> Video ({blk.video.provider}): {blk.video.url}
                      </p>
                    )}
                    {blk.type === 'table' && blk.table && (
                      <p className="text-xs text-gray-500">
                        Tabla con {blk.table.headers.length} columnas y {blk.table.rows.length} filas.
                      </p>
                    )}
                    {blk.type === 'chart' && blk.chart && (
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5 text-blue-500" /> Gráfico: {blk.chart.title} ({blk.chart.chartType})
                      </p>
                    )}
                    {blk.type === 'kpi' && blk.kpi && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{blk.kpi.label}:</span>
                        <span className="text-xs text-emerald-600 font-mono">{blk.kpi.value}</span>
                      </div>
                    )}
                    {blk.type === 'button' && blk.button && (
                      <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded text-xs font-bold border border-blue-200">
                        {blk.button.label}
                      </span>
                    )}
                    {blk.type === 'form' && blk.form && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                        Formulario: {blk.form.title} ({blk.form.fields.length} campos definidos)
                      </p>
                    )}
                    {blk.type === 'separator' && (
                      <hr className="border-gray-200 dark:border-gray-800" />
                    )}
                    {blk.type === 'columns' && blk.columns && (
                      <p className="text-xs text-gray-500">
                        Contenedor de {blk.columns.cols.length} Columnas ({blk.columns.layout})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulario de guardado */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800/80 mt-6 bg-white dark:bg-gray-950 p-4 rounded-xl space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <input 
              type="text" 
              placeholder="Escribe un resumen del cambio (ej: 'Agregado gráfico de ventas v3')"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              className="flex-grow px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:outline-none w-full"
            />
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={handleSaveDraft}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                Guardar Borrador
              </button>
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                {isPublishing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Publicar en Tiempo Real
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Panel de Configuración de Bloque Seleccionado (Lateral Derecho) */}
      <div className="w-full xl:w-80 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 h-full overflow-y-auto">
        <div className="pb-3 border-b border-gray-100 dark:border-gray-800/80 mb-4">
          <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Configuración</h3>
          <p className="text-[10px] text-gray-400">Personaliza el bloque seleccionado al instante.</p>
        </div>

        {selectedBlock ? (
          <div className="space-y-4 text-xs">
            {/* CONFIG DE TEXTO */}
            {selectedBlock.type === 'text' && selectedBlock.text && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Contenido</label>
                  <textarea
                    value={selectedBlock.text.content}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      text: { ...selectedBlock.text!, content: e.target.value }
                    })}
                    className="w-full min-h-[120px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Estilo de Texto</label>
                  <select
                    value={selectedBlock.text.style}
                    onChange={(e: any) => updateBlock(selectedBlock.id, {
                      text: { ...selectedBlock.text!, style: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  >
                    <option value="body">Cuerpo de Texto</option>
                    <option value="heading-1">Título Grande (H1)</option>
                    <option value="heading-2">Subtítulo Sección (H2)</option>
                    <option value="quote">Cita Destacada</option>
                    <option value="callout">Cuadro de Llamada (Callout)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Alineación</label>
                  <div className="flex gap-1.5">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateBlock(selectedBlock.id, {
                          text: { ...selectedBlock.text!, alignment: align }
                        })}
                        className={`flex-1 p-2 border rounded-lg flex items-center justify-center ${
                          selectedBlock.text?.alignment === align
                            ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                            : 'border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        {align === 'left' ? <AlignLeft className="h-3.5 w-3.5" /> : align === 'center' ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CONFIG DE IMAGEN */}
            {selectedBlock.type === 'image' && selectedBlock.image && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Enlace de Imagen (URL)</label>
                  <input
                    type="text"
                    value={selectedBlock.image.url}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      image: { ...selectedBlock.image!, url: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs"
                  />
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleVerifyUrl(selectedBlock.id, selectedBlock.image!.url, 'image')}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 rounded font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Link className="h-2.5 w-2.5" />
                      {urlChecking[selectedBlock.id]?.loading ? 'Verificando...' : 'Verificar Recurso'}
                    </button>
                    {urlChecking[selectedBlock.id] && (
                      <span className={`font-semibold text-[9px] text-right max-w-[150px] truncate ${urlChecking[selectedBlock.id].valid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {urlChecking[selectedBlock.id].valid 
                          ? `✓ Válido (${urlChecking[selectedBlock.id].contentType?.split(';')[0]})` 
                          : `✘ ${urlChecking[selectedBlock.id].error}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Título o Pie de Foto</label>
                  <input
                    type="text"
                    value={selectedBlock.image.caption}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      image: { ...selectedBlock.image!, caption: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Relación de Aspecto</label>
                  <select
                    value={selectedBlock.image.aspectRatio}
                    onChange={(e: any) => updateBlock(selectedBlock.id, {
                      image: { ...selectedBlock.image!, aspectRatio: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs"
                  >
                    <option value="video">Horizontal (16:9)</option>
                    <option value="square">Cuadrado (1:1)</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>
              </div>
            )}

            {/* CONFIG DE VIDEO */}
            {selectedBlock.type === 'video' && selectedBlock.video && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">URL del Video (YouTube / Vimeo / MP4)</label>
                  <input
                    type="text"
                    value={selectedBlock.video.url}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      video: { ...selectedBlock.video!, url: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs"
                  />
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleVerifyUrl(selectedBlock.id, selectedBlock.video!.url, 'video')}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 rounded font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Link className="h-2.5 w-2.5" />
                      {urlChecking[selectedBlock.id]?.loading ? 'Verificando...' : 'Verificar Recurso'}
                    </button>
                    {urlChecking[selectedBlock.id] && (
                      <span className={`font-semibold text-[9px] text-right max-w-[150px] truncate ${urlChecking[selectedBlock.id].valid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {urlChecking[selectedBlock.id].valid 
                          ? `✓ Válido (${urlChecking[selectedBlock.id].contentType?.split(';')[0]})` 
                          : `✘ ${urlChecking[selectedBlock.id].error}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Proveedor</label>
                  <select
                    value={selectedBlock.video.provider}
                    onChange={(e: any) => updateBlock(selectedBlock.id, {
                      video: { ...selectedBlock.video!, provider: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="html5">HTML5 / Servidor</option>
                  </select>
                </div>
              </div>
            )}

            {/* CONFIG DE GRÁFICO */}
            {selectedBlock.type === 'chart' && selectedBlock.chart && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Título del Gráfico</label>
                  <input
                    type="text"
                    value={selectedBlock.chart.title}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      chart: { ...selectedBlock.chart!, title: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Tipo de Visualización</label>
                  <select
                    value={selectedBlock.chart.chartType}
                    onChange={(e: any) => updateBlock(selectedBlock.id, {
                      chart: { ...selectedBlock.chart!, chartType: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  >
                    <option value="bar">Gráfico de Barras</option>
                    <option value="line">Gráfico de Líneas / Puntos</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Etiquetas (Separadas por Comas)</label>
                  <input
                    type="text"
                    value={selectedBlock.chart.labels.join(', ')}
                    onChange={(e) => {
                      const list = e.target.value.split(',').map(s => s.trim());
                      updateBlock(selectedBlock.id, {
                        chart: { ...selectedBlock.chart!, labels: list }
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Valores Numéricos (Separados por Comas)</label>
                  <input
                    type="text"
                    value={selectedBlock.chart.values.join(', ')}
                    onChange={(e) => {
                      const list = e.target.value.split(',').map(s => Number(s.trim()) || 0);
                      updateBlock(selectedBlock.id, {
                        chart: { ...selectedBlock.chart!, values: list }
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Color Primario (Hex o Tailwind)</label>
                  <input
                    type="text"
                    value={selectedBlock.chart.color}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      chart: { ...selectedBlock.chart!, color: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
              </div>
            )}

            {/* CONFIG DE BOTÓN */}
            {selectedBlock.type === 'button' && selectedBlock.button && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Texto del Botón</label>
                  <input
                    type="text"
                    value={selectedBlock.button.label}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      button: { ...selectedBlock.button!, label: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Enlace o Ancla (#inicio, URL, etc)</label>
                  <input
                    type="text"
                    value={selectedBlock.button.link}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      button: { ...selectedBlock.button!, link: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Estilo Visual</label>
                  <select
                    value={selectedBlock.button.style}
                    onChange={(e: any) => updateBlock(selectedBlock.id, {
                      button: { ...selectedBlock.button!, style: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  >
                    <option value="primary">Primario (Azul)</option>
                    <option value="secondary">Secundario (Gris)</option>
                    <option value="outline">Delineado (Outline)</option>
                    <option value="danger">Peligro (Rojo)</option>
                  </select>
                </div>
              </div>
            )}

            {/* CONFIG DE KPI */}
            {selectedBlock.type === 'kpi' && selectedBlock.kpi && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Título / Etiqueta</label>
                  <input
                    type="text"
                    value={selectedBlock.kpi.label}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      kpi: { ...selectedBlock.kpi!, label: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Valor Destacado</label>
                  <input
                    type="text"
                    value={selectedBlock.kpi.value}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      kpi: { ...selectedBlock.kpi!, value: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Indicador de Tendencia (Cambio)</label>
                  <input
                    type="text"
                    value={selectedBlock.kpi.change}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      kpi: { ...selectedBlock.kpi!, change: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <label className="font-bold text-gray-700 dark:text-gray-300">¿Es Tendencia Positiva?</label>
                  <input
                    type="checkbox"
                    checked={selectedBlock.kpi.isPositive}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      kpi: { ...selectedBlock.kpi!, isPositive: e.target.checked }
                    })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            )}

            {/* CONFIG DE FORMULARIO */}
            {selectedBlock.type === 'form' && selectedBlock.form && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Título del Formulario</label>
                  <input
                    type="text"
                    value={selectedBlock.form.title}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      form: { ...selectedBlock.form!, title: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Texto del Botón de Envío</label>
                  <input
                    type="text"
                    value={selectedBlock.form.submitLabel}
                    onChange={(e) => updateBlock(selectedBlock.id, {
                      form: { ...selectedBlock.form!, submitLabel: e.target.value }
                    })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold text-[10px] uppercase text-gray-400 mb-2">Campos del Formulario</h4>
                  <ul className="space-y-2">
                    {selectedBlock.form.fields.map((f, fIdx) => (
                      <li key={f.id} className="p-2 border border-gray-100 dark:border-gray-900 rounded-lg bg-gray-50 dark:bg-gray-900/40 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[10px]">Campo #{fIdx+1}</span>
                          <button 
                            onClick={() => {
                              const updated = selectedBlock.form!.fields.filter((field) => field.id !== f.id);
                              updateBlock(selectedBlock.id, { form: { ...selectedBlock.form!, fields: updated } });
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={f.label}
                          placeholder="Etiqueta del Campo"
                          onChange={(e) => {
                            const updated = selectedBlock.form!.fields.map((field) => field.id === f.id ? { ...field, label: e.target.value } : field);
                            updateBlock(selectedBlock.id, { form: { ...selectedBlock.form!, fields: updated } });
                          }}
                          className="w-full p-1 border rounded bg-white dark:bg-gray-950 text-[10px]"
                        />
                        <select
                          value={f.type}
                          onChange={(e: any) => {
                            const updated = selectedBlock.form!.fields.map((field) => field.id === f.id ? { ...field, type: e.target.value } : field);
                            updateBlock(selectedBlock.id, { form: { ...selectedBlock.form!, fields: updated } });
                          }}
                          className="w-full p-1 border rounded bg-white dark:bg-gray-950 text-[10px]"
                        >
                          <option value="text">Texto Corto</option>
                          <option value="email">Correo Electrónico</option>
                          <option value="textarea">Área de Texto Largo</option>
                          <option value="select">Lista de Selección</option>
                          <option value="checkbox">Check de Aceptación</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      const fRand = Math.random().toString(36).substring(2, 6);
                      const newF = { id: `f-${Date.now()}-${fRand}`, label: 'Nuevo Campo', type: 'text' as const, required: true };
                      updateBlock(selectedBlock.id, {
                        form: { ...selectedBlock.form!, fields: [...selectedBlock.form!.fields, newF] }
                      });
                    }}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-500 rounded-xl font-bold cursor-pointer text-[10px]"
                  >
                    <Plus className="h-3 w-3" /> Añadir Campo
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 leading-normal">
              <p>📌 Todos los cambios aplicados en este panel lateral se reflejarán instantáneamente en la vista previa central antes de guardar definitivamente el borrador o publicar en vivo.</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 italic text-[11px]">
            Selecciona un bloque del canvas para configurarlo en detalle.
          </div>
        )}
      </div>
    </div>
  );
}
