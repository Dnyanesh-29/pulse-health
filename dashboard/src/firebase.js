import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  serverTimestamp,
  limit
} from "firebase/firestore";
import districtsSummary from "./data/districts_summary.json";


// Helper to clean environment variable strings (handles accidental quotes, spaces, or trailing commas)
const cleanVal = (val) => (val ? String(val).trim().replace(/,$/, "") : "");

// Firebase configuration with environment variables and project defaults
const firebaseConfig = {
  apiKey: cleanVal(
    process.env.REACT_APP_FIREBASE_API_KEY ||
    process.env.REACT_APP_API_KEY ||
    process.env.REACT_APP_apiKey
  ) || "AIzaSyCR49yjfGvXazZ5LmB17lV-UkHdDUPh4W8",
  authDomain: cleanVal(
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    process.env.REACT_APP_AUTH_DOMAIN ||
    process.env.REACT_APP_authDomain
  ) || "stable-hydra-507904-h7.firebaseapp.com",
  projectId: cleanVal(
    process.env.REACT_APP_FIREBASE_PROJECT_ID ||
    process.env.REACT_APP_PROJECT_ID ||
    process.env.REACT_APP_projectId
  ) || "stable-hydra-507904-h7",
  storageBucket: cleanVal(
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    process.env.REACT_APP_STORAGE_BUCKET ||
    process.env.REACT_APP_storageBucket
  ) || "stable-hydra-507904-h7.firebasestorage.app",
  messagingSenderId: cleanVal(
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.REACT_APP_MESSAGING_SENDER_ID ||
    process.env.REACT_APP_messagingSenderId
  ) || "489503624817",
  appId: cleanVal(
    process.env.REACT_APP_FIREBASE_APP_ID ||
    process.env.REACT_APP_APP_ID ||
    process.env.REACT_APP_appId
  ) || "1:489503624817:web:f650e815917b92214a15d0",
  measurementId: cleanVal(
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID ||
    process.env.REACT_APP_MEASUREMENT_ID ||
    process.env.REACT_APP_measurementId
  ) || "G-5F30J237PF"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);


// Comprehensive realistic mock data for District & State views
export const INITIAL_MOCK_DATA = {
  districts: districtsSummary,
  phcs: [
    {
      id: "PHC-101",
      name: "Sangamner Rural PHC",
      district: "Ahmednagar",
      state: "Maharashtra",
      status: "critical", // critical, warning, safe
      keyMetric: "ORS: 2 days left",
      officer: "Dr. Arvind Shinde (MO)",
      contact: "+91 98231 44521",
      lastReported: "14 mins ago",
      stocks: [
        { medicine: "ORS Sachets", stock: 85, daysLeft: 2, status: "Critical", trend: "down", lastReport: "Today 08:30" },
        { medicine: "Paediatric Antibiotics", stock: 120, daysLeft: 4, status: "Critical", trend: "down", lastReport: "Today 08:30" },
        { medicine: "IFA Tablets (Adult)", stock: 850, daysLeft: 19, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "Zinc 20mg Tablets", stock: 190, daysLeft: 5, status: "At Risk", trend: "down", lastReport: "Today 08:30" },
        { medicine: "Paracetamol 500mg", stock: 1200, daysLeft: 24, status: "Safe", trend: "up", lastReport: "Yesterday" }
      ]
    },
    {
      id: "PHC-102",
      name: "Akole Tribal PHC",
      district: "Ahmednagar",
      state: "Maharashtra",
      status: "critical",
      keyMetric: "Antibiotics: 3 days left",
      officer: "Dr. Sneha Patil (MO)",
      contact: "+91 94220 88291",
      lastReported: "28 mins ago",
      stocks: [
        { medicine: "Paediatric Antibiotics", stock: 95, daysLeft: 3, status: "Critical", trend: "down", lastReport: "Today 07:45" },
        { medicine: "ORS Sachets", stock: 210, daysLeft: 5, status: "At Risk", trend: "down", lastReport: "Today 07:45" },
        { medicine: "IFA Tablets (Adult)", stock: 1400, daysLeft: 32, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "Zinc 20mg Tablets", stock: 320, daysLeft: 8, status: "At Risk", trend: "stable", lastReport: "Today 07:45" },
        { medicine: "Paracetamol 500mg", stock: 450, daysLeft: 7, status: "At Risk", trend: "down", lastReport: "Today 07:45" }
      ]
    },
    {
      id: "PHC-103",
      name: "Rahata Block PHC",
      district: "Ahmednagar",
      state: "Maharashtra",
      status: "warning",
      keyMetric: "Zinc: 6 days left",
      officer: "Dr. Nilesh Gaikwad",
      contact: "+91 97654 11029",
      lastReported: "1 hour ago",
      stocks: [
        { medicine: "Zinc 20mg Tablets", stock: 240, daysLeft: 6, status: "At Risk", trend: "down", lastReport: "Today 06:15" },
        { medicine: "ORS Sachets", stock: 480, daysLeft: 11, status: "At Risk", trend: "stable", lastReport: "Today 06:15" },
        { medicine: "Paediatric Antibiotics", stock: 410, daysLeft: 14, status: "Safe", trend: "stable", lastReport: "Today 06:15" },
        { medicine: "IFA Tablets (Adult)", stock: 920, daysLeft: 22, status: "Safe", trend: "up", lastReport: "Yesterday" },
        { medicine: "Paracetamol 500mg", stock: 1800, daysLeft: 35, status: "Safe", trend: "stable", lastReport: "Yesterday" }
      ]
    },
    {
      id: "PHC-104",
      name: "Kopargaon Community PHC",
      district: "Ahmednagar",
      state: "Maharashtra",
      status: "warning",
      keyMetric: "ORS: 7 days left",
      officer: "Dr. Meena Deshmukh",
      contact: "+91 99210 55431",
      lastReported: "42 mins ago",
      stocks: [
        { medicine: "ORS Sachets", stock: 340, daysLeft: 7, status: "At Risk", trend: "down", lastReport: "Today 08:10" },
        { medicine: "Paediatric Antibiotics", stock: 390, daysLeft: 12, status: "At Risk", trend: "stable", lastReport: "Today 08:10" },
        { medicine: "IFA Tablets (Adult)", stock: 1150, daysLeft: 26, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "Zinc 20mg Tablets", stock: 510, daysLeft: 16, status: "Safe", trend: "stable", lastReport: "Today 08:10" },
        { medicine: "Paracetamol 500mg", stock: 2100, daysLeft: 40, status: "Safe", trend: "up", lastReport: "Yesterday" }
      ]
    },
    {
      id: "PHC-105",
      name: "Shrirampur Central PHC",
      district: "Ahmednagar",
      state: "Maharashtra",
      status: "safe",
      keyMetric: "All stocks > 25 days",
      officer: "Dr. Rajesh Kulkarni",
      contact: "+91 98812 33490",
      lastReported: "2 hours ago",
      stocks: [
        { medicine: "ORS Sachets", stock: 1850, daysLeft: 38, status: "Safe", trend: "up", lastReport: "Today 05:00" },
        { medicine: "Paediatric Antibiotics", stock: 890, daysLeft: 28, status: "Safe", trend: "stable", lastReport: "Today 05:00" },
        { medicine: "IFA Tablets (Adult)", stock: 2400, daysLeft: 52, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "Zinc 20mg Tablets", stock: 950, daysLeft: 31, status: "Safe", trend: "stable", lastReport: "Today 05:00" },
        { medicine: "Paracetamol 500mg", stock: 3200, daysLeft: 60, status: "Safe", trend: "up", lastReport: "Yesterday" }
      ]
    },
    {
      id: "PHC-106",
      name: "Nevasa Riverbank PHC",
      district: "Ahmednagar",
      state: "Maharashtra",
      status: "critical",
      keyMetric: "ORS: 1 day left (Diarrhea Surge)",
      officer: "Dr. Kavita Jadhav",
      contact: "+91 94032 66710",
      lastReported: "8 mins ago",
      stocks: [
        { medicine: "ORS Sachets", stock: 45, daysLeft: 1, status: "Critical", trend: "down", lastReport: "Today 09:12" },
        { medicine: "Paediatric Antibiotics", stock: 80, daysLeft: 3, status: "Critical", trend: "down", lastReport: "Today 09:12" },
        { medicine: "Zinc 20mg Tablets", stock: 110, daysLeft: 3, status: "Critical", trend: "down", lastReport: "Today 09:12" },
        { medicine: "IFA Tablets (Adult)", stock: 890, daysLeft: 20, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "Paracetamol 500mg", stock: 320, daysLeft: 6, status: "At Risk", trend: "down", lastReport: "Today 09:12" }
      ]
    },
    {
      id: "PHC-107",
      name: "Parner Hill PHC",
      district: "Ahmednagar",
      state: "Maharashtra",
      status: "safe",
      keyMetric: "All stocks healthy",
      officer: "Dr. Vikas Thorat",
      contact: "+91 97633 44102",
      lastReported: "3 hours ago",
      stocks: [
        { medicine: "ORS Sachets", stock: 1420, daysLeft: 32, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "Paediatric Antibiotics", stock: 740, daysLeft: 24, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "IFA Tablets (Adult)", stock: 1650, daysLeft: 42, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "Zinc 20mg Tablets", stock: 820, daysLeft: 28, status: "Safe", trend: "stable", lastReport: "Yesterday" },
        { medicine: "Paracetamol 500mg", stock: 2400, daysLeft: 45, status: "Safe", trend: "stable", lastReport: "Yesterday" }
      ]
    },
    {
      id: "PHC-108",
      name: "Shevgaon Border PHC",
      district: "Ahmednagar",
      state: "Maharashtra",
      status: "warning",
      keyMetric: "IFA: 8 days left",
      officer: "Dr. Sunita Bagul",
      contact: "+91 98901 88319",
      lastReported: "55 mins ago",
      stocks: [
        { medicine: "IFA Tablets (Adult)", stock: 310, daysLeft: 8, status: "At Risk", trend: "down", lastReport: "Today 07:20" },
        { medicine: "ORS Sachets", stock: 610, daysLeft: 14, status: "Safe", trend: "stable", lastReport: "Today 07:20" },
        { medicine: "Paediatric Antibiotics", stock: 360, daysLeft: 11, status: "At Risk", trend: "down", lastReport: "Today 07:20" },
        { medicine: "Zinc 20mg Tablets", stock: 450, daysLeft: 15, status: "Safe", trend: "stable", lastReport: "Today 07:20" },
        { medicine: "Paracetamol 500mg", stock: 1100, daysLeft: 21, status: "Safe", trend: "stable", lastReport: "Today 07:20" }
      ]
    }
  ],
  alerts: [
    {
      id: "ALT-2026-091",
      phcId: "PHC-106",
      phcName: "Nevasa Riverbank PHC",
      district: "Ahmednagar",
      medicine: "ORS Sachets",
      quantity: 45,
      unit: "sachets",
      daysLeft: 1,
      severity: "critical", // 'critical' | 'low'
      timestamp: "8 mins ago",
      isoTimestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      source: "WhatsApp (ASHA Sangeeta Bai)",
      details: "Diarrhea outbreak reported in 3 downstream hamlets. Rapid stock exhaustion. Critical replenishment required.",
      resolved: false
    },
    {
      id: "ALT-2026-090",
      phcId: "PHC-101",
      phcName: "Sangamner Rural PHC",
      district: "Ahmednagar",
      medicine: "Paediatric Antibiotics",
      quantity: 120,
      unit: "bottles",
      daysLeft: 4,
      severity: "critical",
      timestamp: "24 mins ago",
      isoTimestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      source: "Twilio SMS (Pharmacist)",
      details: "High pediatric respiratory infections following unseasonal rain. Buffer inventory breached.",
      resolved: false
    },
    {
      id: "ALT-2026-089",
      phcId: "PHC-102",
      phcName: "Akole Tribal PHC",
      district: "Ahmednagar",
      medicine: "ORS Sachets",
      quantity: 210,
      unit: "sachets",
      daysLeft: 5,
      severity: "low",
      timestamp: "45 mins ago",
      isoTimestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      source: "Web Entry (MO)",
      details: "Stock dropped below 7-day reserve threshold. Daily consumption rate increased by 2.4x.",
      resolved: false
    },
    {
      id: "ALT-2026-088",
      phcId: "PHC-103",
      phcName: "Rahata Block PHC",
      district: "Ahmednagar",
      medicine: "Zinc 20mg Tablets",
      quantity: 240,
      unit: "strips",
      daysLeft: 6,
      severity: "low",
      timestamp: "1 hour ago",
      isoTimestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      source: "WhatsApp (+91 97654...)",
      details: "Zinc tablet stockout predicted within 6 days due to dual diarrhea treatment protocol adherence.",
      resolved: false
    },
    {
      id: "ALT-2026-085",
      phcId: "PHC-104",
      phcName: "Kopargaon Community PHC",
      district: "Ahmednagar",
      medicine: "ORS Sachets",
      quantity: 340,
      unit: "sachets",
      daysLeft: 7,
      severity: "low",
      timestamp: "3 hours ago",
      isoTimestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      source: "HMIS Sync",
      details: "Approaching buffer re-order point of 400 sachets.",
      resolved: true
    },
    {
      id: "ALT-2026-081",
      phcId: "PHC-105",
      phcName: "Shrirampur Central PHC",
      district: "Ahmednagar",
      medicine: "Paracetamol 500mg",
      quantity: 1100,
      unit: "tablets",
      daysLeft: 12,
      severity: "low",
      timestamp: "Yesterday",
      isoTimestamp: new Date(Date.now() - 86400 * 1000).toISOString(),
      source: "Twilio SMS",
      details: "Batch inspection completed. Safe buffer restored via warehouse drop.",
      resolved: true
    }
  ],
  forecast: [
    { month: "Current (Sep)", ORS: 4200, Antibiotics: 2100, IFA: 6800, notes: "Baseline seasonal consumption" },
    { month: "Month +1 (Oct)", ORS: 6850, Antibiotics: 3400, IFA: 7100, notes: "Post-monsoon diarrhea & viral wave surge" },
    { month: "Month +2 (Nov)", ORS: 5400, Antibiotics: 3850, IFA: 7400, notes: "Pediatric respiratory illness uptick" },
    { month: "Month +3 (Dec)", ORS: 3600, Antibiotics: 3200, IFA: 7300, notes: "Winter stabilization period" }
  ],
  recommendation: {
    title: "AI Redistribution Recommendations",
    generatedAt: "Gemini Flash • Updated 09:15 AM",
    summary: "Immediate multi-facility rebalancing identified 2 surplus clusters able to avert stockouts at Nevasa and Sangamner PHCs within 4 hours without compromising local buffer safety.",
    transfers: [
      {
        sourcePhc: "Shrirampur Central PHC",
        sourceStock: "1,850 sachets (38 days)",
        targetPhc: "Nevasa Riverbank PHC",
        targetStock: "45 sachets (1 day)",
        medicine: "ORS Sachets",
        recommendedQty: "750 sachets",
        distanceKm: "28 km via SH-60",
        urgency: "Immediate Dispatch"
      },
      {
        sourcePhc: "Parner Hill PHC",
        sourceStock: "740 bottles (24 days)",
        targetPhc: "Sangamner Rural PHC",
        targetStock: "120 bottles (4 days)",
        medicine: "Paediatric Antibiotics",
        recommendedQty: "250 bottles",
        distanceKm: "41 km via NH-61",
        urgency: "Priority Transfer"
      }
    ],
    projectedImpact: "Averts stockout for 4,200 rural households; maintains district-wide minimum buffer above 14 days."
  },
  stateOverview: {
    states: [
      {
        name: "Maharashtra",
        totalDistricts: 36,
        reportingDistricts: 36,
        totalPhcs: 1839,
        atRiskPhcs: 218,
        criticalPhcs: 64,
        avgStockDays: 19.4,
        warehouseBufferPct: "88.2%",
        outbreakZones: "Nashik, Ahmednagar, Jalgaon"
      },
      {
        name: "Rajasthan",
        totalDistricts: 33,
        reportingDistricts: 33,
        totalPhcs: 2082,
        atRiskPhcs: 284,
        criticalPhcs: 81,
        avgStockDays: 17.8,
        warehouseBufferPct: "84.5%",
        outbreakZones: "Jaipur, Barmer, Jodhpur"
      }
    ],
    topAtRiskDistricts: [
      { rank: 1, district: "Ahmednagar", state: "Maharashtra", atRiskPct: "23.8%", criticalPhcs: 4, primaryDeficit: "ORS & Pediatric Syrups", outbreakRisk: "High (Diarrhea/EpiClim)" },
      { rank: 2, district: "Barmer", state: "Rajasthan", atRiskPct: "21.4%", criticalPhcs: 5, primaryDeficit: "IFA & Anti-Malarials", outbreakRisk: "Moderate (Malaria Vivax)" },
      { rank: 3, district: "Nashik", state: "Maharashtra", atRiskPct: "18.2%", criticalPhcs: 3, primaryDeficit: "Paediatric Antibiotics", outbreakRisk: "Moderate (Viral/Dengue)" },
      { rank: 4, district: "Jodhpur", state: "Rajasthan", atRiskPct: "17.9%", criticalPhcs: 3, primaryDeficit: "ORS & Zinc Tablets", outbreakRisk: "High (Water Contamination)" },
      { rank: 5, district: "Jalgaon", state: "Maharashtra", atRiskPct: "16.5%", criticalPhcs: 2, primaryDeficit: "Calcium & Iron Folic Acid", outbreakRisk: "Low (Seasonal Demand)" }
    ],
    districtComparison: districtsSummary
  }
};

// Real-time listener helper for Alerts with seamless fallback
export function listenToAlerts(onUpdate) {
  return subscribeToAlerts(onUpdate);
}

// Real-time listener helper for Stock Updates from WhatsApp / SMS
export function listenToStockUpdates(onUpdate) {
  return subscribeToStockUpdates(onUpdate);
}

// Real-time stock updates listener
export function subscribeToStockUpdates(callback) {
  const q = query(
    collection(db, 'stock_updates'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const updates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(updates);
  }, (error) => {
    console.error('Stock updates error:', error);
    const q2 = query(
      collection(db, 'stock_updates'),
      limit(50)
    );
    onSnapshot(q2, (snapshot) => {
      const updates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(updates);
    });
  });
}

// Real-time alerts listener
export function subscribeToAlerts(callback) {
  const q = query(
    collection(db, 'alerts'),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Filter unresolved in JavaScript
    // instead of Firestore query
    const unresolved = alerts.filter(
      a => a.resolved === false || a.resolved === undefined
    );
    callback(unresolved);
  }, (error) => {
    console.error('Alerts subscription error:', error);
    // Try without ordering if index missing
    const q2 = query(
      collection(db, 'alerts'),
      limit(20)
    );
    onSnapshot(q2, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const unresolved = alerts.filter(
        a => a.resolved === false || a.resolved === undefined
      );
      callback(unresolved);
    });
  });
}

// Real-time staff attendance listener
export function subscribeToStaffUpdates(callback) {
  try {
    const q = query(
      collection(db, 'staff_attendance'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    return onSnapshot(q, (snapshot) => {
      const staff = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(staff);
    }, (error) => {
      console.warn("subscribeToStaffUpdates note:", error.message);
    });
  } catch (err) {
    console.warn("subscribeToStaffUpdates initialization error:", err.message);
    return () => {};
  }
}

// Function to resolve an alert both locally and in Firestore
export async function resolveAlertInDb(alertId) {
  try {
    const alertRef = doc(db, "alerts", alertId);
    await updateDoc(alertRef, {
      resolved: true,
      resolvedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.log("Local mock resolve handled:", alertId);
    return false;
  }
}

