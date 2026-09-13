import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AlertCard({ alert, onResolve, index = 0 }) {
  const [isResolving, setIsResolving] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  const isCritical = alert.severity === 'critical';
  const isResolved = !!alert.resolved;

  const handleResolveClick = () => {
    if (isResolving || isResolved) return;
    setShowSuccessFlash(true);

    setTimeout(() => {
      setIsResolving(true);
      setTimeout(() => {
        if (onResolve) {
          onResolve(alert.id);
        }
      }, 250);
    }, 300);
  };

  return (
    <motion.div
      initial={{ x: 30, opacity: 0 }}
      animate={
        isResolving
          ? { x: -60, opacity: 0 }
          : { x: 0, opacity: 1 }
      }
      transition={{ 
        duration: isResolving ? 0.25 : 0.35, 
        delay: isResolving ? 0 : index * 0.05, 
        ease: 'easeOut' 
      }}
      className={`rounded-[12px] p-4 shadow-warm transition-all duration-200 border-none relative overflow-hidden ${
        showSuccessFlash
          ? 'bg-[#F0FFF4] ring-2 ring-[#2D6A4F]'
          : isCritical
          ? 'bg-[#FFF5F0]/70 hover:bg-[#FFF5F0]'
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            {isCritical && !isResolved ? (
              <motion.span 
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#C1440E]"
              />
            ) : (
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isResolved ? 'bg-gray-300' : 'bg-[#D4A017]'
              }`} />
            )}

            <span className="font-bold text-gray-900 text-sm">
              {alert.phcName || alert.phc_name || alert.phcId || alert.phc_id || 'PHC Alert'}
            </span>

            {alert.verified !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                alert.verified 
                  ? 'bg-[#E8F5E9] text-[#2D6A4F] border border-[#52B788]/30' 
                  : 'bg-[#FFFBEB] text-[#D4A017] border border-[#D4A017]/30'
              }`}>
                {alert.verified ? 'Verified' : 'Unverified'}
              </span>
            )}
          </div>


          <div className="text-sm text-gray-800">
            <span className="capitalize">{alert.medicine}</span>: <span className="font-bold text-gray-900">{alert.quantity != null ? `${alert.quantity} ${alert.unit || 'units'}` : 'Stock depleted'}</span>
          </div>

          {(alert.message || alert.details) && (
            <div className="text-xs text-gray-600 mt-1">
              {alert.message || alert.details}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-1 font-medium">
            {alert.timestamp?.toDate
              ? alert.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : (typeof alert.timestamp === 'string' ? alert.timestamp : 'Recent')}
            {alert.reported_by && <span> • {alert.reported_by}</span>}
            {alert.channel && <span className="uppercase text-[10px] ml-1 px-1.5 py-0.2 bg-gray-100 rounded text-gray-500">{alert.channel}</span>}
          </div>
        </div>

        {!isResolved && onResolve && (
          <button
            type="button"
            onClick={handleResolveClick}
            disabled={isResolving}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              showSuccessFlash 
                ? 'bg-[#2D6A4F] text-white' 
                : 'bg-white border border-gray-200 hover:bg-[#2D6A4F] hover:text-white text-gray-700 shadow-xs'
            }`}
          >
            {showSuccessFlash ? 'Resolved ✓' : 'Resolve'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
