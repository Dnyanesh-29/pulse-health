import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import districtsSummary from '../data/districts_summary.json';

export default function StateView({ stateOverview }) {
  const [selectedStateFilter, setSelectedStateFilter] = useState('All');
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtStatusFilter, setDistrictStatusFilter] = useState('All');

  const statesData = stateOverview?.states || [];
  const topAtRisk = stateOverview?.topAtRiskDistricts || [];
  const districtList = useMemo(() => {
    return (districtsSummary && districtsSummary.length > 0)
      ? districtsSummary
      : (stateOverview?.districtComparison || []);
  }, [stateOverview?.districtComparison]);


  const filterButtons = [
    { key: 'All', label: 'All States', integrated: true },
    { key: 'MH', label: 'Maharashtra', integrated: true },
    { key: 'RJ', label: 'Rajasthan', integrated: true },
    { key: 'UP', label: 'Uttar Pradesh', integrated: false },
    { key: 'TN', label: 'Tamil Nadu', integrated: false },
    { key: 'WB', label: 'West Bengal', integrated: false },
    { key: 'MP', label: 'Madhya Pradesh', integrated: false }
  ];

  const isComingSoon = ['UP', 'TN', 'WB', 'MP'].includes(selectedStateFilter);
  const currentFilterObj = filterButtons.find(b => b.key === selectedStateFilter);

  const opdDisplay = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num === 0) return '—';
    return num.toLocaleString('en-IN');
  };

  const renderVectorOutbreak = (districtName) => {
    const name = (districtName || '').trim().toLowerCase();
    if (name === 'ahmednagar') {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/40">
          Dengue (seasonal)
        </span>
      );
    }
    if (name === 'nashik') {
      return (
        <div className="flex items-center gap-1.5 justify-end flex-wrap">
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/40">
            Dengue
          </span>
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#0284C7]/40">
            Diarrhea
          </span>
        </div>
      );
    }
    if (name === 'chandrapur') {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#E8F5E9] text-[#2D6A4F] border border-[#52B788]/40">
          Malaria
        </span>
      );
    }
    if (name === 'gadchiroli') {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#E8F5E9] text-[#2D6A4F] border border-[#52B788]/40">
          Malaria (high)
        </span>
      );
    }
    if (name === 'barmer') {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#E8F5E9] text-[#2D6A4F] border border-[#52B788]/40">
          Malaria
        </span>
      );
    }
    if (name === 'jaipur') {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/40">
          Dengue
        </span>
      );
    }

    return <span className="text-gray-400 font-medium">—</span>;
  };

  const filteredDistricts = useMemo(() => {
    return districtList
      .filter(d => {
        // State filter
        if (selectedStateFilter === 'MH' && d.state !== 'Maharashtra' && d.state !== 'MH') return false;
        if (selectedStateFilter === 'RJ' && d.state !== 'Rajasthan' && d.state !== 'RJ') return false;
        if (['UP', 'TN', 'WB', 'MP'].includes(selectedStateFilter) && d.state !== selectedStateFilter) return false;

        // Text search
        if (districtSearch.trim()) {
          const q = districtSearch.toLowerCase();
          if (!d.district.toLowerCase().includes(q) && !d.state.toLowerCase().includes(q)) {
            return false;
          }
        }

        // Status filter
        if (districtStatusFilter !== 'All') {
          const risk = parseFloat(d.stockoutRisk) || 0;
          const status = risk > 30 ? 'Critical' : risk > 10 ? 'At Risk' : risk > 0 ? 'Moderate' : 'Safe';
          if (status.toLowerCase() !== districtStatusFilter.toLowerCase() && d.status?.toLowerCase() !== districtStatusFilter.toLowerCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (parseFloat(b.stockoutRisk) || 0) - (parseFloat(a.stockoutRisk) || 0));
  }, [districtList, selectedStateFilter, districtSearch, districtStatusFilter]);


  return (
    <div className="space-y-8">
      {/* State View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200/80 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            State Overview
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            National pilot — 6 states, 31,882 PHCs tracked. Expanding to all states by Q2 2027.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Filter:</span>
          <div className="inline-flex rounded-lg bg-white shadow-warm p-1 flex-wrap gap-1">
            {filterButtons.map((btn) => {
              const isSelected = selectedStateFilter === btn.key;
              return (
                <div key={btn.key} className="relative group">
                  <button
                    onClick={() => setSelectedStateFilter(btn.key)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                      isSelected 
                        ? 'bg-[#2D6A4F] text-white shadow-xs' 
                        : btn.integrated
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                    title={!btn.integrated ? "Data integration in progress" : undefined}
                  >
                    {btn.label}
                    {!btn.integrated && (
                      <span className="text-[9px] font-semibold opacity-70">
                        (Soon)
                      </span>
                    )}
                  </button>

                  {/* Tooltip for onboarding states */}
                  {!btn.integrated && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                        Data integration in progress
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* When an onboarding state is selected, show clear Coming Soon overlay/banner */}
      {isComingSoon && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[12px] bg-[#F0F9F9] p-8 border border-[#52B788]/30 shadow-warm text-center"
        >
          <div className="max-w-md mx-auto">
            <span className="inline-block px-3 py-1 bg-[#52B788]/20 text-[#1B4332] text-xs font-bold rounded-full uppercase tracking-wider mb-3">
              Onboarding Phase 2
            </span>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              {currentFilterObj?.label} Supply Data Integration in Progress
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              e-Aushadhi and DVDMS supply pipelines for {currentFilterObj?.label} are currently connecting to the national exchange. Reporting is scheduled to go live in the next release cycle.
            </p>
            <button
              onClick={() => setSelectedStateFilter('All')}
              className="text-xs font-bold px-4 py-2 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#1B4332] transition-colors"
            >
              Back to All States
            </button>
          </div>
        </motion.div>
      )}

      {/* Summary Stats for MH + RJ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {statesData
          .filter(st => {
            if (selectedStateFilter === 'All') return true;
            if (selectedStateFilter === 'MH') return st.name === 'Maharashtra';
            if (selectedStateFilter === 'RJ') return st.name === 'Rajasthan';
            return false;
          })
          .map((st, idx) => (
            <div key={idx} className="bg-white rounded-[12px] p-8 shadow-warm border-none">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">{st.name}</h2>
                <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {st.reportingDistricts} Reporting Districts
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-[#F7F3EE]/60 p-4">
                  <div className="text-2xl font-black text-[#2D6A4F]">{st.totalPhcs}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">Total PHCs</div>
                </div>
                <div className="rounded-xl bg-[#FFFBEB] p-4">
                  <div className="text-2xl font-black text-[#D4A017]">{st.atRiskPhcs}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">At Risk</div>
                </div>
                <div className="rounded-xl bg-[#FFF5F0] p-4">
                  <div className="text-2xl font-black text-[#C1440E]">{st.criticalPhcs}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">Critical</div>
                </div>
                <div className="rounded-xl bg-[#F7F3EE]/60 p-4">
                  <div className="text-2xl font-black text-[#4A5568]">{st.avgStockDays}d</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">Avg Stock</div>
                </div>
              </div>

              <div className="text-xs font-medium text-gray-600 space-y-2 pt-4 border-t border-gray-100">
                <div className="flex justify-between">
                  <span>Warehouse Reserve Buffer:</span>
                  <span className="font-bold text-gray-900">{st.warehouseBufferPct}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Outbreak Signals (IDSP):</span>
                  <span className="font-bold text-[#C1440E]">{st.outbreakZones}</span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Third state card below MH and RJ: "National Summary" (Background #F0F9F9) */}
      <div className="bg-[#F0F9F9] rounded-[12px] p-8 shadow-warm border border-[#52B788]/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#52B788]/20 mb-6 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-[#1B4332]">National Summary</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#52B788]/20 text-[#1B4332] rounded-full">
                NHM Central Grid
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Consolidated operational footprint across primary healthcare units in India
            </p>
          </div>
          <span className="text-xs font-bold text-[#2D6A4F] bg-white/80 px-3 py-1 rounded-full shadow-xs">
            Phase 1 Pilot Deployment
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white p-5 shadow-xs">
            <div className="text-3xl font-black text-[#2D6A4F]">31,882</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">
              Total PHCs Tracked
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-xs">
            <div className="text-3xl font-black text-[#1B4332]">2 of 36</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">
              States Integrated
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-xs">
            <div className="text-3xl font-black text-[#D4A017]">4</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">
              States Onboarding
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-xs">
            <div className="text-3xl font-black text-[#4A5568]">{districtList?.length || 84}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">
              Districts Reporting
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Priority At-Risk Districts */}
      <div className="bg-white rounded-[12px] p-8 shadow-warm border-none">
        <div className="pb-6 mb-6 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Top 5 Priority At-Risk Districts
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Ranked by risk percentage and primary medicine stock deficits</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {topAtRisk.map((item) => (
            <div 
              key={item.rank} 
              className="rounded-[12px] bg-[#FFF5F0] hover:bg-[#FFEBE0] p-5 shadow-warm hover:shadow-warm-hover transition-all duration-200 border-none flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C1440E] mb-1">
                  Priority #{item.rank} • {item.state}
                </div>
                <div className="text-lg font-black text-gray-900 mb-3">
                  {item.district}
                </div>
                <div className="text-xs space-y-1.5 text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">At Risk Rate:</span>
                    <span className="font-bold text-[#C1440E]">{item.atRiskPct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Critical PHCs:</span>
                    <span className="font-bold text-gray-900">{item.criticalPhcs}</span>
                  </div>
                  <div className="text-gray-600 mt-2 pt-2 border-t border-black/5 font-medium">
                    {item.primaryDeficit}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* District Comparison Table */}
      <div className="bg-white rounded-[12px] p-8 shadow-warm border-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                District Comparison
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2D6A4F] border border-[#52B788]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
                {filteredDistricts.length} Districts (HMIS Dataset)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">District-level supply health and clinical caseload across pilot states</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              placeholder="Search 88 districts..."
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm w-48 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />

            <select
              value={districtStatusFilter}
              onChange={(e) => setDistrictStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            >
              <option value="All">All Statuses</option>
              <option value="Critical">Critical</option>
              <option value="At Risk">At Risk</option>
              <option value="Moderate">Moderate</option>
              <option value="Safe">Safe</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[600px] overflow-y-auto">
          <table className="w-full border-collapse text-left text-sm text-[#374151]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#2D6A4F] text-white shadow-sm">
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-white">#</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-white">District</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-white">State</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-white text-right">Monthly OPD</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-white text-right">Avg Stock Days</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-white text-right">Vector Outbreak</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-white text-right">Stockout Risk</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-white text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistricts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 bg-white">
                    No matching districts found for this filter
                  </td>
                </tr>
              ) : (
                filteredDistricts.map((d, i) => {
                  const risk = parseFloat(d.stockoutRisk) || 0;
                  // Status thresholds: Critical > 30, At Risk > 10, Moderate > 0, Safe == 0
                  const isCritical = risk > 30 || d.status === 'Critical';
                  const isAtRisk = !isCritical && (risk > 10 || d.status === 'At Risk');
                  const isModerate = !isCritical && !isAtRisk && (risk > 0 || d.status === 'Moderate');
                  const displayStatus = isCritical ? 'Critical' : isAtRisk ? 'At Risk' : isModerate ? 'Moderate' : 'Safe';
                  
                  const rowBg = isCritical 
                    ? 'bg-[#FFF5F0] hover:bg-[#FFEBE0]' 
                    : isAtRisk 
                    ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7]' 
                    : isModerate
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-[#F0FFF4] hover:bg-[#DCFCE7]';

                  return (
                    <tr 
                      key={d.district + i} 
                      className={`border-b border-gray-100 transition-colors duration-150 ${rowBg}`}
                    >
                      <td className="py-3 px-4 text-xs font-semibold text-gray-400">{i + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{d.district}</td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{d.state}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        {opdDisplay(d.opdAttendance)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {d.avgStockDays || d.avgDays || 18.5}d
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-semibold text-gray-700">
                        {renderVectorOutbreak(d.district)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        <span className={
                          isCritical ? 'text-[#C1440E]' : 
                          isAtRisk ? 'text-[#D4A017]' : 
                          isModerate ? 'text-[#0284C7]' : 
                          'text-[#2D6A4F]'
                        }>
                          {d.stockoutRisk}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded ${
                          isCritical ? 'text-[#C1440E] bg-white/80 border border-[#C1440E]/30 shadow-2xs' :
                          isAtRisk ? 'text-[#D4A017] bg-white/80 border border-[#D4A017]/30 shadow-2xs' :
                          isModerate ? 'text-[#0284C7] bg-[#F0F9FF] border border-[#0284C7]/30 shadow-2xs' :
                          'text-[#2D6A4F] bg-white/80 border border-[#2D6A4F]/30 shadow-2xs'
                        }`}>
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
