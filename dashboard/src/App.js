import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { INITIAL_MOCK_DATA, subscribeToAlerts, resolveAlertInDb } from './firebase';
import DistrictView from './pages/DistrictView';
import StateView from './pages/StateView';
import AlertsFeed from './pages/AlertsFeed';

function AnimatedRoutes({ data, alerts, onResolveAlert, selectedDistrict, setSelectedDistrict }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <DistrictView
                data={data}
                alerts={alerts}
                onResolveAlert={onResolveAlert}
                selectedDistrict={selectedDistrict}
                setSelectedDistrict={setSelectedDistrict}
              />
            </motion.div>
          }
        />
        <Route
          path="/district"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/state"
          element={
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <StateView stateOverview={data.stateOverview} />
            </motion.div>
          }
        />
        <Route
          path="/alerts"
          element={
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <AlertsFeed
                alerts={alerts}
                onResolveAlert={onResolveAlert}
              />
            </motion.div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [data] = useState(INITIAL_MOCK_DATA);
  const [alerts, setAlerts] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState('Ahmednagar');

  useEffect(() => {
    document.title = "PULSE — National PHC Supply Intelligence | NHM India";
    const unsub = subscribeToAlerts((alerts) => {
      setAlerts(alerts);
      setAlertCount(alerts.length);
    });
    return () => unsub();
  }, []);

  const handleResolveAlert = async (alertId) => {
    setAlerts((prevAlerts) => {
      const updated = prevAlerts.map((alt) =>
        alt.id === alertId ? { ...alt, resolved: true } : alt
      );
      setAlertCount(updated.filter(a => !a.resolved).length);
      return updated;
    });
    await resolveAlertInDb(alertId);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F7F3EE] text-[#374151] flex flex-col font-sans">
        {/* Header: Deep Forest Green (#1B4332), slides down on page load, high z-index over maps */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-[#1B4332] text-white shadow-md z-[9999] sticky top-0"
        >
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo and Title */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#082317] to-[#1B4332] border border-[#52B788]/40 shadow-sm flex items-center justify-center shrink-0 p-1.5 ring-1 ring-white/10 group-hover:border-[#52B788] transition-all">
                  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                    <defs>
                      <linearGradient id="headerPulseLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#52B788" />
                        <stop offset="60%" stopColor="#00F5A0" />
                        <stop offset="100%" stopColor="#52B788" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 8 33 L 19 33 L 26 17 L 35 49 L 43 21 L 49 37 L 53 33 L 56 33"
                      stroke="url(#headerPulseLine)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="43" cy="21" r="3" fill="#FFFFFF" />
                  </svg>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-2xl tracking-tight text-white leading-none">
                      PULSE
                    </span>
                    <span className="text-white/40">|</span>
                    <span className="text-sm font-medium text-white/90 hidden sm:inline leading-none">
                      Primary Unit Level Supply & Emergency Intelligence
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-[#52B788]/20 text-[#52B788] border border-[#52B788]/35 rounded-full">
                      ● National Pilot — 6 States
                    </span>
                  </div>
                </div>
              </Link>

              {/* Nav Tabs */}
              <nav className="flex items-center gap-2 h-full">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `text-sm font-semibold px-4 h-full flex items-center transition-all duration-200 border-b-[3px] ${
                      isActive
                        ? 'border-[#52B788] text-white bg-white/5'
                        : 'border-transparent text-white/80 hover:text-white hover:bg-[#52B788]/15'
                    }`
                  }
                >
                  District View
                </NavLink>

                <NavLink
                  to="/state"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-4 h-full flex items-center transition-all duration-200 border-b-[3px] ${
                      isActive
                        ? 'border-[#52B788] text-white bg-white/5'
                        : 'border-transparent text-white/80 hover:text-white hover:bg-[#52B788]/15'
                    }`
                  }
                >
                  State Overview
                </NavLink>

                <NavLink
                  to="/alerts"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-4 h-full flex items-center transition-all duration-200 border-b-[3px] ${
                      isActive
                        ? 'border-[#52B788] text-white bg-white/5'
                        : 'border-transparent text-white/80 hover:text-white hover:bg-[#52B788]/15'
                    }`
                  }
                >
                  <span className="flex items-center gap-2">
                    Alerts
                    {alertCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-bold bg-[#C1440E] text-white rounded-full">
                        {alertCount}
                      </span>
                    )}
                  </span>
                </NavLink>
              </nav>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-8">
          <AnimatedRoutes
            data={data}
            alerts={alerts}
            onResolveAlert={handleResolveAlert}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
          />
        </main>
      </div>
    </Router>
  );
}
