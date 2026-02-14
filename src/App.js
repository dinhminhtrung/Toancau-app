import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  User, 
  Lock, 
  Plus, 
  History, 
  Clock, 
  LogOut, 
  Users, 
  TrendingDown, 
  Calendar,
  CheckCircle2,
  Globe,
  Award,
  ChevronRight,
  KeyRound,
  X,
  Settings
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'toan-cau-bidding-final';

const GlobalLogo = ({ className }) => (
  <svg viewBox="0 0 200 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="50" r="35" stroke="currentColor" strokeWidth="2" />
    <path d="M40 15V85M15 50H65" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    <path d="M20 30C30 35 50 35 60 30M20 70C30 65 50 65 60 70" stroke="currentColor" strokeWidth="1.5" />
    <path d="M35 30L45 50L35 70" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <line x1="80" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />
    <text x="90" y="45" fill="currentColor" fontFamily="serif" fontWeight="bold" fontSize="22">GLOBAL AGRI FOOD</text>
    <text x="90" y="70" fill="currentColor" fontFamily="sans-serif" fontSize="14" letterSpacing="2">FEEL THE TASTE</text>
  </svg>
);

const theme = {
  primary: '#4a3728',
  secondary: '#8d7052',
  accent: '#3d5a45',
  bg: '#f4f1ea',
};

const App = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSelfChangePass, setShowSelfChangePass] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // ROOT ADMIN CHECK
    if (loginData.username === 'admin' && loginData.password === '1') {
      const rootData = { id: 'root-id', username: 'admin', role: 'admin', isRoot: true, name: 'Quản Trị Tối Cao' };
      setUserData(rootData);
      localStorage.setItem('toancau_auth', JSON.stringify(rootData));
      return;
    }

    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
      onSnapshot(usersRef, (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const found = usersList.find(u => u.username === loginData.username && u.password === loginData.password);
        if (found) {
          const data = { ...found, isRoot: false };
          setUserData(data);
          localStorage.setItem('toancau_auth', JSON.stringify(data));
        } else {
          setError('Tên đăng nhập hoặc mật khẩu sai');
        }
      });
    } catch (err) { setError("Lỗi máy chủ"); }
  };

  useEffect(() => {
    if (!user) return;
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), s => setSuppliers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'), s => setSessions(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'bids'), s => setBids(s.docs.map(d => ({id: d.id, ...d.data()}))));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('toancau_auth');
    if (saved) setUserData(JSON.parse(saved));
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold" style={{color: theme.primary}}>Đang khởi động...</div>;

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-t-8 border-amber-900">
          <div className="text-center mb-8">
            <GlobalLogo className="w-48 h-24 mx-auto mb-2 text-slate-800" />
            <h1 className="text-2xl font-black uppercase text-amber-900">Hệ Thống Toàn Cầu</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none" placeholder="Tên đăng nhập" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="password" className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none" placeholder="Mật khẩu" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            </div>
            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
            <button type="submit" className="w-full text-white font-bold py-3 rounded-xl bg-amber-900 hover:bg-amber-950 shadow-lg">ĐĂNG NHẬP</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: theme.bg }}>
      {/* Sidebar */}
      <div className="w-full md:w-72 text-white flex flex-col shadow-2xl" style={{ backgroundColor: theme.primary }}>
        <div className="p-6 border-b border-white/10 text-center">
          <div className="bg-white rounded-lg p-2 mb-2"><GlobalLogo className="w-full h-10 text-slate-900" /></div>
          <p className="text-xs font-bold text-amber-200">{userData.name}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Globe size={20}/>} label="Trang chủ" />
          {userData.role === 'admin' && (
            <>
              <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20}/>} label="Quản lý thành viên" />
              <SidebarItem active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} icon={<Plus size={20}/>} label="Phiên đấu thầu" />
              <SidebarItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20}/>} label="Lịch sử thầu" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button onClick={() => setShowSelfChangePass(true)} className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 text-sm font-bold text-amber-400 transition-all">
            <KeyRound size={16}/> Đổi mật khẩu của tôi
          </button>
          <button onClick={() => { localStorage.removeItem('toancau_auth'); setUserData(null); }} className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/20 text-sm font-bold text-red-200 transition-all">
            <LogOut size={16}/> Đăng xuất
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardView userData={userData} sessions={sessions} bids={bids} />}
        {activeTab === 'users' && <UserManagementView db={db} appId={appId} suppliers={suppliers} isRoot={userData.isRoot} />}
        {activeTab === 'sessions' && <SessionManagementView db={db} appId={appId} sessions={sessions} />}
        {activeTab === 'history' && <FullHistoryView bids={bids} />}
      </div>

      {/* Modal Tự đổi mật khẩu */}
      {showSelfChangePass && (
        <PasswordModal 
          title="Đổi mật khẩu của tôi"
          targetUser={userData}
          onClose={() => setShowSelfChangePass(false)}
          db={db}
          appId={appId}
          isSelf={true}
        />
      )}
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-white text-amber-900 shadow-lg' : 'text-amber-100 hover:bg-white/10'}`}>
    {icon} <span className="font-bold">{label}</span>
  </button>
);

const UserManagementView = ({ db, appId, suppliers, isRoot }) => {
  const [newU, setNewU] = useState({ username: '', password: '', name: '', role: 'ncc' });
  const [editUser, setEditUser] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), newU);
    setNewU({ username: '', password: '', name: '', role: 'ncc' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-lg border-t-4 border-emerald-600">
        <h2 className="text-xl font-black uppercase text-slate-800 mb-4">Tạo thành viên mới</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input type="text" placeholder="User" className="p-3 border rounded-xl" value={newU.username} onChange={e => setNewU({...newU, username: e.target.value})} required />
          <input type="text" placeholder="Pass" className="p-3 border rounded-xl" value={newU.password} onChange={e => setNewU({...newU, password: e.target.value})} required />
          <input type="text" placeholder="Tên đơn vị" className="p-3 border rounded-xl" value={newU.name} onChange={e => setNewU({...newU, name: e.target.value})} required />
          <select className="p-3 border rounded-xl font-bold" value={newU.role} onChange={e => setNewU({...newU, role: e.target.value})}>
            <option value="ncc">Nhà Cung Cấp</option>
            <option value="admin">Admin Phụ</option>
          </select>
          <button type="submit" className="bg-emerald-700 text-white font-bold rounded-xl shadow-lg">THÊM</button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-5 bg-slate-50 border-b font-black text-xs text-slate-400 uppercase tracking-[0.2em]">Danh sách đối tác & Admin</div>
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-50">
            {suppliers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 group transition-all">
                <td className="p-5 font-bold text-slate-800">
                   <div className="text-xs text-slate-400 uppercase mb-1">Username</div>
                   {u.username}
                </td>
                <td className="p-5 font-bold text-slate-600">
                   <div className="text-xs text-slate-400 uppercase mb-1">Tên Hiển Thị</div>
                   {u.name}
                </td>
                <td className="p-5">
                   <div className="text-xs text-slate-400 uppercase mb-1">Mật khẩu</div>
                   <span className="font-mono text-amber-600 font-bold">{u.password}</span>
                </td>
                <td className="p-5 text-right space-x-2">
                  {/* CHỈ ADMIN GỐC MỚI THẤY NÚT ĐỔI MẬT KHẨU CHO NGƯỜI KHÁC */}
                  {isRoot && (
                    <button 
                      onClick={() => setEditUser(u)} 
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                      <KeyRound size={14}/> ĐỔI PASS
                    </button>
                  )}
                  <button onClick={async () => { if(confirm("Xóa?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id)) }} className="p-2 text-red-400 hover:text-red-600"><X/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && (
        <PasswordModal 
          title="Thay đổi mật khẩu hệ thống"
          targetUser={editUser}
          onClose={() => setEditUser(null)}
          db={db}
          appId={appId}
          isSelf={false}
        />
      )}
    </div>
  );
};

const PasswordModal = ({ title, targetUser, onClose, db, appId, isSelf }) => {
  const [newVal, setNewVal] = useState('');
  
  const handleUpdate = async () => {
    if(!newVal) return;
    try {
      if (targetUser.username === 'admin' && isSelf) {
        alert("Lưu ý: Mật khẩu Admin gốc đang được cập nhật cục bộ. Nếu ứng dụng load lại, nó sẽ quay về '1' trừ khi bạn thay đổi trong mã nguồn.");
      } else {
        const uRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', targetUser.id);
        await updateDoc(uRef, { password: newVal });
      }
      alert("Cập nhật thành công!");
      onClose();
    } catch (e) { alert("Lỗi cập nhật"); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 border-t-8 border-blue-600">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings size={32} className="animate-spin-slow"/>
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{title}</h3>
          <p className="text-xs font-bold text-slate-400 mt-1">Đối tượng: {targetUser.name || targetUser.username}</p>
        </div>
        
        <input 
          type="text" className="w-full p-4 border-2 border-blue-100 rounded-2xl mb-6 outline-none focus:border-blue-500 font-black text-2xl text-center"
          placeholder="MẬT KHẨU MỚI" value={newVal} onChange={e => setNewVal(e.target.value)} autoFocus
        />
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600">HỦY</button>
          <button onClick={handleUpdate} className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200">XÁC NHẬN</button>
        </div>
      </div>
    </div>
  );
};

// ... Các View phụ giữ nguyên logic dừa ...
const DashboardView = ({ userData, sessions, bids }) => {
  const activeS = sessions.filter(s => {
    const now = new Date();
    return now >= new Date(s.startTime) && now <= new Date(s.endTime);
  });
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black italic uppercase text-amber-900 tracking-tighter">XIN CHÀO, {userData.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeS.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-3xl shadow-xl border relative overflow-hidden">
             <div className="absolute top-0 right-0 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-bl-xl">Đang diễn ra</div>
             <h3 className="text-2xl font-black uppercase text-amber-900">{s.name}</h3>
             <p className="text-xs font-bold text-slate-400 mb-6 uppercase">Tuần {s.week} | Kết thúc: {new Date(s.endTime).toLocaleString()}</p>
             {userData.role === 'ncc' && <p className="text-emerald-600 font-bold">Hãy nhập báo giá của bạn</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

const SessionManagementView = ({ db, appId, sessions }) => {
  const [newS, setNewS] = useState({ name: '', startTime: '', endTime: '', week: '01' });
  const handleS = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'), newS);
    setNewS({ name: '', startTime: '', endTime: '', week: '01' });
  };
  return (
    <div className="bg-white p-8 rounded-3xl shadow-lg border-t-4 border-amber-800">
      <h2 className="text-xl font-black uppercase mb-6">Mở phiên thầu</h2>
      <form onSubmit={handleS} className="space-y-4">
        <input type="text" placeholder="Tên hàng" className="w-full p-3 border rounded-xl" value={newS.name} onChange={e => setNewS({...newS, name: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <input type="datetime-local" className="p-3 border rounded-xl" value={newS.startTime} onChange={e => setNewS({...newS, startTime: e.target.value})} />
          <input type="datetime-local" className="p-3 border rounded-xl" value={newS.endTime} onChange={e => setNewS({...newS, endTime: e.target.value})} />
        </div>
        <button type="submit" className="w-full bg-amber-900 text-white font-black py-4 rounded-xl">KÍCH HOẠT</button>
      </form>
    </div>
  );
};

const FullHistoryView = ({ bids }) => (
  <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
    <div className="p-6 bg-slate-50 border-b font-black uppercase text-slate-400">Lịch sử thầu hệ thống</div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b text-slate-400 uppercase font-black text-[10px]">
          <tr><th className="p-4">Ngày</th><th className="p-4">NCC</th><th className="p-4">Mặt hàng</th><th className="p-4">Giá</th></tr>
        </thead>
        <tbody>
          {bids.map(b => (
            <tr key={b.id} className="border-b"><td className="p-4">{new Date(b.timestamp).toLocaleDateString()}</td><td className="p-4 font-bold">{b.supplierName}</td><td className="p-4">{b.sessionName}</td><td className="p-4 font-black text-emerald-600">{b.price?.toLocaleString()}đ</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default App;
