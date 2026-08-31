import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, FileDown, Calculator, TrendingUp, Search, RotateCcw, X, FileText, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Material } from '../types';

interface BudgetCalculatorProps {
  budgetName: string;
}

export default function BudgetCalculator({ budgetName }: BudgetCalculatorProps) {
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('budget_materials');
    return saved ? JSON.parse(saved) : [];
  });
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState<number>(0);
  const [customMarkup, setCustomMarkup] = useState<string>('');
  const [inflationRate, setInflationRate] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem('budget_materials', JSON.stringify(materials));
  }, [materials]);

  const addMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMaterial: Material = {
      id: uuidv4(),
      name: name.trim(),
      quantity: 0,
      unitPrice: unitPrice === '' ? '' : Number(unitPrice),
    };

    setMaterials([...materials, newMaterial]);
    setName('');
    setUnitPrice('');
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleConfirmReset = () => {
    setMaterials(materials.map(m => ({ ...m, quantity: 0 })));
    setShowResetConfirm(false);
  };

  const applyInflation = () => {
    const rate = parseFloat(inflationRate);
    if (isNaN(rate) || rate <= 0) return;
    setMaterials(materials.map(m => {
      if (typeof m.unitPrice === 'number' && m.unitPrice > 0) {
        const newPrice = m.unitPrice * (1 + rate / 100);
        return { ...m, unitPrice: Number(newPrice.toFixed(2)) };
      }
      return m;
    }));
    setInflationRate('');
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const activeMaterials = materials.filter(m => typeof m.quantity === 'number' && m.quantity > 0);
  const totalMaterials = activeMaterials.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unitPrice)), 0);
  const totalWithMarkup = totalMaterials * (1 + markupPercentage / 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const clientName = budgetName.trim();
    
    // Header Banner
    doc.setFillColor(120, 53, 15); // amber-900
    doc.rect(0, 0, 210, 28, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 14, 18);
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Cliente:`, 14, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName ? clientName : 'No especificado', 32, 38);

    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha:`, 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('es-AR'), 32, 45);

    let startTableY = 54;

    if (jobDescription.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.text('Trabajo a realizar:', 14, startTableY);
      doc.setFont('helvetica', 'normal');
      const splitJob = doc.splitTextToSize(jobDescription.trim(), 180);
      doc.text(splitJob, 14, startTableY + 6);
      startTableY += 8 + (splitJob.length * 5.5);
    }

    // Material list (only materials used and quantities, WITHOUT individual prices)
    const tableData = activeMaterials.map((m, index) => [
      (index + 1).toString(),
      m.name,
      m.quantity.toString()
    ]);

    autoTable(doc, {
      startY: startTableY,
      head: [['#', 'Material', 'Cantidad']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [180, 83, 9], 
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30, halign: 'center' }
      },
      alternateRowStyles: { fillColor: [254, 252, 232] }, // yellow-50
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || startTableY;
    
    // Total price box
    doc.setFillColor(245, 245, 244);
    doc.roundedRect(14, finalY + 10, 182, 22, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(120, 53, 15);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${formatCurrency(totalWithMarkup)}`, 20, finalY + 24);

    // Save with the format: "presupuesto [nombre del cliente].pdf"
    const pdfFileName = clientName ? `presupuesto ${clientName}.pdf` : 'presupuesto.pdf';
    doc.save(pdfFileName);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Input Section - Agregar Material (without cantidad input) */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-700 dark:text-amber-500" />
          Agregar Material
        </h2>
        <form onSubmit={addMaterial} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">Nombre del material</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Tablas de pino 1x4"
              className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 outline-none transition-colors font-semibold placeholder:font-medium dark:placeholder:text-stone-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">Precio Unitario</label>
            <input 
              type="number" 
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Opcional"
              min="0"
              step="any"
              className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 outline-none transition-colors font-semibold placeholder:font-medium dark:placeholder:text-stone-500"
            />
          </div>
          <div className="md:col-span-3 flex justify-end mt-1">
            <button 
              type="submit"
              className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-colors w-full md:w-auto justify-center shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Materials List, Search & Actions Section */}
      {materials.length > 0 && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search, Reset & Inflation */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              {/* Search Input with Lupa */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
                  <Search className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar en lista de materiales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm font-semibold outline-none focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Reset to 0 Button */}
              <button
                type="button"
                onClick={() => {
                  if (materials.length > 0) {
                    setShowResetConfirm(true);
                  }
                }}
                disabled={materials.length === 0}
                title="Poner en 0 la cantidad de todos los materiales"
                className="bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                <span>Cantidades a 0</span>
              </button>

            </div>

            {/* Inflation Adjustment Sub-row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/80 text-xs sm:text-sm">
              <div className="text-stone-500 dark:text-stone-400 font-medium">
                {searchTerm ? (
                  <span>Mostrando <b className="text-stone-800 dark:text-stone-200">{filteredMaterials.length}</b> de {materials.length} materiales</span>
                ) : (
                  <span>Total de materiales: <b className="text-stone-800 dark:text-stone-200">{materials.length}</b></span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap">Ajuste inflación:</span>
                <div className="flex items-center bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-300 dark:border-stone-700 overflow-hidden focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900 focus-within:border-amber-400 pl-2.5">
                  <span className="text-xs font-bold text-stone-400">+</span>
                  <input
                    type="number"
                    placeholder="10"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(e.target.value)}
                    className="w-12 outline-none text-xs font-bold text-stone-700 dark:text-stone-100 bg-transparent py-1 px-1 text-center"
                  />
                  <span className="text-xs font-bold text-stone-400 pr-2">%</span>
                  <button
                    onClick={applyInflation}
                    disabled={!inflationRate || isNaN(Number(inflationRate))}
                    className="bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 disabled:cursor-not-allowed text-white px-2.5 py-1 text-xs font-bold transition-colors flex items-center gap-1 border-l border-stone-300 dark:border-stone-700"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs sm:text-sm">
                    <th className="p-2 sm:p-4 font-bold">Material</th>
                    <th className="p-2 sm:p-4 font-bold text-right">Precio Unit.</th>
                    <th className="p-2 sm:p-4 font-bold text-right">Cant.</th>
                    <th className="p-2 sm:p-4 font-bold text-right hidden sm:table-cell">Total</th>
                    <th className="p-2 sm:p-4 font-bold text-center w-10 sm:w-16">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-stone-500 dark:text-stone-400 font-medium">
                        No se encontraron materiales que coincidan con &quot;{searchTerm}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((m) => (
                      <tr key={m.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/20 transition-colors text-sm">
                        <td className="p-2 sm:p-4">
                          <div className="text-stone-800 dark:text-stone-100 font-semibold">{m.name}</div>
                          <div className="text-amber-700 dark:text-amber-500 text-xs sm:hidden mt-1 font-bold">
                            Total: {formatCurrency((Number(m.quantity) || 0) * (Number(m.unitPrice) || 0))}
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={m.unitPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMaterials(materials.map(mat => mat.id === m.id ? { ...mat, unitPrice: val === '' ? '' : Number(val) } : mat));
                            }}
                            placeholder="0"
                            className="w-20 sm:w-28 px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 outline-none text-right font-bold transition-colors bg-white dark:bg-stone-950 shadow-sm"
                          />
                        </td>
                        <td className="p-2 sm:p-4 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={m.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMaterials(materials.map(mat => mat.id === m.id ? { ...mat, quantity: val === '' ? '' : Number(val) } : mat));
                            }}
                            placeholder="0"
                            className="w-16 sm:w-24 px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 outline-none text-right font-bold transition-colors bg-white dark:bg-stone-950 shadow-sm"
                          />
                        </td>
                        <td className="p-2 sm:p-4 text-stone-800 dark:text-stone-100 font-bold text-right hidden sm:table-cell">
                          {formatCurrency((Number(m.quantity) || 0) * (Number(m.unitPrice) || 0))}
                        </td>
                        <td className="p-2 sm:p-4 text-center">
                          <button 
                            onClick={() => removeMaterial(m.id)}
                            className="text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary & PDF Export Section */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {/* Markup options */}
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-sm font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">Margen de Ganancia</h3>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setMarkupPercentage(0)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${markupPercentage === 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400 dark:ring-amber-500' : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
              >
                0% (Solo Material)
              </button>
              <button
                onClick={() => setMarkupPercentage(150)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${markupPercentage === 150 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400 dark:ring-amber-500' : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
              >
                +150%
              </button>
              <button
                onClick={() => setMarkupPercentage(200)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${markupPercentage === 200 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400 dark:ring-amber-500' : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
              >
                +200%
              </button>
              <div className="flex items-center gap-2 bg-white dark:bg-stone-950 rounded-full border border-stone-200 dark:border-stone-800 overflow-hidden px-3 py-1 focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900 focus-within:border-amber-400 dark:focus-within:border-amber-600">
                <span className="text-sm font-bold text-stone-500 dark:text-stone-500">+</span>
                <input
                  type="number"
                  placeholder="Otro"
                  value={customMarkup}
                  onChange={(e) => {
                    setCustomMarkup(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) setMarkupPercentage(val);
                  }}
                  className="w-16 outline-none text-sm font-bold text-stone-700 dark:text-stone-100 bg-transparent py-1"
                />
                <span className="text-sm font-bold text-stone-500 dark:text-stone-500">%</span>
              </div>
            </div>
          </div>

          {/* Pricing Summary & PDF Actions */}
          <div className="bg-white dark:bg-stone-950 p-5 rounded-xl border border-stone-200 dark:border-stone-800 min-w-[280px] w-full md:w-auto space-y-4">
            <div>
              <div className="flex justify-between items-center text-sm font-semibold text-stone-500 dark:text-stone-400 mb-2">
                <span>Subtotal Materiales:</span>
                <span>{formatCurrency(totalMaterials)}</span>
              </div>
              {markupPercentage > 0 && (
                <div className="flex justify-between items-center text-sm font-semibold text-amber-700 dark:text-amber-500 mb-2">
                  <span>Margen (+{markupPercentage}%):</span>
                  <span>{formatCurrency(totalMaterials * (markupPercentage / 100))}</span>
                </div>
              )}
              <div className="border-t border-stone-100 dark:border-stone-800 my-3 pt-3 flex justify-between items-end">
                <span className="text-stone-800 dark:text-stone-100 font-bold">Total:</span>
                <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-500">{formatCurrency(totalWithMarkup)}</span>
              </div>
            </div>

            {/* Trabajo a realizar (Job description input) */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500" />
                Descripción del trabajo:
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Ej. Colocación de puerta, reparación de muebles..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm font-medium outline-none focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 resize-none transition-colors"
              />
            </div>

            {/* Export button */}
            <button
              onClick={generatePDF}
              disabled={activeMaterials.length === 0}
              className="w-full bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              Exportar a PDF
            </button>
          </div>

        </div>
      </div>

      {/* Non-blocking Reset Confirmation Modal */}
      {showResetConfirm && (
        <div 
          role="dialog" 
          aria-modal="true" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
        >
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-500">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                Poner cantidades a 0
              </h3>
            </div>
            
            <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
              ¿Estás seguro de que deseas restablecer las cantidades de todos los materiales a 0? Los precios y nombres se conservarán.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white transition-colors shadow-sm"
              >
                Poner en 0
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

