import React, { useState, useMemo } from 'react';
import AlertCard from '../components/AlertCard';

export default function AlertsFeed({ alerts, onResolveAlert }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (activeTab === 'Critical' && (alert.severity !== 'critical' || alert.resolved)) return false;
      if (activeTab === 'Low' && (alert.severity !== 'low' || alert.resolved)) return false;
      if (activeTab === 'Resolved' && !alert.resolved) return false;

      if (selectedDistrict !== 'All') {
        const phcName = (alert.phcName || alert.phc_name || alert.phcId || alert.phc_id || '').toLowerCase();
        const alertDist = (alert.district || '').toLowerCase();
        const targetDist = selectedDistrict.toLowerCase();
        if (!phcName.includes(targetDist) && alertDist !== targetDist) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const phc = (alert.phcName || alert.phc_name || alert.phcId || alert.phc_id || '').toLowerCase();
        const med = (alert.medicine || '').toLowerCase();
        return phc.includes(q) || med.includes(q);
      }

      return true;
    });
  }, [alerts, activeTab, searchQuery, selectedDistrict]);

  const counts = useMemo(() => {
    return {
      all: alerts.length,
      critical: alerts.filter(a => !a.resolved && a.severity === 'critical').length,
      low: alerts.filter(a => !a.resolved && a.severity === 'low').length,
      resolved: alerts.filter(a => a.resolved).length
    };
  }, [alerts]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200/80 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Supply Alerts Feed
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            National pilot supply triggers & emergency redistribution notifications across 6 states
          </p>
        </div>

        {/* National 6-state District Filter & Search */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          >
            <option value="All">All Districts (6 States)</option>
            <optgroup label="Maharashtra">
              <option value="Ahmednagar">Ahmednagar (MH)</option>
              <option value="Pune">Pune (MH)</option>
              <option value="Nashik">Nashik (MH)</option>
            </optgroup>
            <optgroup label="Rajasthan">
              <option value="Jaipur">Jaipur (RJ)</option>
              <option value="Jodhpur">Jodhpur (RJ)</option>
              <option value="Udaipur">Udaipur (RJ)</option>
            </optgroup>
            <optgroup label="Uttar Pradesh">
              <option value="Lucknow">Lucknow (UP)</option>
              <option value="Kanpur">Kanpur (UP)</option>
            </optgroup>
            <optgroup label="Tamil Nadu">
              <option value="Chennai">Chennai (TN)</option>
              <option value="Coimbatore">Coimbatore (TN)</option>
            </optgroup>
            <optgroup label="West Bengal">
              <option value="Kolkata">Kolkata (WB)</option>
              <option value="Murshidabad">Murshidabad (WB)</option>
            </optgroup>
            <optgroup label="Madhya Pradesh">
              <option value="Bhopal">Bhopal (MP)</option>
              <option value="Indore">Indore (MP)</option>
            </optgroup>
          </select>

          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm w-64 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
        </div>
      </div>

      {/* Tabs and Alert List */}
      <div className="bg-white rounded-[12px] p-8 shadow-warm border-none">
        <div className="flex items-center gap-2 pb-6 mb-6 border-b border-gray-100 flex-wrap">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'All' 
                ? 'bg-[#2D6A4F] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All Alerts ({counts.all})
          </button>

          <button
            onClick={() => setActiveTab('Critical')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Critical' 
                ? 'bg-[#C1440E] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Critical ({counts.critical})
          </button>

          <button
            onClick={() => setActiveTab('Low')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Low' 
                ? 'bg-[#D4A017] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Low Stock ({counts.low})
          </button>

          <button
            onClick={() => setActiveTab('Resolved')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Resolved' 
                ? 'bg-[#4A5568] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Resolved ({counts.resolved})
          </button>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            {selectedDistrict !== 'All' 
              ? `No active alerts currently flagged for ${selectedDistrict} district.`
              : 'No alerts found matching the selected filter.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert, idx) => (
              <AlertCard
                key={alert.id || idx}
                alert={alert}
                index={idx}
                onResolve={onResolveAlert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
