import React from 'react';

export default function RecommendPanel({ recommendation }) {
  if (!recommendation) return null;

  return (
    <div className="bg-white rounded-[12px] p-8 shadow-warm mb-8 border-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Redistribution Recommendations
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-generated transfer orders based on stock levels and outbreak signals
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 bg-[#52B788]/15 text-[#1B4332] border border-[#52B788]/30 rounded-full shrink-0 self-start sm:self-auto">
          {recommendation.generatedAt?.includes('Gemini 1.5 Flash') 
            ? "Gemini Flash • Updated 09:15 AM" 
            : (recommendation.generatedAt || "Gemini Flash • Updated 09:15 AM")}
        </span>
      </div>

      <p className="text-gray-700 leading-relaxed mb-6 font-medium text-sm">
        {recommendation.summary}
      </p>

      <div className="space-y-4">
        {recommendation.transfers?.map((transfer, idx) => (
          <div 
            key={idx}
            className="p-5 rounded-xl border border-gray-200 bg-[#F7F3EE]/40 hover:bg-[#F7F3EE]/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="font-bold text-gray-900 mb-1 text-sm">
                {transfer.sourcePhc} <span className="text-[#2D6A4F] mx-1 font-extrabold">→</span> {transfer.targetPhc}
              </div>
              <div className="text-sm text-gray-700 font-medium">
                {transfer.medicine} • Quantity: <span className="font-extrabold text-gray-900">{transfer.recommendedQty}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 font-medium">
                Route Distance: {transfer.distanceKm}
              </div>
            </div>

            <button 
              onClick={() => alert(`Transfer order generated: ${transfer.medicine} (${transfer.recommendedQty}) from ${transfer.sourcePhc} to ${transfer.targetPhc}.`)}
              className="text-xs font-bold px-4 py-2.5 bg-[#2D6A4F] text-white hover:bg-[#1B4332] rounded-lg shadow-sm transition-all hover:shadow hover:-translate-y-0.5 shrink-0"
            >
              Issue Transfer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
