import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, FileDown, Calculator, HandCoins, TrendingUp } from 'lucide-react';
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
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [markupPercentage, setMarkupPercentage] = useState<number>(0);
  const [customMarkup, setCustomMarkup] = useState<string>('');
  const [inflationRate, setInflationRate] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('budget_materials', JSON.stringify(materials));
  }, [materials]);

  const addMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMaterial: Material = {
      id: uuidv4(),
      name,
      quantity: quantity === '' ? '' : Number(quantity),
      unitPrice: unitPrice === '' ? '' : Number(unitPrice),
    };

    setMaterials([...materials, newMaterial]);
    setName('');
    setQuantity('');
    setUnitPrice('');
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
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

  const activeMaterials = materials.filter(m => typeof m.quantity === 'number' && m.quantity > 0);
  const totalMaterials = activeMaterials.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unitPrice)), 0);
  const totalWithMarkup = totalMaterials * (1 + markupPercentage / 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add wood-like color theme to PDF
    doc.setFillColor(120, 53, 15); // amber-900 equivalent
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(budgetName ? `Presupuesto: ${budgetName}` : 'Presupuesto de Proyecto', 14, 20);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 40);

    const tableData = activeMaterials.map(m => [
      m.name,
      formatCurrency(Number(m.unitPrice)),
      m.quantity.toString(),
      formatCurrency(Number(m.quantity) * Number(m.unitPrice))
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Material', 'Precio Unit.', 'Cantidad', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255] }, // amber-700
      alternateRowStyles: { fillColor: [254, 252, 232] }, // yellow-50
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Subtotal (Materiales): ${formatCurrency(totalMaterials)}`, 14, finalY + 10);
    if (markupPercentage > 0) {
      doc.text(`Margen Agregado: ${markupPercentage}%`, 14, finalY + 17);
    }
    
    doc.setFontSize(14);
    doc.setTextColor(120, 53, 15);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Estimado: ${formatCurrency(totalWithMarkup)}`, 14, finalY + (markupPercentage > 0 ? 26 : 19));

    const pdfName = budgetName ? `presupuesto-${budgetName.replace(/\s+/g, '-').toLowerCase()}.pdf` : 'presupuesto.pdf';
    doc.save(pdfName);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Input Section */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-700 dark:text-amber-500" />
          Agregar Material
        </h2>
        <form onSubmit={addMaterial} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">Cantidad</label>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Opcional"
              min="0"
              step="any"
              className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 outline-none transition-colors font-semibold placeholder:font-medium dark:placeholder:text-stone-500"
            />
          </div>
          <div className="md:col-span-4 flex justify-end mt-2">
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

      {/* Bulk Actions & List Section */}
      {materials.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-3">
            <span className="text-sm font-bold text-stone-600 dark:text-stone-400">Ajustar Precios (Inflación):</span>
            <div className="flex items-center bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900 focus-within:border-amber-400 dark:focus-within:border-amber-600 pl-3">
              <span className="text-sm font-bold text-stone-500 dark:text-stone-500">+</span>
              <input
                type="number"
                placeholder="Ej. 10"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                className="w-16 outline-none text-sm font-bold text-stone-700 dark:text-stone-100 bg-transparent py-1.5 px-1 text-center"
              />
              <span className="text-sm font-bold text-stone-500 dark:text-stone-500 pr-3">%</span>
              <button
                onClick={applyInflation}
                disabled={!inflationRate || isNaN(Number(inflationRate))}
                className="bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed text-white px-4 py-2 text-sm font-bold transition-colors flex items-center gap-2 border-l border-stone-200 dark:border-stone-800"
              >
                <TrendingUp className="w-4 h-4" />
                Aplicar
              </button>
            </div>
          </div>
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
                {materials.map((m) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
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
                onClick={() => setMarkupPercentage(50)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${markupPercentage === 50 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400 dark:ring-amber-500' : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
              >
                +50%
              </button>
              <button
                onClick={() => setMarkupPercentage(100)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${markupPercentage === 100 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400 dark:ring-amber-500' : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
              >
                +100%
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

          <div className="bg-white dark:bg-stone-950 p-5 rounded-xl border border-stone-200 dark:border-stone-800 min-w-[280px] w-full md:w-auto">
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
            <button
              onClick={generatePDF}
              disabled={activeMaterials.length === 0}
              className="mt-4 w-full bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              Exportar a PDF
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
