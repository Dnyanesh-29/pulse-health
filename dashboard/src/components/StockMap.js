import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StockMap({ phcs }) {
  const [selectedPhc, setSelectedPhc] = useState(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPhc(null);
      }
    };
    if (selectedPhc) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhc]);

  const getCardBgColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'critical':
        return '#FFF5F0';
      case 'warning':
      case 'at risk':
        return '#FFFBEB';
      case 'safe':
        return '#F6FEF9';
      default:
        return '#FFFFFF';
    }
  };

  const getDotColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'critical':
        return '#C1440E';
      case 'warning':
      case 'at risk':
        return '#D4A017';
      case 'safe':
      default:
        return '#2D6A4F';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'critical':
        return 'Critical';
      case 'warning':
      case 'at risk':
        return 'At Risk';
      case 'safe':
      default:
        return 'Safe';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'critical':
        return 'text-[#C1440E]';
      case 'warning':
      case 'at risk':
        return 'text-[#D4A017]';
      case 'safe':
      default:
        return 'text-[#2D6A4F]';
    }
  };

  return (
    <div className="bg-white rounded-[12px] p-8 shadow-warm mb-8 border-none">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            PHC Facilities
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Click any health center to view full inventory</p>
        </div>

        <div className="flex items-center gap-5 text-xs font-semibold text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]"></span>
            <span>Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017]"></span>
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span 
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-2.5 h-2.5 rounded-full bg-[#C1440E]"
            />
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Grid of Uniform Cards with Stagger Fade In */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {phcs.map((phc, idx) => {
          const isCritical = phc.status?.toLowerCase() === 'critical';
          const cardBgColor = getCardBgColor(phc.status);
          const dotColor = getDotColor(phc.status);

          return (
            <motion.div
              key={phc.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04, ease: "easeOut" }}
              whileHover={{ y: -3 }}
              onClick={() => setSelectedPhc(phc)}
              style={{ backgroundColor: cardBgColor }}
              className="cursor-pointer rounded-[12px] p-5 shadow-warm hover:shadow-warm-hover transition-all duration-200 flex flex-col justify-between border-none"
            >
              <div>
                <div className="flex items-start gap-2.5 mb-2.5">
                  {isCritical ? (
                    <motion.span
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: dotColor }}
                    />
                  ) : (
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" 
                      style={{ backgroundColor: dotColor }} 
                    />
                  )}
                  <div className="font-bold text-gray-900 text-sm leading-snug">
                    {phc.name}
                  </div>
                </div>

                <div className="text-sm text-gray-600 pl-5 font-medium">
                  {phc.keyMetric}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs text-gray-400">
                <span className="font-medium text-gray-400">Click for details</span>
                <span className={`font-bold ${getStatusTextColor(phc.status)}`}>
                  {getStatusText(phc.status)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Window / Modal on Same Page */}
      <AnimatePresence>
        {selectedPhc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setSelectedPhc(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-[12px] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 text-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <span 
                    className="w-3.5 h-3.5 rounded-full shrink-0 mt-1" 
                    style={{ backgroundColor: getDotColor(selectedPhc.status) }} 
                  />
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                      {selectedPhc.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {selectedPhc.district}{selectedPhc.state ? `, ${selectedPhc.state}` : ''}
                      {selectedPhc.lastReported ? ` • Reported ${selectedPhc.lastReported}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPhc(null)}
                  className="text-gray-400 hover:text-gray-900 p-1 text-xl leading-none transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Key Metric & Officer Meta */}
              <div className="py-4 border-b border-gray-100 bg-[#F7F3EE]/60 -mx-6 px-6 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">Primary Alert</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedPhc.keyMetric}</p>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded ${
                  selectedPhc.status === 'critical' ? 'text-[#C1440E] bg-[#FFF5F0]' :
                  selectedPhc.status === 'warning' || selectedPhc.status === 'at risk' ? 'text-[#D4A017] bg-[#FFFBEB]' :
                  'text-[#2D6A4F] bg-[#F0FFF4]'
                }`}>
                  {getStatusText(selectedPhc.status)}
                </span>
              </div>

              {selectedPhc.officer && (
                <div className="py-3 border-b border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                  <span>Medical Officer: <strong className="text-gray-900">{selectedPhc.officer}</strong></span>
                  {selectedPhc.contact && (
                    <span>Contact: <strong className="text-gray-900">{selectedPhc.contact}</strong></span>
                  )}
                </div>
              )}

              {/* Inventory Section */}
              <div className="pt-4">
                <div className="font-extrabold text-sm text-gray-900 mb-3">
                  Supply Inventory & Days Remaining
                </div>

                {selectedPhc.stocks && selectedPhc.stocks.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#2D6A4F] text-white text-xs">
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Medicine</th>
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right">Stock</th>
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right">Days Left</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPhc.stocks.map((stk, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-b-0 hover:bg-[#F7F3EE]/50 transition-colors">
                            <td className="py-2.5 px-3 text-gray-900 font-medium">{stk.medicine}</td>
                            <td className="py-2.5 px-3 font-bold text-gray-900 text-right">{stk.stock}</td>
                            <td className={`py-2.5 px-3 text-right font-bold ${
                              stk.daysLeft <= 4 ? 'text-[#C1440E]' :
                              stk.daysLeft <= 10 ? 'text-[#D4A017]' :
                              'text-[#2D6A4F]'
                            }`}>
                              {stk.daysLeft}d
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 py-3">No inventory data available for this facility.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPhc(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
