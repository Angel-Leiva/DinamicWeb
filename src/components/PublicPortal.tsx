/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Page, Block, FormSubmission, ColumnData 
} from '../types';
import { 
  TrendingUp, TrendingDown, BookOpen, Percent, 
  Send, AlertCircle, CheckCircle, Play, Sparkles 
} from 'lucide-react';

interface PublicPortalProps {
  pages: Page[];
  onSubmitForm: (submission: FormSubmission) => void;
}

export default function PublicPortal({ pages, onSubmitForm }: PublicPortalProps) {
  const publishedPages = pages.filter((p) => p.isPublished);
  const [activeSlug, setActiveSlug] = useState<string>(
    publishedPages.length > 0 ? publishedPages[0].slug : 'inicio'
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formSubmittedId, setFormSubmittedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const currentPage = publishedPages.find((p) => p.slug === activeSlug) || publishedPages[0];

  const handleInputChange = (blockId: string, fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [`${blockId}_${fieldId}`]: value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent, block: Block) => {
    e.preventDefault();
    if (!block.form) return;

    const submissionData: Record<string, any> = {};
    block.form.fields.forEach((fld) => {
      const key = `${block.id}_${fld.id}`;
      submissionData[fld.label] = formData[key] || '';
    });

    const submission: FormSubmission = {
      id: `sub-${Date.now()}`,
      formBlockId: block.id,
      formTitle: block.form.title,
      pageTitle: currentPage.title,
      data: submissionData,
      submittedAt: new Date().toISOString(),
    };

    onSubmitForm(submission);
    setFormSubmittedId(block.id);

    // Reset fields for this form
    const cleared: Record<string, string> = { ...formData };
    block.form.fields.forEach((fld) => {
      delete cleared[`${block.id}_${fld.id}`];
    });
    setFormData(cleared);

    setTimeout(() => {
      setFormSubmittedId(null);
    }, 5000);
  };

  // Render individual blocks
  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'text':
        if (!block.text) return null;
        const { content, style, alignment } = block.text;
        const alignClass = 
          alignment === 'center' ? 'text-center' : 
          alignment === 'right' ? 'text-right' : 'text-left';

        if (style === 'heading-1') {
          return (
            <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-4 ${alignClass}`}>
              {content}
            </h1>
          );
        } else if (style === 'heading-2') {
          return (
            <h2 className={`text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-6 mb-3 ${alignClass}`}>
              {content}
            </h2>
          );
        } else if (style === 'quote') {
          return (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-1.5 my-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 rounded-r-lg">
              "{content}"
            </blockquote>
          );
        } else if (style === 'callout') {
          return (
            <div className={`p-4 border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-950/20 rounded-xl my-4 text-sm text-blue-800 dark:text-blue-300 ${alignClass}`}>
              {content}
            </div>
          );
        } else {
          return (
            <p className={`text-sm md:text-base leading-relaxed text-gray-600 dark:text-gray-300 my-3 whitespace-pre-wrap ${alignClass}`}>
              {content}
            </p>
          );
        }

      case 'image':
        if (!block.image) return null;
        const { url, caption, aspectRatio } = block.image;
        const aspectClass = 
          aspectRatio === 'square' ? 'aspect-square' : 
          aspectRatio === 'video' ? 'aspect-video' : 'aspect-auto';

        return (
          <div className="my-5 flex flex-col items-center">
            <div className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 w-full max-w-3xl ${aspectClass}`}>
              <img 
                src={url || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800'} 
                alt={caption || 'CMS Upload'} 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {caption && (
              <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400 text-center max-w-2xl">
                {caption}
              </p>
            )}
          </div>
        );

      case 'video':
        if (!block.video) return null;
        return (
          <div className="my-5 max-w-3xl mx-auto w-full">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-slate-900 flex items-center justify-center group shadow-md">
              <div className="absolute inset-0 bg-cover bg-center opacity-60 filter blur-sm" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1492538368577-8b5fd600d875?w=800')` }}></div>
              <div className="relative z-10 flex flex-col items-center text-center p-4">
                <button 
                  onClick={() => triggerToast('Simulación: Reproducción de video (' + block.video?.url + ')', 'info') }
                  className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  <Play className="h-6 w-6 fill-current ml-1" />
                </button>
                <p className="text-white text-xs font-semibold mt-3 tracking-wide bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                  Video Dinámico ({block.video.provider.toUpperCase()})
                </p>
                <p className="text-gray-300 text-[10px] mt-1 break-all max-w-md">
                  {block.video.url}
                </p>
              </div>
            </div>
          </div>
        );

      case 'table':
        if (!block.table) return null;
        const { headers, rows } = block.table;
        return (
          <div className="my-5 overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  {headers.map((hdr, idx) => (
                    <th key={idx} className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                      {hdr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr 
                    key={rIdx} 
                    className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors"
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-gray-600 dark:text-gray-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'chart':
        if (!block.chart) return null;
        const { title: chartTitle, labels, values, color, chartType } = block.chart;
        const maxVal = Math.max(...values, 1);

        return (
          <div className="my-6 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm max-w-xl mx-auto w-full">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
              {chartTitle || 'Gráfico Dinámico'}
            </h4>
            
            {chartType === 'bar' ? (
              <div className="space-y-3.5">
                {labels.map((lbl, idx) => {
                  const val = values[idx] || 0;
                  const pct = Math.round((val / maxVal) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-600 dark:text-gray-400">{lbl}</span>
                        <span className="text-gray-900 dark:text-gray-100 font-semibold">{val}</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${pct}%`, 
                            backgroundColor: color || '#3b82f6' 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Line representation
              <div className="flex items-end justify-between h-40 pt-4 px-2 border-b border-l border-gray-200 dark:border-gray-800">
                {labels.map((lbl, idx) => {
                  const val = values[idx] || 0;
                  const pct = Math.round((val / maxVal) * 80); // cap at 80% height for margin
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full flex flex-col items-center">
                        {/* Dot */}
                        <div 
                          className="h-2.5 w-2.5 rounded-full border border-white dark:border-slate-950 transition-all shadow group-hover:scale-125"
                          style={{ 
                            backgroundColor: color || '#10b981',
                            marginBottom: `${pct}px`
                          }}
                        />
                        {/* Popover */}
                        <span className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded transition-opacity pointer-events-none font-bold">
                          {val}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 truncate max-w-[50px]">
                        {lbl}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'kpi':
        if (!block.kpi) return null;
        const { label, value, change, isPositive } = block.kpi;
        return (
          <div className="my-3 p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50 mt-1">{value}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-[10px] font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {change}
                </span>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-red-50 dark:bg-red-950/40 text-red-600'}`}>
              <Percent className="h-4 w-4" />
            </div>
          </div>
        );

      case 'button':
        if (!block.button) return null;
        const btn = block.button;
        const btnStyles = 
          btn.style === 'outline' ? 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200' :
          btn.style === 'secondary' ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200' :
          btn.style === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
          'bg-blue-600 hover:bg-blue-700 text-white shadow shadow-blue-500/10';

        const sizeStyles = 
          btn.size === 'sm' ? 'px-3 py-1.5 text-xs' :
          btn.size === 'lg' ? 'px-6 py-2.5 text-sm md:text-base font-bold' :
          'px-4 py-2 text-xs md:text-sm font-semibold';

        return (
          <div className="my-4 flex justify-center">
            {btn.link.startsWith('#') ? (
              <a 
                href={btn.link}
                className={`inline-flex items-center justify-center rounded-xl cursor-pointer transition-all ${btnStyles} ${sizeStyles}`}
              >
                {btn.label}
              </a>
            ) : (
              <button 
                onClick={() => triggerToast('CMS: Redirección simulada a: ' + btn.link, 'info')}
                className={`inline-flex items-center justify-center rounded-xl cursor-pointer transition-all ${btnStyles} ${sizeStyles}`}
              >
                {btn.label}
              </button>
            )}
          </div>
        );

      case 'separator':
        if (!block.separator) return null;
        const borderStyle = block.separator.style;
        const spacingStyle = 
          block.separator.spacing === 'sm' ? 'my-4' : 
          block.separator.spacing === 'lg' ? 'my-12' : 'my-8';

        return (
          <div className={`${spacingStyle}`}>
            <hr className={`border-gray-200 dark:border-gray-800 w-full ${
              borderStyle === 'dashed' ? 'border-dashed' :
              borderStyle === 'dotted' ? 'border-dotted' : 'border-solid'
            }`} />
          </div>
        );

      case 'form':
        if (!block.form) return null;
        const isSuccess = formSubmittedId === block.id;

        return (
          <div className="my-6 max-w-lg mx-auto w-full p-6 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">{block.form.title}</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">Ingrese la información requerida de manera segura.</p>
            
            {isSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-start gap-3 text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h5 className="font-bold text-xs">¡Mensaje Enviado con Éxito!</h5>
                  <p className="text-[10px] mt-0.5 opacity-90">La solicitud fue almacenada de forma segura en la base de datos relacional del CMS.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => handleFormSubmit(e, block)} className="space-y-4">
                {block.form.fields.map((fld) => {
                  const inputId = `${block.id}_${fld.id}`;
                  const currentVal = formData[inputId] || '';

                  return (
                    <div key={fld.id} className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {fld.label} {fld.required && <span className="text-red-500">*</span>}
                      </label>
                      
                      {fld.type === 'textarea' ? (
                        <textarea
                          required={fld.required}
                          value={currentVal}
                          onChange={(e) => handleInputChange(block.id, fld.id, e.target.value)}
                          className="w-full min-h-[90px] px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : fld.type === 'select' ? (
                        <select
                          required={fld.required}
                          value={currentVal}
                          onChange={(e) => handleInputChange(block.id, fld.id, e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccione una opción...</option>
                          {fld.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : fld.type === 'checkbox' ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            checked={currentVal === 'true'}
                            onChange={(e) => handleInputChange(block.id, fld.id, e.target.checked ? 'true' : '')}
                            className="h-4 w-4 rounded border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:outline-none"
                            id={inputId}
                          />
                          <label htmlFor={inputId} className="text-xs text-gray-600 dark:text-gray-400">
                            Acepto términos y condiciones
                          </label>
                        </div>
                      ) : (
                        <input
                          type={fld.type}
                          required={fld.required}
                          value={currentVal}
                          onChange={(e) => handleInputChange(block.id, fld.id, e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  {block.form.submitLabel || 'Enviar'}
                </button>
              </form>
            )}
          </div>
        );

      case 'columns':
        if (!block.columns) return null;
        const { layout, cols } = block.columns;
        const gridClass = 
          layout === '1-1' ? 'grid-cols-1 md:grid-cols-2 gap-6' :
          layout === '1-2' ? 'grid-cols-1 md:grid-cols-3 gap-6 md:[&>div:nth-child(2)]:col-span-2' :
          layout === '2-1' ? 'grid-cols-1 md:grid-cols-3 gap-6 md:[&>div:nth-child(1)]:col-span-2' :
          'grid-cols-1 md:grid-cols-3 gap-4';

        return (
          <div className={`grid ${gridClass} my-6`}>
            {cols.map((col, idx) => (
              <div key={col.id} className="space-y-4">
                {col.blocks.map((childBlock) => (
                  <div key={childBlock.id}>
                    {renderBlock(childBlock)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (publishedPages.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <h3 className="font-bold text-gray-800 dark:text-gray-200">No hay contenido publicado</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dirígete al panel administrativo para crear y publicar tu primera página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Navegación del Portal */}
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800">
        {publishedPages.map((pg) => (
          <button
            key={pg.id}
            onClick={() => {
              setActiveSlug(pg.slug);
              setFormData({});
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeSlug === pg.slug
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent'
            }`}
          >
            {pg.title}
          </button>
        ))}
      </nav>

      {/* Cuerpo de la Página Activa */}
      <main className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-10 shadow-sm min-h-[500px]">
        {currentPage ? (
          <article className="max-w-4xl mx-auto space-y-6">
            {currentPage.blocks.map((block) => (
              <div key={block.id} id={block.id}>
                {renderBlock(block)}
              </div>
            ))}
          </article>
        ) : (
          <div className="text-center py-20 text-gray-500">
            Cargando contenido dinámico...
          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">
          <CheckCircle className="h-4 w-4 text-blue-500" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
