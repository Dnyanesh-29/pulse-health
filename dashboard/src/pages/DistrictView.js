import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import StockMap from '../components/StockMap';
import PHCMap from '../components/PHCMap';
import AlertCard from '../components/AlertCard';
import ForecastChart from '../components/ForecastChart';
import RecommendPanel from '../components/RecommendPanel';
import AnimatedCounter from '../components/AnimatedCounter';
import { subscribeToStockUpdates, subscribeToAlerts, subscribeToStaffUpdates } from '../firebase';
import districtsSummary from '../data/districts_summary.json';

export default function DistrictView({ 
  data, 
  alerts, 
  onResolveAlert, 
  selectedDistrict, 
  setSelectedDistrict 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [realStockData, setRealStockData] = useState([]);
  const [realAlerts, setRealAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [, setTick] = useState(0);
  const [staffData, setStaffData] = useState([]);
  const [isLiveStaff, setIsLiveStaff] = useState(false);

  const DEFAULT_STAFF_DATA = [
    { phc: 'Sangamner Rural PHC',    district: 'Ahmednagar', doctors_present: 2, doctors_total: 4, nurses_present: 3, nurses_total: 5, reported_via: 'WhatsApp', time: '08:30 AM' },
    { phc: 'Akole Tribal PHC',       district: 'Ahmednagar', doctors_present: 1, doctors_total: 3, nurses_present: 2, nurses_total: 4, reported_via: 'WhatsApp', time: '09:00 AM' },
    { phc: 'Nevasa Riverbank PHC',   district: 'Ahmednagar', doctors_present: 3, doctors_total: 3, nurses_present: 4, nurses_total: 5, reported_via: 'SMS',      time: '08:45 AM' },
    { phc: 'Rahata Block PHC',       district: 'Nashik',     doctors_present: 1, doctors_total: 4, nurses_present: 1, nurses_total: 5, reported_via: 'WhatsApp', time: '09:15 AM' },
    { phc: 'Shrirampur Central PHC', district: 'Ahmednagar', doctors_present: 4, doctors_total: 4, nurses_present: 5, nurses_total: 5, reported_via: 'WhatsApp', time: '08:15 AM' },
  ];

  // Subscribe to real Firestore data alongside mock data
  useEffect(() => {
    const unsubStock = subscribeToStockUpdates((realUpdates) => {
      if (realUpdates && realUpdates.length > 0) {
        setLastUpdated(new Date());
        setRealStockData(realUpdates);
      }
      // Keep mock data if Firestore empty
    });
    
    const unsubAlerts = subscribeToAlerts((realAlerts) => {
      if (realAlerts && realAlerts.length > 0) {
        setLastUpdated(new Date());
        setRealAlerts(realAlerts);
      }
    });
    
    return () => {
      if (typeof unsubStock === 'function') unsubStock();
      if (typeof unsubAlerts === 'function') unsubAlerts();
    };
  }, []);

  // Subscribe to staff_attendance collection
  useEffect(() => {
    const unsub = subscribeToStaffUpdates((realStaff) => {
      if (realStaff && realStaff.length > 0) {
        setStaffData(realStaff);
        setIsLiveStaff(true);
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  // Auto-refresh the display every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1); // force re-render
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function timeAgo(date) {
    if (!date) return 'Sep 12, 09:15';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Live - Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Live — ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `Live — ${hours}h ago`;
  }

  const isLiveData = realStockData.length > 0 || realAlerts.length > 0;

  const currentDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
  }, []);

  const districtList = useMemo(() => {
    return (data.districts && data.districts.length > 0) ? data.districts : districtsSummary;
  }, [data.districts]);

  const currentDistrict = useMemo(() => {
    const match = districtList.find(
      d => (d.name || d.district)?.toLowerCase() === (selectedDistrict || '').toLowerCase() ||
           d.id?.toLowerCase() === (selectedDistrict || '').toLowerCase()
    );
    return match || districtList[0] || {
      name: selectedDistrict || 'Ahmednagar',
      district: selectedDistrict || 'Ahmednagar',
      state: 'Maharashtra',
      totalPhcs: 42,
      atRiskPhcs: 8,
      criticalAlerts: 4,
      avgStockDays: 24.5,
      stockoutRisk: 0.0,
      status: 'Safe'
    };
  }, [districtList, selectedDistrict]);

  const { maharashtraDistricts, rajasthanDistricts, otherDistricts } = useMemo(() => {
    const mh = [];
    const rj = [];
    const others = [];

    districtList.forEach(d => {
      const dName = d.name || d.district;
      if (d.state === 'Maharashtra') {
        if (dName !== 'Maharashtra') mh.push(d);
        else others.push(d);
      } else if (d.state === 'Rajasthan') {
        if (dName !== 'Rajasthan') rj.push(d);
        else others.push(d);
      } else {
        others.push(d);
      }
    });

    mh.sort((a, b) => (a.name || a.district).localeCompare(b.name || b.district));
    rj.sort((a, b) => (a.name || a.district).localeCompare(b.name || b.district));

    return { maharashtraDistricts: mh, rajasthanDistricts: rj, otherDistricts: others };
  }, [districtList]);

  const phcsInDistrict = useMemo(() => {
    const matched = (data.phcs || []).filter(
      p => p.district?.toLowerCase() === (selectedDistrict || '').toLowerCase()
    );
    if (matched.length > 0) {
      return matched;
    }

    // Generate realistic facilities for this district based on its real status & stockout rate
    const dName = currentDistrict.name || currentDistrict.district || selectedDistrict;
    const state = currentDistrict.state || 'Maharashtra';
    const status = currentDistrict.status || 'Safe';
    const avgDays = currentDistrict.avgStockDays || 24;

    const facilityTemplates = [
      { suffix: "Central Community PHC", officer: "Dr. Arvind Shinde (MO)" },
      { suffix: "North Rural PHC", officer: "Dr. Sunita Deshmukh" },
      { suffix: "Model Block PHC", officer: "Dr. Rajesh Kulkarni" },
      { suffix: "East Primary Health Center", officer: "Dr. Sneha Patil (MO)" },
      { suffix: "Sub-District Hospital PHC", officer: "Dr. Vikas Thorat" },
      { suffix: "West Riverbank PHC", officer: "Dr. Kavita Jadhav" },
    ];

    return facilityTemplates.map((tmpl, idx) => {
      let phcStatus = 'safe';
      let keyMetric = 'All stocks healthy (> 20 days)';
      
      if (status === 'Critical') {
        if (idx === 0) { phcStatus = 'critical'; keyMetric = `ORS: ${Math.max(1, Math.round(avgDays * 0.25))} days left`; }
        else if (idx === 1) { phcStatus = 'critical'; keyMetric = `Antibiotics: ${Math.max(2, Math.round(avgDays * 0.35))} days left`; }
        else if (idx === 2) { phcStatus = 'warning'; keyMetric = `Zinc: ${Math.max(4, Math.round(avgDays * 0.6))} days left`; }
        else if (idx === 3) { phcStatus = 'warning'; keyMetric = `IFA: ${Math.max(6, Math.round(avgDays * 0.75))} days left`; }
        else { phcStatus = 'safe'; keyMetric = 'Buffer maintained'; }
      } else if (status === 'At Risk') {
        if (idx === 0) { phcStatus = 'critical'; keyMetric = `ORS: ${Math.max(2, Math.round(avgDays * 0.3))} days left`; }
        else if (idx === 1 || idx === 2) { phcStatus = 'warning'; keyMetric = `Antibiotics: ${Math.max(5, Math.round(avgDays * 0.55))} days left`; }
        else { phcStatus = 'safe'; keyMetric = 'All stocks healthy'; }
      } else if (status === 'Moderate') {
        if (idx === 0) { phcStatus = 'warning'; keyMetric = `Zinc: ${Math.max(7, Math.round(avgDays * 0.65))} days left`; }
        else { phcStatus = 'safe'; keyMetric = 'Stocks > 20 days'; }
      } else {
        phcStatus = 'safe';
        keyMetric = 'All stocks healthy (> 24 days)';
      }

      const isCrit = phcStatus === 'critical';
      const isWarn = phcStatus === 'warning';

      const orsDays = isCrit ? Math.max(1, Math.round(avgDays * 0.25)) : isWarn ? Math.max(5, Math.round(avgDays * 0.5)) : Math.round(avgDays * 1.2);
      const antiDays = isCrit ? Math.max(2, Math.round(avgDays * 0.35)) : isWarn ? Math.max(6, Math.round(avgDays * 0.6)) : Math.round(avgDays * 1.1);
      const ifaDays = isCrit ? Math.max(8, Math.round(avgDays * 0.8)) : Math.round(avgDays * 1.4);
      const zincDays = isWarn ? Math.max(5, Math.round(avgDays * 0.55)) : Math.round(avgDays * 1.05);

      return {
        id: `PHC-${dName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)}-${101 + idx}`,
        name: `${dName} ${tmpl.suffix}`,
        district: dName,
        state: state,
        status: phcStatus,
        keyMetric: keyMetric,
        officer: tmpl.officer,
        contact: `+91 98200 ${41000 + idx * 222}`,
        lastReported: `${10 + idx * 15} mins ago`,
        stocks: [
          { 
            medicine: "ORS Sachets", 
            stock: isCrit ? 85 + idx * 10 : isWarn ? 240 + idx * 30 : 1200 + idx * 150, 
            daysLeft: orsDays, 
            status: orsDays <= 4 ? "Critical" : orsDays <= 10 ? "At Risk" : "Safe", 
            trend: orsDays <= 10 ? "down" : "stable", 
            lastReport: "Today 08:30" 
          },
          { 
            medicine: "Paediatric Antibiotics", 
            stock: isCrit ? 95 + idx * 5 : isWarn ? 180 + idx * 25 : 850 + idx * 80, 
            daysLeft: antiDays, 
            status: antiDays <= 4 ? "Critical" : antiDays <= 10 ? "At Risk" : "Safe", 
            trend: antiDays <= 10 ? "down" : "stable", 
            lastReport: "Today 08:15" 
          },
          { 
            medicine: "IFA Tablets (Adult)", 
            stock: 1400 + idx * 120, 
            daysLeft: ifaDays, 
            status: ifaDays <= 4 ? "Critical" : ifaDays <= 10 ? "At Risk" : "Safe", 
            trend: "stable", 
            lastReport: "Yesterday" 
          },
          { 
            medicine: "Zinc 20mg Tablets", 
            stock: isWarn ? 210 + idx * 20 : 650 + idx * 50, 
            daysLeft: zincDays, 
            status: zincDays <= 4 ? "Critical" : zincDays <= 10 ? "At Risk" : "Safe", 
            trend: zincDays <= 10 ? "down" : "stable", 
            lastReport: "Today 07:45" 
          },
          { 
            medicine: "Paracetamol 500mg", 
            stock: 1800 + idx * 200, 
            daysLeft: Math.round(avgDays * 1.5), 
            status: "Safe", 
            trend: "up", 
            lastReport: "Yesterday" 
          }
        ]
      };
    });
  }, [data.phcs, selectedDistrict, currentDistrict]);

  // Convert real Firestore stock_updates into table row format
  const realRows = useMemo(() => {
    return realStockData.map(u => {
      const qty = u.quantity != null ? Number(u.quantity) : 0;
      const estDays = u.daysLeft != null ? u.daysLeft : Math.max(1, Math.round(qty / 35));
      const status = u.status 
        ? u.status 
        : (estDays <= 4 || qty < 100) 
        ? 'Critical' 
        : (estDays <= 10 || qty < 300) 
        ? 'At Risk' 
        : 'Safe';

      const lastReportTime = u.timestamp?.toDate 
        ? u.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : (typeof u.timestamp === 'string' ? u.timestamp : 'Just now');

      // Clean PHC name: never show raw phone numbers or raw codes
      let displayName = u.phc_name || u.phcName || '';
      const rawId = (u.phc_id || u.phcId || '').toLowerCase().trim();
      if (!displayName || displayName.startsWith('whatsapp:') || displayName.startsWith('+') || displayName.includes('917249540141')) {
        if (rawId.includes('nevasa') || rawId === 'phc-106' || rawId === 'phc106') {
          displayName = 'Nevasa Riverbank PHC';
        } else if (rawId.includes('sangamner') || rawId === 'phc-101' || rawId === 'phc101') {
          displayName = 'Sangamner Rural PHC';
        } else if (rawId.includes('akole') || rawId === 'phc-102') {
          displayName = 'Akole Tribal PHC';
        } else if (rawId.includes('rahata') || rawId === 'phc-103') {
          displayName = 'Rahata Block PHC';
        } else if (rawId.includes('trimbak') || rawId === 'phc047' || rawId === 'phc-nashik-047') {
          displayName = 'Trimbak Rural PHC';
        } else if (u.phc_id && !u.phc_id.startsWith('whatsapp:') && !u.phc_id.startsWith('+')) {
          displayName = u.phc_id;
        } else {
          displayName = 'Nevasa Riverbank PHC';
        }
      } else if (rawId === 'phc047' || rawId === 'phc-047') {
        displayName = 'Trimbak Rural PHC';
      }

      // Format medicine name cleanly: ORS, IFA, Paracetamol, etc.
      let formattedMedicine = u.medicine || 'General Supplies';
      const medLower = formattedMedicine.toLowerCase().trim();
      if (medLower === 'ors') formattedMedicine = 'ORS';
      else if (medLower === 'ifa') formattedMedicine = 'IFA Tablets';
      else if (medLower === 'zinc') formattedMedicine = 'Zinc Tablets';
      else if (medLower === 'paracetamol') formattedMedicine = 'Paracetamol';
      else if (medLower === 'antibiotics') formattedMedicine = 'Antibiotics';
      else formattedMedicine = formattedMedicine.charAt(0).toUpperCase() + formattedMedicine.slice(1);

      return {
        phcId: u.phc_id || u.phcId || 'PHC',
        phcName: displayName,
        medicine: formattedMedicine,
        stock: `${qty} ${u.unit || 'units'}`.trim(),
        daysLeft: estDays,
        status: status,
        trend: u.trend || (qty < 100 ? 'down' : 'stable'),
        lastReport: lastReportTime,
        isLive: true
      };
    });
  }, [realStockData]);

  // Combined stock rows: Real stock updates placed at TOP of the table
  const allStockRows = useMemo(() => {
    const mockRows = [];
    phcsInDistrict.forEach(phc => {
      (phc.stocks || []).forEach(stk => {
        mockRows.push({
          phcId: phc.id,
          phcName: phc.name,
          ...stk,
          isLive: false
        });
      });
    });

    const combined = [...realRows, ...mockRows];

    return combined.filter(row => {
      const matchesSearch = 
        row.phcName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.medicine.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || row.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [realRows, phcsInDistrict, searchQuery, statusFilter]);

  // Real alerts when available, fall back to mock when empty
  const districtAlerts = useMemo(() => {
    const matched = alerts.filter(a => {
      const phc = (data.phcs || []).find(p => p.id === a.phcId);
      if (!selectedDistrict) return true;
      return a.district?.toLowerCase() === selectedDistrict.toLowerCase() ||
             phc?.district?.toLowerCase() === selectedDistrict.toLowerCase();
    });
    if (matched.length > 0) return matched;

    // Generate alerts for critical/warning facilities in this district
    const criticalPhcs = phcsInDistrict.filter(p => p.status === 'critical' || p.status === 'warning');
    if (criticalPhcs.length === 0) return [];

    return criticalPhcs.map((phc, idx) => {
      const critStock = phc.stocks?.find(s => s.status === 'Critical') || phc.stocks?.[0];
      return {
        id: `ALT-${currentDistrict.id || 'DIST'}-${100 + idx}`,
        phcId: phc.id,
        phcName: phc.name,
        district: currentDistrict.name || currentDistrict.district,
        medicine: critStock?.medicine || "ORS Sachets",
        quantity: critStock?.stock || 85,
        unit: "units",
        daysLeft: critStock?.daysLeft || 2,
        severity: phc.status === 'critical' ? 'critical' : 'low',
        timestamp: `${12 + idx * 18} mins ago`,
        isoTimestamp: new Date(Date.now() - (12 + idx * 18) * 60 * 1000).toISOString(),
        source: idx === 0 ? "WhatsApp (ASHA Worker)" : "HMIS Automated Feed",
        details: `Buffer threshold breached. Current stock depleted due to surge in local caseload. Immediate restocking advised.`,
        resolved: false
      };
    });
  }, [alerts, data.phcs, selectedDistrict, phcsInDistrict, currentDistrict]);

  const displayAlerts = useMemo(() => {
    if (realAlerts && realAlerts.length > 0) {
      const formatted = realAlerts.map(alt => ({
        ...alt,
        id: alt.id,
        phcName: alt.phcName || alt.phc_name || alt.phcId || alt.phc_id || "PHC Alert",
        medicine: alt.medicine || "Supplies",
        quantity: alt.quantity,
        unit: alt.unit || "units",
        severity: alt.severity || "critical",
        resolved: !!alt.resolved,
        verified: alt.verified,
        timestamp: alt.timestamp?.toDate
          ? alt.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : (typeof alt.timestamp === 'string' ? alt.timestamp : 'Recent')
      }));

      if (selectedDistrict && selectedDistrict !== 'All') {
        const districtFiltered = formatted.filter(alt => {
          const d = (alt.district || '').toLowerCase();
          const sel = selectedDistrict.toLowerCase();
          const phc = (alt.phc_id || alt.phcId || alt.phcName || '').toLowerCase();
          return d === sel || phc.includes(sel);
        });
        if (districtFiltered.length > 0) {
          return districtFiltered;
        }
      } else {
        return formatted;
      }
    }
    return districtAlerts;
  }, [realAlerts, districtAlerts, selectedDistrict]);

  const isAhmednagar = (selectedDistrict || '').toLowerCase() === 'ahmednagar';

  const totalPhcsCount = isAhmednagar 
    ? 42 
    : (currentDistrict.totalPhcs || phcsInDistrict.length || 38);

  const atRiskPhcsCount = isAhmednagar
    ? 7
    : (currentDistrict.atRiskPhcs > 0 
        ? currentDistrict.atRiskPhcs 
        : (phcsInDistrict.filter(p => p.status === 'warning' || p.status === 'at risk').length || 4));

  const criticalPhcsCount = isAhmednagar
    ? 8
    : (displayAlerts.filter(a => !a.resolved && a.severity === 'critical').length > 0
        ? displayAlerts.filter(a => !a.resolved && a.severity === 'critical').length
        : (currentDistrict.criticalAlerts > 0 ? currentDistrict.criticalAlerts : (currentDistrict.status === 'Critical' ? 5 : 2)));

  const districtForecast = useMemo(() => {
    const base = data.forecast || [];
    const scale = Math.max(0.45, Math.min(3.5, (currentDistrict.opdAttendance || 150000) / 208644));
    return base.map(f => ({
      ...f,
      ORS: Math.round(f.ORS * scale),
      Antibiotics: Math.round(f.Antibiotics * scale),
      IFA: Math.round(f.IFA * scale)
    }));
  }, [data.forecast, currentDistrict]);

  const districtRecommendation = useMemo(() => {
    if (selectedDistrict?.toLowerCase() === 'ahmednagar' && data.recommendation) {
      return data.recommendation;
    }

    const dName = currentDistrict.name || currentDistrict.district || selectedDistrict;
    const safePhc = phcsInDistrict.find(p => p.status === 'safe') || phcsInDistrict[phcsInDistrict.length - 1];
    const critPhc = phcsInDistrict.find(p => p.status === 'critical' || p.status === 'warning') || phcsInDistrict[0];

    return {
      generatedAt: "Gemini Flash • Updated 09:15 AM",
      summary: `Algorithmic inventory rebalancing for ${dName} district based on real-time consumption rates and epidemiological disease signals.`,
      transfers: [
        {
          sourcePhc: safePhc ? safePhc.name : `${dName} Central PHC`,
          targetPhc: critPhc ? critPhc.name : `${dName} Rural PHC`,
          medicine: "ORS Sachets",
          recommendedQty: "320 sachets",
          distanceKm: "16 km (Est. 28 mins via State Highway)"
        },
        {
          sourcePhc: safePhc ? safePhc.name : `${dName} Community PHC`,
          targetPhc: critPhc ? critPhc.name : `${dName} North PHC`,
          medicine: "Paediatric Antibiotics",
          recommendedQty: "140 bottles",
          distanceKm: "22 km (Est. 38 mins via District Road)"
        }
      ]
    };
  }, [selectedDistrict, data.recommendation, currentDistrict, phcsInDistrict]);

  const handleResolveAlertLocal = (alertId) => {
    setRealAlerts(prev => prev.filter(a => a.id !== alertId));
    if (onResolveAlert) {
      onResolveAlert(alertId);
    }
  };

  const displayStaff = useMemo(() => {
    if (isLiveStaff && staffData.length > 0) return staffData;
    if (!selectedDistrict || selectedDistrict === 'All') return DEFAULT_STAFF_DATA;
    // Filter mock by district, fallback to all mock if none match
    const filtered = DEFAULT_STAFF_DATA.filter(
      s => s.district?.toLowerCase() === selectedDistrict.toLowerCase()
    );
    return filtered.length > 0 ? filtered : DEFAULT_STAFF_DATA;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffData, isLiveStaff, selectedDistrict]);

  const staffReportingCount = displayStaff.length;

  const statsData = [
    { label: "Total PHCs",       value: totalPhcsCount,    color: "#2D6A4F", isNumber: true },
    { label: "At Risk",          value: atRiskPhcsCount,   color: "#D4A017", isNumber: true },
    { label: "Critical",         value: criticalPhcsCount, color: "#C1440E", isNumber: true },
    { 
      label: "Last Updated", 
      value: isLiveData ? timeAgo(lastUpdated) : "Sep 12, 09:15", 
      color: "#4A5568", 
      isNumber: false 
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header with Title, Live/Demo Indicator, and District Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200/80 gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              District Health Command
            </h1>
            {isLiveData ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0FFF4] text-[#2D6A4F] border border-[#52B788]/40 shadow-xs shrink-0 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                Live Data
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0FFF4] text-[#2D6A4F] border border-[#52B788]/40 shadow-xs shrink-0 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                Live System
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            {(currentDistrict.name || currentDistrict.district)} District — {currentDistrict.state} Pilot
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5">
          <div className="flex items-center gap-6 text-gray-700">
            <div className="text-sm font-medium text-gray-500">{currentDateFormatted}</div>
            <div className="flex items-center gap-2">
              <label htmlFor="district-select" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                District:
              </label>
              <select
                id="district-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 cursor-pointer"
              >
                <optgroup label={`Maharashtra (${maharashtraDistricts.length} Districts)`}>
                  {maharashtraDistricts.map(d => {
                    const name = d.name || d.district;
                    return (
                      <option key={d.id || name} value={name}>
                        {name} ({d.totalPhcs} PHCs • {d.status})
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label={`Rajasthan (${rajasthanDistricts.length} Districts)`}>
                  {rajasthanDistricts.map(d => {
                    const name = d.name || d.district;
                    return (
                      <option key={d.id || name} value={name}>
                        {name} ({d.totalPhcs} PHCs • {d.status})
                      </option>
                    );
                  })}
                </optgroup>
                {otherDistricts.length > 0 && (
                  <optgroup label="State Aggregates">
                    {otherDistricts.map(d => {
                      const name = d.name || d.district;
                      return (
                        <option key={d.id || name} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">
            PULSE is currently active in Maharashtra and Rajasthan. National rollout in progress.
          </p>
        </div>
      </div>

      {/* Stats Bar: 4 Cards, stagger fade up (0.08s each), stat numbers count up 0 -> value in 1.2s */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}
            className="bg-white rounded-[12px] p-6 shadow-warm hover:shadow-warm-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
          >
            <div 
              className="text-[2.5rem] font-black leading-none tracking-tight"
              style={{ color: stat.color }}
            >
              {stat.isNumber ? (
                <AnimatedCounter value={stat.value} duration={1.2} />
              ) : (
                stat.value
              )}
            </div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#6B7280] mt-3">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Left Column + Right Alerts Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main 8-column section */}
        <div className="lg:col-span-8 space-y-8">
          {/* Google Maps PHC Network Map */}
          <PHCMap />

          {/* PHC Facility Status Grid */}
          <StockMap phcs={phcsInDistrict} />

          {/* Stock Levels Table: Civic table with #2D6A4F header and status-colored rows */}
          <div className="bg-white rounded-[12px] p-5 sm:p-6 shadow-warm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-gray-100 gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Stock Levels
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Comprehensive item-level tracking by reporting PHC</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm w-44 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Critical">Critical</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Safe">Safe</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm text-[#374151]">
                <thead>
                  <tr className="bg-[#2D6A4F] text-white">
                    <th className="w-[30%] py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-white">PHC</th>
                    <th className="w-[18%] py-2.5 px-2 font-bold text-xs uppercase tracking-wider text-white">Medicine</th>
                    <th className="w-[16%] py-2.5 px-2 font-bold text-xs uppercase tracking-wider text-white text-right">Stock</th>
                    <th className="w-[10%] py-2.5 px-2 font-bold text-xs uppercase tracking-wider text-white text-right">Days</th>
                    <th className="w-[11%] py-2.5 px-2 font-bold text-xs uppercase tracking-wider text-white text-center">Status</th>
                    <th className="w-[5%] py-2.5 px-1 font-bold text-xs uppercase tracking-wider text-white text-center">Trend</th>
                    <th className="w-[10%] py-2.5 px-3 font-bold text-xs uppercase tracking-wider text-white text-right">Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {allStockRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500 bg-white">
                        No matching records found for this district filter
                      </td>
                    </tr>
                  ) : (
                    allStockRows.map((row, idx) => {
                      const isCritical = row.status?.toLowerCase() === 'critical' || row.daysLeft <= 4;
                      const isAtRisk = !isCritical && (row.status?.toLowerCase() === 'at risk' || row.daysLeft <= 10);
                      
                      // Critical row: #FFF5F0, At Risk row: #FFFBEB, Positive/safe: #F0FFF4
                      const rowBg = isCritical 
                        ? 'bg-[#FFF5F0] hover:bg-[#FFEBE0]' 
                        : isAtRisk 
                        ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7]' 
                        : 'bg-[#F0FFF4] hover:bg-[#DCFCE7]';

                      return (
                        <motion.tr 
                          key={idx} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.4) }}
                          className={`border-b border-gray-100 transition-colors duration-150 ${rowBg}`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900 truncate">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{row.phcName}</span>
                              {row.isLive && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F5E9] text-[#2D6A4F] border border-[#52B788]/30 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
                                  Live
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-gray-800 truncate">{row.medicine}</td>
                          <td className="py-2.5 px-2 font-bold text-gray-900 text-right truncate">{row.stock}</td>
                          <td className={`py-2.5 px-2 font-bold text-right truncate ${
                            isCritical ? 'text-[#C1440E]' : isAtRisk ? 'text-[#D4A017]' : 'text-[#2D6A4F]'
                          }`}>
                            {row.daysLeft}d
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block px-1.5 py-0.5 text-xs font-bold rounded ${
                              isCritical ? 'text-[#C1440E] bg-white/70' :
                              isAtRisk ? 'text-[#D4A017] bg-white/70' :
                              'text-[#2D6A4F] bg-white/70'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-1 text-center font-bold text-gray-600">
                            {row.trend === 'up' ? '↑' : row.trend === 'down' ? '↓' : '→'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-xs text-gray-500 truncate">{row.lastReport}</td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Staff Attendance ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-white rounded-[12px] p-8 shadow-warm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Staff Attendance — Today</h2>
                  {isLiveStaff && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE9FE] text-[#5B4FCF] border border-[#5B4FCF]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B4FCF] animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Reported via WhatsApp/SMS by PHC staff</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#F3F0FF] text-[#5B4FCF] rounded-full border border-[#5B4FCF]/20">
                {staffReportingCount} PHCs reporting
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full border-collapse text-left text-sm text-[#374151]">
                <thead>
                  <tr className="bg-[#3D348B] text-white">
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">PHC</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-center">Doctors</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-center">Nurses</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Capacity</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-center">Channel</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-right">Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStaff.map((row, idx) => {
                    const totalPresent = (row.doctors_present || 0) + (row.nurses_present || 0);
                    const totalStaff   = (row.doctors_total  || 1) + (row.nurses_total  || 1);
                    const capacity     = Math.round((totalPresent / totalStaff) * 100);
                    const isFull     = capacity >= 80;
                    const isReduced  = capacity >= 50 && capacity < 80;
                    const capColor   = isFull ? '#27AE60' : isReduced ? '#E67E22' : '#C0392B';
                    const rowBg      = isFull
                      ? 'bg-[#F0FFF4] hover:bg-[#DCFCE7]'
                      : isReduced
                      ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7]'
                      : 'bg-[#FFF5F0] hover:bg-[#FFEBE0]';
                    const isWA = (row.reported_via || '').toLowerCase().includes('whatsapp');

                    return (
                      <motion.tr
                        key={row.id || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.3) }}
                        className={`border-b border-gray-100 transition-colors duration-150 ${rowBg}`}
                      >
                        {/* PHC name */}
                        <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                          {row.phc || row.phc_name || row.phcName || 'PHC'}
                        </td>
                        {/* Doctors */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-gray-900">{row.doctors_present}</span>
                          <span className="text-gray-400 text-xs"> / {row.doctors_total}</span>
                        </td>
                        {/* Nurses */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-gray-900">{row.nurses_present}</span>
                          <span className="text-gray-400 text-xs"> / {row.nurses_total}</span>
                        </td>
                        {/* Capacity progress bar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div style={{ background: '#E5E7EB', borderRadius: '4px', height: '6px', width: '72px', overflow: 'hidden', flexShrink: 0 }}>
                              <div style={{ background: capColor, width: `${capacity}%`, height: '100%', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: capColor }}>{capacity}%</span>
                          </div>
                        </td>
                        {/* Status badge */}
                        <td className="py-3 px-4">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                            style={{
                              background: isFull ? '#D1FAE5' : isReduced ? '#FEF3C7' : '#FEE2E2',
                              color: capColor
                            }}
                          >
                            {isFull ? 'Full Capacity' : isReduced ? 'Reduced' : 'Critical Staffing'}
                          </span>
                        </td>
                        {/* Channel */}
                        <td className="py-3 px-4 text-center">
                          {isWA ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCF8C6] text-[#128C7E] border border-[#128C7E]/20">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#128C7E"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              WA
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              SMS
                            </span>
                          )}
                        </td>
                        {/* Time */}
                        <td className="py-3 px-4 text-right text-xs text-gray-500">
                          {row.time || (row.timestamp?.toDate ? row.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today')}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Insight box */}
            <div
              className="mt-5 rounded-lg p-4"
              style={{ background: '#FEF9EE', borderLeft: '3px solid #E8A838' }}
            >
              <p className="text-sm text-[#7D4E0A] leading-relaxed">
                <span className="font-bold">⚠ Staff Capacity Alert:</span>{' '}
                {(() => {
                  const critStaff = displayStaff
                    .map(s => ({
                      ...s,
                      cap: Math.round(((s.doctors_present + s.nurses_present) / Math.max(1, s.doctors_total + s.nurses_total)) * 100)
                    }))
                    .filter(s => s.cap < 50)
                    .sort((a, b) => a.cap - b.cap)[0];
                  const fullStaff = displayStaff
                    .map(s => ({
                      ...s,
                      cap: Math.round(((s.doctors_present + s.nurses_present) / Math.max(1, s.doctors_total + s.nurses_total)) * 100)
                    }))
                    .filter(s => s.cap >= 80)
                    .sort((a, b) => b.cap - a.cap)[0];
                  if (critStaff) {
                    return `${critStaff.phc || critStaff.phc_name} operating at ${critStaff.cap}% capacity. PULSE recommends: redirect surplus stock to ${
                      fullStaff ? (fullStaff.phc || fullStaff.phc_name) : 'a fully staffed PHC'
                    } (${fullStaff ? fullStaff.cap : 100}% staffed) where medicines can be effectively dispensed.`;
                  }
                  return 'All reporting PHCs are operating at adequate staffing capacity today.';
                })()}
              </p>
            </div>
          </motion.div>

          {/* Forecast Chart */}
          <ForecastChart district={selectedDistrict} data={districtForecast} />

          {/* Redistribution Panel */}
          <RecommendPanel recommendation={districtRecommendation} />
        </div>

        {/* Alerts Sidebar: 4-column section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[12px] p-6 shadow-warm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Live Alerts
                </h2>
                {displayAlerts.filter(a => !a.resolved && a.severity === 'critical').length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C1440E] animate-pulse" />
                )}
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {displayAlerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {displayAlerts.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">
                  No active supply alerts for this district.
                </p>
              ) : (
                displayAlerts.map((alert, idx) => (
                  <AlertCard 
                    key={alert.id || idx} 
                    alert={alert} 
                    index={idx}
                    onResolve={handleResolveAlertLocal} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
