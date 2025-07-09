import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { Car, Building, Users, CalendarPlus, CalendarCheck, Search, PlusCircle, Edit, Trash2, X, CheckCircle, AlertTriangle, Info, KeyRound, MapPin, ExternalLink, ChevronDown, ChevronUp, Filter, Bell, Eye, Clock, ArrowUpDown, XCircle, Printer, ImageOff } from 'lucide-react';

// Your web app's Firebase configuration - הפרטים שלך כבר כאן!
const firebaseConfig = {
  apiKey: "AIzaSyDWIXl3_AG_hcSTGa7d4KboVkYSkE3yo58",
  authDomain: "rentsys-pro.firebaseapp.com",
  projectId: "rentsys-pro",
  storageBucket: "rentsys-pro.appspot.com",
  messagingSenderId: "18137655331",
  appId: "1:18137655331:web:b90911f7c52095b849e996"
};

const appId = 'rentsys-pro';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Firestore collection paths
const getCollectionPath = (collectionName) => `/artifacts/${appId}/public/data/${collectionName}`;

// Hooks
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error during anonymous sign-in:", error);
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  return { user, userId, isAuthReady };
};

// Helper function for date formatting
const formatDate = (timestamp, options = { dateStyle: 'short', timeStyle: 'short' }) => {
  if (!timestamp) return 'לא זמין';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.valueOf())) return 'תאריך לא תקין';
  return date.toLocaleString('he-IL', options);
};
const formatDateForInput = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.valueOf())) return '';
    return date.toISOString().split('T')[0];
};
const formatDateTimeForInput = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.valueOf())) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// --- UI Components ---

const FullScreenLoader = ({ message = "טוען..." }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-700">
    <svg className="animate-spin h-12 w-12 text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-xl font-semibold">{message}</p>
  </div>
);

const LoadingSpinner = ({ message = "טוען...", size = "md" }) => {
  const spinnerSize = size === "sm" ? "h-5 w-5" : "h-8 w-8";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <svg className={`animate-spin ${spinnerSize} text-sky-500 mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {message && <p className={`text-slate-500 ${textSize}`}>{message}</p>}
    </div>
  );
};

const EmptyState = ({ title, message, onActionClick, actionText, icon }) => (
  <div className="text-center p-8 sm:p-12 bg-white rounded-xl shadow-lg border border-slate-200 my-8">
    <div className="text-sky-500 mb-5 mx-auto w-fit p-3 bg-sky-50 rounded-full">
      {icon || <Info size={40} />}
    </div>
    <h3 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-2">{title}</h3>
    <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm sm:text-base">{message}</p>
    {onActionClick && actionText && (
      <Button onClick={onActionClick} variant="primary" icon={<PlusCircle size={18} />}>
        {actionText}
      </Button>
    )}
  </div>
);

const Button = ({ children, onClick, variant = "default", size = "md", icon, className = "", disabled = false, type = "button", title }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed";
  
  const variantStyles = {
    default: "bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-400 border border-slate-300",
    primary: "bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-500",
    secondary: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-sky-500",
    link: "bg-transparent text-sky-500 hover:text-sky-600 hover:underline focus:ring-sky-500 p-1 text-sm",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const iconMargin = children ? "ml-2" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
      {icon && React.cloneElement(icon, { className: `${iconMargin} ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`})}
    </button>
  );
};

const Input = ({ type = "text", name, value, onChange, placeholder, required, disabled, className = "", icon, ...props }) => {
  const baseStyle = "block w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
  const padding = icon ? "pr-10" : "";
  return (
    <div className="relative">
      {icon && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">{icon}</div>}
      <input type={type} name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} className={`${baseStyle} ${padding} ${className}`} {...props} />
      {required && <span className="absolute top-1/2 left-3 transform -translate-y-1/2 text-red-500 text-xl" title="שדה חובה">*</span>}
    </div>
  );
};

const Select = ({ name, value, onChange, required, disabled, children, className = "" }) => {
  const baseStyle = "block w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
  return (
    <div className="relative">
        <select name={name} id={name} value={value} onChange={onChange} required={required} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</select>
        {required && <span className="absolute top-1/2 left-3 transform -translate-y-1/2 text-red-500 text-xl" title="שדה חובה">*</span>}
    </div>
  );
};

const Textarea = ({ name, value, onChange, placeholder, required, disabled, rows = 3, className = "" }) => {
  const baseStyle = "block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
  return (
    <div className="relative">
        <textarea name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} rows={rows} className={`${baseStyle} ${className}`}></textarea>
        {required && <span className="absolute top-3 left-3 text-red-500 text-xl" title="שדה חובה">*</span>}
    </div>
  );
};

const Label = ({ htmlFor, children, className = "" }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-slate-700 mb-1 ${className}`}>{children}</label>
);

const SortableTableHeader = ({ children, sortKey, currentSort, onSort }) => {
    const isActive = currentSort.key === sortKey;
    const Icon = isActive ? (currentSort.direction === 'asc' ? ChevronUp : ChevronDown) : ArrowUpDown;
    return (
        <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort(sortKey)}>
            <div className="flex items-center justify-between">
                <span>{children}</span>
                <Icon size={14} className={isActive ? "text-sky-500" : "text-slate-400"} />
            </div>
        </th>
    );
};


const Navbar = ({ setCurrentPage, currentPage, userId }) => {
  const navItems = [
    { name: 'לוח בקרה', page: 'dashboard', icon: <Search size={16} /> },
    { name: 'רכבים', page: 'vehicles', icon: <Car size={16} /> },
    { name: 'סניפים', page: 'branches', icon: <Building size={16} /> },
    { name: 'לקוחות', page: 'customers', icon: <Users size={16} /> },
    { name: 'השכרות', page: 'rentals', icon: <CalendarPlus size={16} /> },
  ];

  return (
    <header className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg sticky top-0 z-40 print:hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <KeyRound size={28} className="text-yellow-300 ml-3 transform rotate-[-45deg]" />
            <span className="font-bold text-xl tracking-tight">RentSys Pro</span>
          </div>
          <nav className="hidden md:flex items-center space-x-1 space-x-reverse">
            {navItems.map(item => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                title={item.name}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ease-in-out transform hover:scale-105
                  ${currentPage === item.page 
                    ? 'bg-white text-sky-600 shadow-md ring-2 ring-sky-200' 
                    : 'hover:bg-sky-500 hover:bg-opacity-80'}`}
              >
                {item.icon}
                <span className="mr-2">{item.name}</span>
              </button>
            ))}
          </nav>
          <div className="md:hidden flex items-center">
            <Select 
              onChange={(e) => setCurrentPage(e.target.value)} 
              value={currentPage}
              className="bg-sky-700 text-white !py-2 !border-sky-600 focus:!ring-white text-sm"
            >
              {navItems.map(item => (
                <option key={item.page} value={item.page}>{item.name}</option>
              ))}
            </Select>
          </div>
        </div>
         {userId && <div className="text-xs pb-2 text-center md:text-right text-sky-100 opacity-70">משתמש: {userId.substring(0,10)}...</div>}
      </div>
    </header>
  );
};

const Modal = ({ children, onClose, size = 'default' }) => {
  useEffect(() => {
    const handleEsc = (event) => { if (event.keyCode === 27) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const sizeClasses = {
    sm: 'max-w-lg',
    default: 'max-w-xl md:max-w-2xl lg:max-w-3xl',
    lg: 'max-w-4xl lg:max-w-5xl',
    xl: 'max-w-6xl lg:max-w-7xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden" onClick={onClose}>
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all relative max-h-[90vh] flex flex-col`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-0 flex-shrink-0">
          <button onClick={onClose} className="absolute top-3.5 left-3.5 text-slate-400 hover:text-slate-600 transition-colors z-10 p-1.5 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 pt-1 flex-grow custom-scrollbar">
            {children}
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }`}</style>
    </div>
  );
};

const Notification = ({ type, message, onClose }) => {
  const baseStyles = "w-full max-w-sm text-white p-3.5 pr-4 rounded-lg shadow-xl flex items-center transition-all duration-300 ease-out transform animate-slide-in-right";
  const typeStyles = {
    success: { bg: 'bg-emerald-500', icon: <CheckCircle size={20} /> },
    error: { bg: 'bg-red-500', icon: <AlertTriangle size={20} /> },
    info: { bg: 'bg-sky-500', icon: <Info size={20} /> },
    warning: { bg: 'bg-amber-500', icon: <AlertTriangle size={20} /> },
  };
  const currentType = typeStyles[type] || typeStyles.info;

  return (
    <div className={`${baseStyles} ${currentType.bg}`}>
      {currentType.icon}
      <span className="mr-2.5 text-sm font-medium flex-grow">{message}</span>
      <button onClick={onClose} className="text-white opacity-80 hover:opacity-100 transition-opacity ml-2 p-0.5">
        <X size={16} />
      </button>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } .animate-slide-in-right { animation: slideInRight 0.3s ease-out forwards; }`}</style>
    </div>
  );
};

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "אישור", confirmVariant = "danger" }) => {
  return (
    <div className="p-1">
      <div className="flex items-center mb-5">
        <div className={`p-2.5 bg-${confirmVariant === 'danger' ? 'red' : 'amber'}-100 rounded-full mr-3`}>
            <AlertTriangle size={24} className={`text-${confirmVariant === 'danger' ? 'red' : 'amber'}-500`} />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">{title || "אישור פעולה"}</h2>
      </div>
      <p className="text-slate-600 mb-8 text-sm leading-relaxed">{message || "האם אתה בטוח שברצונך לבצע פעולה זו?"}</p>
      <div className="flex justify-end space-x-3 space-x-reverse">
        <Button onClick={onCancel} variant="default" size="md">ביטול</Button>
        <Button onClick={() => { onConfirm(); onCancel(); }} variant={confirmVariant} size="md">{confirmText}</Button>
      </div>
    </div>
  );
};

// --- Page Components ---

const DashboardPage = ({ openModal, showNotification, userId, setCurrentPage }) => {
  const [stats, setStats] = useState({ vehicles: 0, branches: 0, customers: 0, activeRentals: 0 });
  const [vehicleAlerts, setVehicleAlerts] = useState([]);
  const [rentalAlerts, setRentalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !db) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [vehiclesSnap, branchesSnap, customersSnap, rentalsSnap] = await Promise.all([
          getDocs(collection(db, getCollectionPath('vehicles'))),
          getDocs(collection(db, getCollectionPath('branches'))),
          getDocs(collection(db, getCollectionPath('customers'))),
          getDocs(collection(db, getCollectionPath('rentals')))
        ]);

        const customersData = customersSnap.docs.map(d => ({id: d.id, ...d.data()}));

        // Stats
        setStats({
          vehicles: vehiclesSnap.size,
          branches: branchesSnap.size,
          customers: customersSnap.size,
          activeRentals: rentalsSnap.docs.filter(d => d.data().status === 'active').length,
        });

        // Vehicle Alerts
        const today = new Date();
        const upcomingThreshold = new Date(); upcomingThreshold.setDate(today.getDate() + 30);
        const alerts = vehiclesSnap.docs.reduce((acc, doc) => {
          const v = { id: doc.id, ...doc.data() };
          let msgs = [];
          if (v.insuranceValidUntil) {
            const date = v.insuranceValidUntil.toDate ? v.insuranceValidUntil.toDate() : new Date(v.insuranceValidUntil);
            if (date < today) msgs.push({ type: 'expired', text: `ביטוח פג (${formatDate(date, {dateStyle:'short'})})` });
            else if (date <= upcomingThreshold) msgs.push({ type: 'upcoming', text: `ביטוח מסתיים (${formatDate(date, {dateStyle:'short'})})` });
          }
          if (v.testValidUntil) {
            const date = v.testValidUntil.toDate ? v.testValidUntil.toDate() : new Date(v.testValidUntil);
            if (date < today) msgs.push({ type: 'expired', text: `טסט פג (${formatDate(date, {dateStyle:'short'})})` });
            else if (date <= upcomingThreshold) msgs.push({ type: 'upcoming', text: `טסט מסתיים (${formatDate(date, {dateStyle:'short'})})` });
          }
          if (msgs.length > 0) acc.push({ ...v, alertMessages: msgs });
          return acc;
        }, []);
        setVehicleAlerts(alerts);

        // Rental Alerts (ending soon)
        const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
        const endingRentals = rentalsSnap.docs
          .map(d => ({id: d.id, ...d.data()}))
          .filter(r => r.status === 'active' && r.expectedReturnTimestamp)
          .map(r => ({...r, 
            vehicleData: vehiclesSnap.docs.find(v => v.id === r.vehicleId)?.data(),
            customer: customersData.find(c => c.id === r.customerId)
          }))
          .filter(r => {
            const returnDate = r.expectedReturnTimestamp.toDate ? r.expectedReturnTimestamp.toDate() : new Date(r.expectedReturnTimestamp);
            return returnDate >= today && returnDate <= tomorrow;
          });
        setRentalAlerts(endingRentals);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
        showNotification('error', 'שגיאה בטעינת נתוני לוח הבקרה.');
      } finally {
        setLoading(false);
      }
    };
    
    // Setup listeners for real-time updates
    const unsubs = [
        onSnapshot(collection(db, getCollectionPath('vehicles')), fetchData),
        onSnapshot(collection(db, getCollectionPath('branches')), fetchData),
        onSnapshot(collection(db, getCollectionPath('customers')), fetchData),
        onSnapshot(collection(db, getCollectionPath('rentals')), fetchData),
    ];
    return () => unsubs.forEach(unsub => unsub());

  }, [userId, showNotification]);

  const statCards = [
    { title: 'סה"כ רכבים', value: stats.vehicles, icon: <Car className="text-sky-500" />, color: 'sky', page: 'vehicles' },
    { title: 'סה"כ סניפים', value: stats.branches, icon: <Building className="text-emerald-500" />, color: 'emerald', page: 'branches' },
    { title: 'סה"כ לקוחות', value: stats.customers, icon: <Users className="text-violet-500" />, color: 'violet', page: 'customers' },
    { title: 'השכרות פעילות', value: stats.activeRentals, icon: <CalendarCheck className="text-rose-500" />, color: 'rose', page: 'rentals' },
  ];
  
  const StatCard = ({ title, value, icon, color, page }) => (
    <div 
        className={`bg-white p-5 rounded-xl shadow-lg border-l-4 border-${color}-500 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px]`}
        onClick={() => setCurrentPage(page)}
    >
      {loading ? (
        <div className="flex justify-center items-center h-full"><LoadingSpinner size="sm" message="" /></div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <div className={`p-2 rounded-full bg-${color}-50`}> {React.cloneElement(icon, { size: 20 })} </div>
          </div>
          <p className={`text-3xl font-bold text-slate-800 mt-1`}>{value}</p>
        </>
      )}
    </div>
  );

  const AlertItem = ({ item, type, openModal }) => (
    <div className={`p-3.5 rounded-lg border ${item.alertMessages?.some(m => m.type === 'expired') || type==='rental-ending' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} text-sm`}>
        <h4 className="font-semibold text-slate-700">
            {type === 'vehicle' ? `${item.make} ${item.model} (${item.licensePlate})` : 
             `השכרה מסתיימת: ${item.vehicleData?.make || ''} ${item.vehicleData?.model || ''} (${item.vehicleData?.licensePlate || 'לא ידוע'})`}
        </h4>
        {type === 'vehicle' && item.alertMessages && (
            <ul className="list-disc list-inside mt-1 space-y-0.5">
                {item.alertMessages.map(alert => (
                    <li key={alert.text} className={`text-xs ${alert.type === 'expired' ? 'text-red-600' : 'text-amber-600'}`}>{alert.text}</li>
                ))}
            </ul>
        )}
        {type === 'rental-ending' && (
            <p className="text-xs text-red-600">
                לקוח: {item.customer?.name || 'לא ידוע'}, החזרה: {formatDate(item.expectedReturnTimestamp, {dateStyle:'short', timeStyle:'short'})}
            </p>
        )}
        <Button variant="link" size="sm" className="mt-1 !px-0" onClick={() => openModal(type === 'vehicle' ? 'editVehicle' : 'viewRental', item)}>
            {type === 'vehicle' ? 'פרטי רכב' : 'פרטי השכרה'} <ExternalLink size={12} className="mr-1"/>
        </Button>
    </div>
  );

  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6 text-slate-800">לוח בקרה</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(card => <StatCard key={card.title} {...card} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-700 flex items-center"><Bell size={20} className="ml-2 text-amber-500" /> התראות רכבים</h2>
            {loading ? <LoadingSpinner message="טוען התראות..." /> : 
             vehicleAlerts.length === 0 ? <p className="text-slate-500 text-center py-4 text-sm">אין התראות רכבים. <CheckCircle className="inline ml-1 text-emerald-500" size={16}/></p> : 
             <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">{vehicleAlerts.map(v => <AlertItem key={v.id} item={v} type="vehicle" openModal={openModal}/>)}</div>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-700 flex items-center"><CalendarCheck size={20} className="ml-2 text-rose-500" /> השכרות מסתיימות בקרוב</h2>
            {loading ? <LoadingSpinner message="טוען השכרות..." /> : 
             rentalAlerts.length === 0 ? <p className="text-slate-500 text-center py-4 text-sm">אין השכרות שמסתיימות היום או מחר.</p> : 
             <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">{rentalAlerts.map(r => <AlertItem key={r.id} item={r} type="rental-ending" openModal={openModal}/>)}</div>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-5 text-slate-700">פעולות מהירות</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => openModal('addVehicle')} variant="primary" icon={<PlusCircle />}>הוסף רכב</Button>
          <Button onClick={() => openModal('addBranch')} variant="secondary" icon={<PlusCircle />}>הוסף סניף</Button>
          <Button onClick={() => openModal('addCustomer')} className="bg-violet-500 hover:bg-violet-600 focus:ring-violet-500 text-white" icon={<PlusCircle />}>הוסף לקוח</Button>
          <Button onClick={() => openModal('addRental')} className="bg-rose-500 hover:bg-rose-600 focus:ring-rose-500 text-white" icon={<CalendarPlus />}>השכרה חדשה</Button>
        </div>
      </div>
    </div>
  );
};


const VehiclesPage = ({ openModal, showNotification, userId }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', branchId: '' });
  const [branches, setBranches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'make', direction: 'asc' });

  const fetchVehiclesAndBranches = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [vehiclesSnapshot, branchesSnapshot] = await Promise.all([
          getDocs(collection(db, getCollectionPath('vehicles'))),
          getDocs(collection(db, getCollectionPath('branches')))
      ]);
      setVehicles(vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setBranches(branchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { showNotification('error', 'שגיאה בטעינת רכבים או סניפים.'); }
    setLoading(false);
  }, [userId, showNotification]);

  useEffect(() => {
    const unsubs = [
        onSnapshot(collection(db, getCollectionPath('vehicles')), () => fetchVehiclesAndBranches()),
        onSnapshot(collection(db, getCollectionPath('branches')), () => fetchVehiclesAndBranches())
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, [fetchVehiclesAndBranches]);

  const handleDeleteVehicle = async (vehicleId, vehicleName) => {
    openModal('confirmAction', { 
        onConfirm: async () => {
          try {
            const activeRentalsQuery = query(collection(db, getCollectionPath('rentals')), where('vehicleId', '==', vehicleId), where('status', '==', 'active'));
            const activeRentalsSnapshot = await getDocs(activeRentalsQuery);
            if (!activeRentalsSnapshot.empty) {
                showNotification('error', `לא ניתן למחוק את רכב "${vehicleName}". הוא משויך להשכרה פעילה.`); return;
            }
            await deleteDoc(doc(db, getCollectionPath('vehicles'), vehicleId));
            showNotification('success', `רכב "${vehicleName}" נמחק.`);
          } catch (error) { showNotification('error', `שגיאה במחיקת רכב "${vehicleName}".`); }
        }, confirmText: "כן, מחק רכב", confirmVariant: 'danger'
      }, null, `האם אתה בטוח שברצונך למחוק את הרכב "${vehicleName}"?`, "אישור מחיקת רכב");
  };
  
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredVehicles = useMemo(() => {
    let V = [...vehicles];
    // Filter
    V = V.filter(vehicle => {
        const searchMatch = vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = filters.status ? vehicle.status === filters.status : true;
        const branchMatch = filters.branchId ? vehicle.currentBranchId === filters.branchId : true;
        return searchMatch && statusMatch && branchMatch;
    });
    // Sort
    V.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    return V;
  }, [vehicles, searchTerm, filters, sortConfig]);


  if (loading && vehicles.length === 0) return <FullScreenLoader message="טוען רשימת רכבים..." />;

  return (
    <div className="container mx-auto">
      <div className="mb-6 p-5 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 self-start md:self-center">ניהול רכבים</h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Input type="text" placeholder="חפש רכב..." className="w-full sm:w-52" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search size={16} className="text-slate-400"/>}/>
                <Button onClick={() => setShowFilters(!showFilters)} variant="default" icon={<Filter size={16}/>} className="w-full sm:w-auto">{showFilters ? 'הסתר סינון' : 'הצג סינון'}</Button>
                <Button onClick={() => openModal('addVehicle', null, fetchVehiclesAndBranches)} variant="primary" icon={<PlusCircle size={16}/>} className="w-full sm:w-auto">הוסף רכב</Button>
            </div>
        </div>
        {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-t border-slate-200 animate-fade-in-down">
                <div>
                    <Label htmlFor="statusFilter">סנן לפי סטטוס</Label>
                    <Select name="status" id="statusFilter" value={filters.status} onChange={handleFilterChange}>
                        <option value="">כל הסטטוסים</option><option value="available">זמין</option><option value="rented">מושכר</option><option value="maintenance">בטיפול</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="branchFilter">סנן לפי סניף</Label>
                    <Select name="branchId" id="branchFilter" value={filters.branchId} onChange={handleFilterChange}>
                        <option value="">כל הסניפים</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </Select>
                </div>
            </div>
        )}
      </div>

      {sortedAndFilteredVehicles.length === 0 ? (
        <EmptyState title="לא נמצאו רכבים" message={searchTerm || filters.status || filters.branchId ? "אין רכבים התואמים לחיפוש/סינון." : "עדיין לא הוספו רכבים."} onActionClick={() => openModal('addVehicle', null, fetchVehiclesAndBranches)} actionText="הוסף רכב ראשון" icon={<Car size={48} />}/>
      ) : (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">תמונה</th>
                <SortableTableHeader sortKey="licensePlate" currentSort={sortConfig} onSort={handleSort}>לוחית רישוי</SortableTableHeader>
                <SortableTableHeader sortKey="make" currentSort={sortConfig} onSort={handleSort}>יצרן ודגם</SortableTableHeader>
                <SortableTableHeader sortKey="year" currentSort={sortConfig} onSort={handleSort}>שנה</SortableTableHeader>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">צבע</th>
                <SortableTableHeader sortKey="dailyRate" currentSort={sortConfig} onSort={handleSort}>תעריף</SortableTableHeader>
                <SortableTableHeader sortKey="status" currentSort={sortConfig} onSort={handleSort}>סטטוס</SortableTableHeader>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">סניף</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">ביטוח</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">טסט</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {sortedAndFilteredVehicles.map((vehicle) => (
                <VehicleRow key={vehicle.id} vehicle={vehicle} openModal={openModal} handleDeleteVehicle={handleDeleteVehicle} branches={branches} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`.animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; } @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

const VehicleRow = ({ vehicle, openModal, handleDeleteVehicle, branches }) => {
  const branchName = useMemo(() => {
    if (!vehicle.currentBranchId) return <span className="text-slate-400 italic">ללא סניף</span>;
    const branch = branches.find(b => b.id === vehicle.currentBranchId);
    return branch ? branch.name : <span className="text-amber-600 italic">סניף לא קיים</span>;
  }, [vehicle.currentBranchId, branches]);
  
  const getStatusChip = (status) => {
    const styles = { available: "bg-emerald-100 text-emerald-700", rented: "bg-rose-100 text-rose-700", maintenance: "bg-amber-100 text-amber-700", default: "bg-slate-100 text-slate-700" };
    const currentStyle = styles[status] || styles.default;
    return <span className={`px-2 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-full ${currentStyle}`}>{status || 'לא ידוע'}</span>;
  };
  
  const vehicleName = `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.licensePlate || 'לא ידוע'})`;
  const isInsuranceExpired = vehicle.insuranceValidUntil && (vehicle.insuranceValidUntil.toDate ? vehicle.insuranceValidUntil.toDate() : new Date(vehicle.insuranceValidUntil)) < new Date();
  const isTestExpired = vehicle.testValidUntil && (vehicle.testValidUntil.toDate ? vehicle.testValidUntil.toDate() : new Date(vehicle.testValidUntil)) < new Date();

  return (
     <tr className="hover:bg-slate-50 transition-colors duration-150 text-sm">
      <td className="px-4 py-2.5 whitespace-nowrap">
        {vehicle.imageUrl ? (
          <img src={vehicle.imageUrl} alt={vehicleName} className="h-10 w-16 object-cover rounded border border-slate-200" onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} />
        ) : null}
        <div className={`h-10 w-16 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-slate-400 ${vehicle.imageUrl ? 'hidden': 'flex'}`}> <ImageOff size={18} /> </div>
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">{vehicle.licensePlate}</td>
      <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{vehicle.make} {vehicle.model}</td>
      <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{vehicle.year}</td>
      <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
        <div className="flex items-center"><span className="w-3.5 h-3.5 rounded-full ml-2 border border-slate-300 shadow-inner" style={{ backgroundColor: vehicle.color || '#E2E8F0' }}></span>{vehicle.colorName || vehicle.color}</div>
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">₪{parseFloat(vehicle.dailyRate || 0).toFixed(2)}</td>
      <td className="px-4 py-2.5 whitespace-nowrap">{getStatusChip(vehicle.status)}</td>
      <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{branchName}</td>
      <td className={`px-4 py-2.5 whitespace-nowrap text-xs ${isInsuranceExpired ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>{formatDate(vehicle.insuranceValidUntil, {dateStyle:'short'})}</td>
      <td className={`px-4 py-2.5 whitespace-nowrap text-xs ${isTestExpired ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>{formatDate(vehicle.testValidUntil, {dateStyle:'short'})}</td>
      <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
        <div className="flex items-center space-x-0.5 space-x-reverse">
            <Button onClick={() => openModal('editVehicle', vehicle)} variant="ghost" size="sm" title="ערוך רכב"><Edit size={14} /></Button>
            <Button onClick={() => handleDeleteVehicle(vehicle.id, vehicleName)} variant="ghost" size="sm" title="מחק רכב" className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
        </div>
      </td>
    </tr>
  )
}

const VehicleForm = ({ mode, vehicleData, closeModal, showNotification, callback, userId }) => {
  const [formData, setFormData] = useState({
    licensePlate: '', make: '', model: '', year: new Date().getFullYear(), color: '#000000', colorName: '',
    dailyRate: '', status: 'available', currentBranchId: '', imageUrl: '', features: [],
    insuranceValidUntil: '', testValidUntil: '',
    ...(vehicleData || {}),
    insuranceValidUntil: vehicleData?.insuranceValidUntil ? formatDateForInput(vehicleData.insuranceValidUntil) : '',
    testValidUntil: vehicleData?.testValidUntil ? formatDateForInput(vehicleData.testValidUntil) : '',
  });

  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      if (!userId) return;
      try {
        const branchesSnapshot = await getDocs(collection(db, getCollectionPath('branches')));
        setBranches(branchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { showNotification('error', 'שגיאה בטעינת סניפים.'); }
    };
    fetchBranches();
  }, [userId, showNotification]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFeatureAdd = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      setFeatureInput('');
    }
  };
  const handleFeatureRemove = (featureToRemove) => setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== featureToRemove) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const dataToSave = {
        ...formData,
        year: parseInt(formData.year),
        dailyRate: parseFloat(formData.dailyRate),
        insuranceValidUntil: formData.insuranceValidUntil ? Timestamp.fromDate(new Date(formData.insuranceValidUntil)) : null,
        testValidUntil: formData.testValidUntil ? Timestamp.fromDate(new Date(formData.testValidUntil)) : null,
        features: formData.features || [], // Ensure features is an array
        updatedAt: serverTimestamp()
      };

      if (mode === 'add') {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, getCollectionPath('vehicles')), dataToSave);
        showNotification('success', 'הרכב נוסף בהצלחה!');
      } else {
        await updateDoc(doc(db, getCollectionPath('vehicles'), vehicleData.id), dataToSave);
        showNotification('success', 'פרטי הרכב עודכנו בהצלחה!');
      }
      if (callback) callback();
      closeModal();
    } catch (error) {
      showNotification('error', `שגיאה בשמירת הרכב: ${error.message}`);
    } finally { setIsLoading(false); }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-800 mb-2">{mode === 'add' ? 'הוספת רכב חדש' : 'עריכת פרטי רכב'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <div><Label htmlFor="licensePlate">מספר רישוי</Label><Input name="licensePlate" value={formData.licensePlate} onChange={handleChange} required /></div>
        <div><Label htmlFor="make">יצרן</Label><Input name="make" value={formData.make} onChange={handleChange} required /></div>
        <div><Label htmlFor="model">דגם</Label><Input name="model" value={formData.model} onChange={handleChange} required /></div>
        <div><Label htmlFor="year">שנה</Label><Input type="number" name="year" value={formData.year} onChange={handleChange} required min="1900" max={new Date().getFullYear() + 2} /></div>
        <div><Label htmlFor="colorName">שם צבע</Label><Input name="colorName" value={formData.colorName} onChange={handleChange} placeholder="לדוגמה: כחול מטאלי" /></div>
        <div><Label htmlFor="color">בחר צבע</Label><Input type="color" name="color" value={formData.color} onChange={handleChange} className="h-10 p-1" /></div>
        <div><Label htmlFor="dailyRate">תעריף יומי (₪)</Label><Input type="number" name="dailyRate" value={formData.dailyRate} onChange={handleChange} required min="0" step="0.01" /></div>
        <div><Label htmlFor="status">סטטוס</Label><Select name="status" value={formData.status} onChange={handleChange} required>
            <option value="available">זמין</option><option value="rented">מושכר</option><option value="maintenance">בטיפול</option></Select></div>
        <div><Label htmlFor="currentBranchId">סניף נוכחי</Label><Select name="currentBranchId" value={formData.currentBranchId} onChange={handleChange}>
            <option value="">ללא סניף</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div>
        <div><Label htmlFor="imageUrl">קישור לתמונה</Label><Input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..."/></div>
        <div><Label htmlFor="insuranceValidUntil">ביטוח בתוקף עד</Label><Input type="date" name="insuranceValidUntil" value={formData.insuranceValidUntil} onChange={handleChange} /></div>
        <div><Label htmlFor="testValidUntil">טסט בתוקף עד</Label><Input type="date" name="testValidUntil" value={formData.testValidUntil} onChange={handleChange} /></div>
      </div>
      <div>
        <Label>מאפיינים נוספים (לדוגמה: GPS, כיסא תינוק)</Label>
        <div className="flex items-center mt-1">
          <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="הכנס מאפיין ולחץ הוסף" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFeatureAdd(); }}} className="rounded-r-none"/>
          <Button type="button" onClick={handleFeatureAdd} className="rounded-l-none px-3.5 border border-l-0 border-slate-300 !shadow-none">הוסף</Button>
        </div>
        <div className="mt-2.5 space-x-1 space-x-reverse flex flex-wrap gap-1.5">
          {(formData.features || []).map(f => (<span key={f} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700"> {f}
            <button type="button" onClick={() => handleFeatureRemove(f)} className="mr-1.5 text-sky-400 hover:text-sky-600"><X size={12} /></button></span>))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-200 mt-6">
        <Button type="button" onClick={closeModal} variant="default">ביטול</Button>
        <Button type="submit" variant="primary" disabled={isLoading} icon={isLoading ? <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : null}>
          {isLoading ? 'שומר...' : (mode === 'add' ? 'הוסף רכב' : 'שמור שינויים')}
        </Button>
      </div>
    </form>
  );
};

const BranchesPage = ({ openModal, showNotification, userId }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBranches = useCallback(() => {
    if (!userId) return; setLoading(true);
    const unsub = onSnapshot(collection(db, getCollectionPath('branches')), 
      (snapshot) => { setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); }, 
      (error) => { showNotification('error', 'שגיאה בטעינת סניפים.'); setLoading(false); });
    return unsub;
  }, [userId, showNotification]);

  useEffect(() => { const unsubscribe = fetchBranches(); return () => unsubscribe && unsubscribe(); }, [fetchBranches]);

  const handleDeleteBranch = async (branchId, branchName) => {
     openModal('confirmAction', { 
        onConfirm: async () => {
          try {
            const vehiclesQuery = query(collection(db, getCollectionPath('vehicles')), where('currentBranchId', '==', branchId));
            const vehiclesSnapshot = await getDocs(vehiclesQuery);
            if (!vehiclesSnapshot.empty) {
              showNotification('error', `לא ניתן למחוק סניף "${branchName}". יש בו ${vehiclesSnapshot.size} רכבים.`); return;
            }
            await deleteDoc(doc(db, getCollectionPath('branches'), branchId));
            showNotification('success', `סניף "${branchName}" נמחק.`);
          } catch (error) { showNotification('error', `שגיאה במחיקת סניף "${branchName}".`); }
        }, confirmText: "כן, מחק סניף", confirmVariant: 'danger'
      }, null, `האם למחוק את סניף "${branchName}"?`, "אישור מחיקת סניף");
  };
  
  if (loading && branches.length === 0) return <FullScreenLoader message="טוען רשימת סניפים..." />;

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold text-slate-800">ניהול סניפים</h1>
        <Button onClick={() => openModal('addBranch', null, fetchBranches)} variant="secondary" icon={<PlusCircle size={16}/>}>הוסף סניף</Button>
      </div>
      {branches.length === 0 && !loading ? (
         <EmptyState title="לא נמצאו סניפים" message="עדיין לא נוספו סניפים למערכת." onActionClick={() => openModal('addBranch', null, fetchBranches)} actionText="הוסף סניף ראשון" icon={<Building size={48}/>}/>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-slate-200 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold text-slate-800">{branch.name}</h2>
                <div className="flex space-x-0.5 space-x-reverse">
                  <Button onClick={() => openModal('editBranch', branch, fetchBranches)} variant="ghost" size="sm" title="ערוך סניף"><Edit size={14} /></Button>
                  <Button onClick={() => handleDeleteBranch(branch.id, branch.name)} variant="ghost" size="sm" title="מחק סניף" className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-slate-600 flex-grow">
                <p className="flex items-start"><MapPin size={14} className="ml-2 mt-0.5 text-slate-400 shrink-0"/> {branch.address}</p>
                <p className="flex items-center"><Users size={14} className="ml-2 text-slate-400 shrink-0"/> {branch.phone || <span className="italic text-slate-400">אין מספר</span>}</p>
                {branch.workingHours && <p className="flex items-start"><Clock size={14} className="ml-2 mt-0.5 text-slate-400 shrink-0"/> {branch.workingHours}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BranchForm = ({ mode, branchData, closeModal, showNotification, callback, userId }) => {
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', workingHours: '', ...(branchData || {}) });
  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const dataToSave = { ...formData, updatedAt: serverTimestamp() };
      if (mode === 'add') {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, getCollectionPath('branches')), dataToSave);
        showNotification('success', 'הסניף נוסף בהצלחה!');
      } else {
        await updateDoc(doc(db, getCollectionPath('branches'), branchData.id), dataToSave);
        showNotification('success', 'פרטי הסניף עודכנו בהצלחה!');
      }
      if (callback) callback(); closeModal();
    } catch (error) { showNotification('error', `שגיאה בשמירת סניף: ${error.message}`);
    } finally { setIsLoading(false); }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-800 mb-2">{mode === 'add' ? 'הוספת סניף חדש' : 'עריכת פרטי סניף'}</h2>
      <div><Label htmlFor="name">שם הסניף</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
      <div><Label htmlFor="address">כתובת</Label><Input name="address" value={formData.address} onChange={handleChange} required /></div>
      <div><Label htmlFor="phone">טלפון</Label><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} /></div>
      <div><Label htmlFor="workingHours">שעות פתיחה</Label><Input name="workingHours" value={formData.workingHours} onChange={handleChange} placeholder="לדוגמה: א-ה 09:00-17:00, ו 09:00-13:00"/></div>
      <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-200 mt-6">
        <Button type="button" onClick={closeModal} variant="default">ביטול</Button>
        <Button type="submit" variant="secondary" disabled={isLoading} icon={isLoading ? <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : null}>
          {isLoading ? 'שומר...' : (mode === 'add' ? 'הוסף סניף' : 'שמור שינויים')}
        </Button>
      </div>
    </form>
  );
};

const CustomersPage = ({ openModal, showNotification, userId }) => { 
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const fetchCustomers = useCallback(() => {
        if (!userId) return; setLoading(true);
        const unsub = onSnapshot(collection(db, getCollectionPath('customers')), 
            (snapshot) => { setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); },
            (error) => { showNotification('error', 'שגיאה בטעינת לקוחות.'); setLoading(false); }
        );
        return unsub;
    }, [userId, showNotification]);

    useEffect(() => { const unsubscribe = fetchCustomers(); return () => unsubscribe && unsubscribe(); }, [fetchCustomers]);
    
    const handleDeleteCustomer = async (customerId, customerName) => {
        openModal('confirmAction', { 
            onConfirm: async () => {
              try {
                const activeRentalsQuery = query(collection(db, getCollectionPath('rentals')), where('customerId', '==', customerId), where('status', '==', 'active'));
                const activeRentalsSnapshot = await getDocs(activeRentalsQuery);
                if (!activeRentalsSnapshot.empty) {
                    showNotification('error', `לא ניתן למחוק את לקוח "${customerName}". הוא משויך להשכרה פעילה.`); return;
                }
                await deleteDoc(doc(db, getCollectionPath('customers'), customerId));
                showNotification('success', `לקוח "${customerName}" נמחק.`);
              } catch (error) { showNotification('error', `שגיאה במחיקת לקוח "${customerName}".`); }
            }, confirmText: "כן, מחק לקוח", confirmVariant: 'danger'
          }, null, `האם למחוק את לקוח "${customerName}"?`, "אישור מחיקת לקוח");
    };
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    const sortedAndFilteredCustomers = useMemo(() => {
        let C = [...customers];
        C = C.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.idNumber?.includes(searchTerm) || c.phone?.includes(searchTerm));
        C.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return C;
    }, [customers, searchTerm, sortConfig]);

    if (loading && customers.length === 0) return <FullScreenLoader message="טוען לקוחות..." />;
    return (
        <div className="container mx-auto">
            <div className="mb-6 p-5 bg-white rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">ניהול לקוחות</h1>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Input type="text" placeholder="חפש לקוח..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search size={16} className="text-slate-400"/>} className="w-full sm:w-auto"/>
                    <Button onClick={() => openModal('addCustomer', null, fetchCustomers)} className="bg-violet-500 hover:bg-violet-600 focus:ring-violet-500 text-white" icon={<PlusCircle size={16}/>}>הוסף לקוח</Button>
                </div>
            </div>
            {sortedAndFilteredCustomers.length === 0 ? <EmptyState title="לא נמצאו לקוחות" message="עדיין לא נוספו לקוחות למערכת." onActionClick={() => openModal('addCustomer')} actionText="הוסף לקוח ראשון" icon={<Users size={48}/>}/> : 
             <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <SortableTableHeader sortKey="name" currentSort={sortConfig} onSort={handleSort}>שם מלא</SortableTableHeader>
                            <SortableTableHeader sortKey="idNumber" currentSort={sortConfig} onSort={handleSort}>ת.ז.</SortableTableHeader>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">טלפון</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">דוא"ל</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">רישיון</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">תוקף רישיון</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 text-sm">
                        {sortedAndFilteredCustomers.map(customer => (
                            <tr key={customer.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">{customer.name}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{customer.idNumber}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{customer.phone}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{customer.email}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{customer.licenseNumber}</td>
                                <td className={`px-4 py-2.5 whitespace-nowrap text-xs ${customer.licenseValidUntil && new Date(customer.licenseValidUntil.seconds * 1000) < new Date() ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>{formatDate(customer.licenseValidUntil, {dateStyle:'short'})}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                    <div className="flex items-center space-x-0.5 space-x-reverse">
                                        <Button onClick={() => openModal('editCustomer', customer)} variant="ghost" size="sm" title="ערוך לקוח"><Edit size={14} /></Button>
                                        <Button onClick={() => handleDeleteCustomer(customer.id, customer.name)} variant="ghost" size="sm" title="מחק לקוח" className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>}
        </div>
    );
};
const CustomerForm = ({ mode, customerData, closeModal, showNotification, callback, userId }) => {
    const [formData, setFormData] = useState({
        name: '', idNumber: '', phone: '', email: '', address: '', licenseNumber: '', licenseValidUntil: '',
        ...(customerData || {}),
        licenseValidUntil: customerData?.licenseValidUntil ? formatDateForInput(customerData.licenseValidUntil) : '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setIsLoading(true);
        try {
            const dataToSave = { ...formData, licenseValidUntil: formData.licenseValidUntil ? Timestamp.fromDate(new Date(formData.licenseValidUntil)) : null, updatedAt: serverTimestamp() };
            if (mode === 'add') {
                dataToSave.createdAt = serverTimestamp();
                const q = query(collection(db, getCollectionPath('customers')), where('idNumber', '==', formData.idNumber));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    showNotification('error', 'לקוח עם ת.ז. זו כבר קיים.'); setIsLoading(false); return;
                }
                await addDoc(collection(db, getCollectionPath('customers')), dataToSave);
                showNotification('success', 'הלקוח נוסף בהצלחה!');
            } else {
                await updateDoc(doc(db, getCollectionPath('customers'), customerData.id), dataToSave);
                showNotification('success', 'פרטי הלקוח עודכנו!');
            }
            if (callback) callback(); closeModal();
        } catch (error) { showNotification('error', `שגיאה בשמירת לקוח: ${error.message}`);
        } finally { setIsLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">{mode === 'add' ? 'הוספת לקוח חדש' : 'עריכת פרטי לקוח'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div><Label htmlFor="name">שם מלא</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                <div><Label htmlFor="idNumber">ת.ז.</Label><Input name="idNumber" value={formData.idNumber} onChange={handleChange} required /></div>
                <div><Label htmlFor="phone">טלפון</Label><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></div>
                <div><Label htmlFor="email">דוא"ל</Label><Input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
                <div className="md:col-span-2"><Label htmlFor="address">כתובת</Label><Input name="address" value={formData.address} onChange={handleChange} /></div>
                <div><Label htmlFor="licenseNumber">מספר רישיון נהיגה</Label><Input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} /></div>
                <div><Label htmlFor="licenseValidUntil">רישיון בתוקף עד</Label><Input type="date" name="licenseValidUntil" value={formData.licenseValidUntil} onChange={handleChange} /></div>
            </div>
            <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-200 mt-6">
                <Button type="button" onClick={closeModal} variant="default">ביטול</Button>
                <Button type="submit" disabled={isLoading} className="bg-violet-500 hover:bg-violet-600 focus:ring-violet-500 text-white">שמור</Button>
            </div>
        </form>
    );
};

const RentalsPage = ({ openModal, showNotification, userId }) => {
    const [rentals, setRentals] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('active');
    const [sortConfig, setSortConfig] = useState({ key: 'pickupTimestamp', direction: 'desc' });

    const fetchAllData = useCallback(async () => {
        if (!userId) return; setLoading(true);
        try {
            const [rentalsSnap, vehiclesSnap, customersSnap, branchesSnap] = await Promise.all([
                getDocs(collection(db, getCollectionPath('rentals'))),
                getDocs(collection(db, getCollectionPath('vehicles'))),
                getDocs(collection(db, getCollectionPath('customers'))),
                getDocs(collection(db, getCollectionPath('branches')))
            ]);
            const vehiclesData = vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const customersData = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const branchesData = branchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const populatedRentals = rentalsSnap.docs.map(d => {
                const rental = { id: d.id, ...d.data() };
                rental.vehicle = vehiclesData.find(v => v.id === rental.vehicleId);
                rental.customer = customersData.find(c => c.id === rental.customerId);
                rental.pickupBranch = branchesData.find(b => b.id === rental.pickupBranchId);
                rental.expectedReturnBranch = branchesData.find(b => b.id === rental.expectedReturnBranchId);
                return rental;
            });
            setRentals(populatedRentals);
            setVehicles(vehiclesData);
            setCustomers(customersData);
            setBranches(branchesData);
        } catch (error) { showNotification('error', 'שגיאה בטעינת נתונים.'); }
        setLoading(false);
    }, [userId, showNotification]);

    useEffect(() => {
        const unsubs = [
            onSnapshot(collection(db, getCollectionPath('rentals')), fetchAllData),
            onSnapshot(collection(db, getCollectionPath('vehicles')), fetchAllData),
            onSnapshot(collection(db, getCollectionPath('customers')), fetchAllData),
        ];
        return () => unsubs.forEach(unsub => unsub());
    }, [fetchAllData]);

    const handleSort = (key) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const handleMarkAsReturned = async (rental) => {
        openModal('confirmAction', {
            onConfirm: async () => {
                try {
                    const batch = writeBatch(db);
                    batch.update(doc(db, getCollectionPath('rentals'), rental.id), { status: 'completed', actualReturnTimestamp: serverTimestamp() });
                    batch.update(doc(db, getCollectionPath('vehicles'), rental.vehicleId), { status: 'available' });
                    await batch.commit();
                    showNotification('success', 'ההשכרה סומנה כהחזרה.');
                } catch (error) { showNotification('error', 'שגיאה בסימון החזרה.'); }
            },
            confirmText: "כן, סמן כהחזרה", confirmVariant: 'secondary'
        }, null, `האם לסמן את השכרת רכב ${rental.vehicle?.licensePlate} כהחזרה?`, "אישור החזרת רכב");
    };
    
    const cancelRental = async (rental) => {
        openModal('confirmAction', {
            onConfirm: async () => {
                try {
                    const batch = writeBatch(db);
                    batch.update(doc(db, getCollectionPath('rentals'), rental.id), { status: 'cancelled', updatedAt: serverTimestamp() });
                    if (rental.status === 'active' || new Date(rental.pickupTimestamp.seconds * 1000) > new Date()) {
                        batch.update(doc(db, getCollectionPath('vehicles'), rental.vehicleId), { status: 'available' });
                    }
                    await batch.commit();
                    showNotification('success', 'ההשכרה בוטלה.');
                } catch (error) { showNotification('error', 'שגיאה בביטול ההשכרה.'); }
            },
            confirmText: "כן, בטל השכרה", confirmVariant: 'warning'
        }, null, `האם לבטל את ההשכרה לרכב ${rental.vehicle?.licensePlate}?`, "אישור ביטול השכרה");
    };

    const sortedRentals = useMemo(() => {
        let R = [...rentals];
        R = R.filter(r => view === 'active' ? r.status === 'active' : (view === 'history' ? ['completed', 'cancelled'].includes(r.status) : true));
        R.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return R;
    }, [rentals, view, sortConfig]);

    if (loading && rentals.length === 0) return <FullScreenLoader message="טוען השכרות..." />;

    return (
        <div className="container mx-auto">
             <div className="mb-6 p-5 bg-white rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">ניהול השכרות</h1>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Select value={view} onChange={(e) => setView(e.target.value)} className="w-full sm:w-auto">
                        <option value="active">השכרות פעילות</option>
                        <option value="history">היסטוריית השכרות</option>
                        <option value="availableVehicles">רכבים זמינים</option>
                        <option value="rentedVehicles">רכבים מושכרים</option>
                    </Select>
                    <Button onClick={() => openModal('addRental', null, fetchAllData)} className="bg-rose-500 hover:bg-rose-600 focus:ring-rose-500 text-white" icon={<CalendarPlus size={16}/>}>השכרה חדשה</Button>
                </div>
            </div>
            
            {(view === 'active' || view === 'history') && (
                sortedRentals.length === 0 ? <EmptyState title={view === 'active' ? "אין השכרות פעילות" : "אין היסטוריית השכרות"} message="..."/> :
                <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">רכב</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">לקוח</th>
                                <SortableTableHeader sortKey="pickupTimestamp" currentSort={sortConfig} onSort={handleSort}>איסוף</SortableTableHeader>
                                <SortableTableHeader sortKey="expectedReturnTimestamp" currentSort={sortConfig} onSort={handleSort}>החזרה צפויה</SortableTableHeader>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">סטטוס</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                            {sortedRentals.map(rental => (
                                <tr key={rental.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">{rental.vehicle?.make} {rental.vehicle?.model} ({rental.vehicle?.licensePlate})</td>
                                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{rental.customer?.name}</td>
                                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{formatDate(rental.pickupTimestamp)}<br/><span className="text-xs text-slate-400">{rental.pickupBranch?.name}</span></td>
                                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{formatDate(rental.expectedReturnTimestamp)}<br/><span className="text-xs text-slate-400">{rental.expectedReturnBranch?.name}</span></td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">{/* Status Chip */}</td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                        <div className="flex items-center space-x-0.5 space-x-reverse">
                                            <Button onClick={() => openModal('viewRental', rental)} variant="ghost" size="sm" title="צפה"><Eye size={14}/></Button>
                                            {rental.status === 'active' && <Button onClick={() => handleMarkAsReturned(rental)} variant="ghost" size="sm" title="סמן כהחזרה" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"><CheckCircle size={14}/></Button>}
                                            {rental.status === 'active' && <Button onClick={() => cancelRental(rental)} variant="ghost" size="sm" title="בטל השכרה" className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"><XCircle size={14}/></Button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {view === 'availableVehicles' && <VehicleListView vehicles={vehicles.filter(v => v.status === 'available')} title="רכבים זמינים להשכרה" openModal={openModal} callbackAfterRental={fetchAllData} />}
            {view === 'rentedVehicles' && <VehicleListView vehicles={vehicles.filter(v => v.status === 'rented')} title="רכבים מושכרים כעת" openModal={openModal} rentals={rentals} customers={customers} />}
        </div>
    );
};
const RentalForm = ({ mode, rentalData, initialData, closeModal, showNotification, callback, userId }) => {
    const [formData, setFormData] = useState({
        vehicleId: '', customerId: '', pickupBranchId: '', expectedReturnBranchId: '',
        pickupTimestamp: formatDateTimeForInput(new Date()),
        expectedReturnTimestamp: formatDateTimeForInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        notes: '', status: 'active',
        ...(mode === 'edit' ? rentalData : initialData || {}),
        pickupTimestamp: formatDateTimeForInput(mode === 'edit' && rentalData?.pickupTimestamp ? rentalData.pickupTimestamp : (initialData?.pickupTimestamp || new Date())),
        expectedReturnTimestamp: formatDateTimeForInput(mode === 'edit' && rentalData?.expectedReturnTimestamp ? rentalData.expectedReturnTimestamp : (initialData?.expectedReturnTimestamp || new Date(Date.now() + 24 * 60 * 60 * 1000))),
    });
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [calculatedCost, setCalculatedCost] = useState(0);

    useEffect(() => { /* Fetch data for selects */ }, [userId, showNotification, mode, rentalData, initialData]);
    useEffect(() => { /* Calculate cost */ }, [formData.vehicleId, formData.pickupTimestamp, formData.expectedReturnTimestamp, availableVehicles, rentalData]);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = async (e) => { /* ... */ };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">{mode === 'add' ? 'יצירת השכרה חדשה' : 'עריכת פרטי השכרה'}</h2>
            {/* Form fields, calculated cost, buttons */}
        </form>
    );
};
const RentalDetails = ({ rentalData, closeModal, showNotification, userId, openModal }) => {
    const handlePrint = () => { openModal('printRental', rentalData); };
    return (
        <div className="p-1">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800">פרטי השכרה</h2>
                <Button onClick={handlePrint} variant="ghost" icon={<Printer size={16}/>}>הדפס</Button>
            </div>
            {/* Detailed rental information */}
            <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-200 mt-6">
                <Button onClick={closeModal} variant="default">סגור</Button>
            </div>
        </div>
    );
};

const PrintRentalDetails = ({ rentalData, closeModal }) => {
    useEffect(() => {
        const timer = setTimeout(() => { window.print(); closeModal(); }, 500);
        return () => clearTimeout(timer);
    }, [closeModal]);
    if (!rentalData) return null;
    return (
        <div className="p-8 print-container bg-white text-black">
            <style>{`@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; font-size: 12pt; } }`}</style>
            <div className="print-header">סיכום פרטי השכרה</div>
            {/* Print details */}
        </div>
    );
};

const VehicleListView = ({ vehicles, title, openModal, callbackAfterRental, rentals, customers }) => {
    if (!vehicles || vehicles.length === 0) {
        return <EmptyState title={title} message="לא נמצאו רכבים בקטגוריה זו." icon={<Car size={48} />} />;
    }
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-5 text-slate-700">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vehicles.map(vehicle => {
                    const rentalInfo = vehicle.status === 'rented' && rentals ? rentals.find(r => r.vehicleId === vehicle.id && r.status === 'active') : null;
                    const customerInfo = rentalInfo && customers ? customers.find(c => c.id === rentalInfo.customerId) : null;
                    return (
                        <div key={vehicle.id} className={`bg-white p-4 rounded-xl shadow-lg border-l-4 ${vehicle.status === 'available' ? 'border-emerald-500' : 'border-rose-500'} hover:shadow-xl transition-shadow duration-200 flex flex-col`}>
                            {vehicle.imageUrl ? 
                                <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-40 object-cover rounded-lg mb-3 shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/e2e8f0/94a3b8?text=אין+תמונה"; }} />
                                : <div className="w-full h-40 bg-slate-200 rounded-lg mb-3 flex items-center justify-center text-slate-400"><ImageOff size={32}/></div>
                            }
                            <h3 className="text-md font-semibold text-slate-800">{vehicle.make} {vehicle.model}</h3>
                            <p className="text-xs text-slate-500 mb-1">({vehicle.licensePlate}) - {vehicle.year}</p>
                            <p className="text-xs text-slate-600 mb-2">תעריף: <span className="font-medium">₪{parseFloat(vehicle.dailyRate || 0).toFixed(2)}</span> ליום</p>
                            
                            {vehicle.status === 'rented' && rentalInfo && (
                                <div className="mt-auto pt-2 border-t border-slate-200 text-xs">
                                <p className="text-rose-600 font-medium">מושכר ל: {customerInfo?.name || 'לא ידוע'}</p>
                                <p className="text-slate-500">החזרה: {formatDate(rentalInfo.expectedReturnTimestamp, {dateStyle:'short'})}</p>
                                </div>
                            )}
                            {vehicle.status === 'available' && (
                                <Button 
                                onClick={() => openModal('addRental', { vehicleId: vehicle.id }, callbackAfterRental)}
                                variant="secondary" size="sm" icon={<CalendarPlus size={14}/>} className="w-full mt-auto">
                                השכר רכב זה
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { userId, isAuthReady } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const showNotification = (type, message) => {
    const newNotification = { type, message, id: Date.now() };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const openModal = (type, data = null, callback = null, message = null, title = null) => {
    setModalContent({ type, data, callback, message, title });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  if (!isAuthReady) {
    return <FullScreenLoader message="מאמת פרטי משתמש..." />;
  }
  
  if (!userId) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-700 p-4">
        <div className="text-center p-10 bg-white rounded-lg shadow-xl border border-red-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <p className="text-2xl font-semibold mb-2">בעיית אימות</p>
          <p className="text-md">לא הצלחנו לאמת את פרטי המשתמש שלך. נסה לרענן את הדף.</p>
          <p className="text-sm mt-4 text-gray-500">UserID: לא זמין</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    const props = { openModal, showNotification, userId, setCurrentPage };
    switch (currentPage) {
      case 'dashboard': return <DashboardPage {...props} />;
      case 'vehicles': return <VehiclesPage {...props} />;
      case 'branches': return <BranchesPage {...props} />;
      case 'customers': return <CustomersPage {...props} />;
      case 'rentals': return <RentalsPage {...props} />;
      default: return <DashboardPage {...props} />;
    }
  };

  const renderModalContent = () => {
    if (!modalContent) return null;
    const { type, data, callback, message, title } = modalContent;
    const commonProps = { closeModal, showNotification, callback, userId };

    switch (type) {
      case 'addVehicle': return <VehicleForm mode="add" {...commonProps} />;
      case 'editVehicle': return <VehicleForm mode="edit" vehicleData={data} {...commonProps} />;
      case 'addBranch': return <BranchForm mode="add" {...commonProps} />;
      case 'editBranch': return <BranchForm mode="edit" branchData={data} {...commonProps} />;
      case 'addCustomer': return <CustomerForm mode="add" {...commonProps} />;
      case 'editCustomer': return <CustomerForm mode="edit" customerData={data} {...commonProps} />;
      case 'addRental': return <RentalForm mode="add" initialData={data} {...commonProps} />;
      case 'editRental': return <RentalForm mode="edit" rentalData={data} {...commonProps} />;
      case 'viewRental': return <RentalDetails rentalData={data} closeModal={closeModal} showNotification={showNotification} userId={userId} openModal={openModal} />;
      case 'confirmAction': return <ConfirmationModal title={title} message={message} onConfirm={data.onConfirm} onCancel={closeModal} confirmText={data.confirmText} confirmVariant={data.confirmVariant} />;
      case 'printRental': return <PrintRentalDetails rentalData={data} closeModal={closeModal} />;
      default: return null;
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col">
      <Navbar setCurrentPage={setCurrentPage} currentPage={currentPage} userId={userId} />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>
      {showModal && <Modal onClose={closeModal} size={modalContent?.type === 'printRental' ? 'lg' : 'default'}>{renderModalContent()}</Modal>}
      <div className="fixed bottom-5 right-5 z-[100] space-y-3">
        {notifications.map(n => (
          <Notification key={n.id} type={n.type} message={n.message} onClose={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))} />
        ))}
      </div>
    </div>
  );
};

export default App;