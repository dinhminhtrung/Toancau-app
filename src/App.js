import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

const appId = "auction-app";

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bids, setBids] = useState([]);
  const [view, setView] = useState("dashboard");

  // Load data realtime
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "users"),
      snap => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubSessions = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "sessions"),
      snap => {
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubBids = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "bids"),
      snap => {
        setBids(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => {
      unsubUsers();
      unsubSessions();
      unsubBids();
    };
  }, []);

  if (!user) {
    return <Login users={users} setUser={setUser} />;
  }

  return (
    <div className="min-h-screen bg-amber-50 max-w-[480px] mx-auto">
      <Header user={user} setUser={setUser} setView={setView} />
      <div className="p-4">
        {view === "dashboard" && (
          <Dashboard
            user={user}
            sessions={sessions}
            bids={bids}
          />
        )}
        {view === "admin" && user.role === "admin" && (
          <Admin sessions={sessions} />
        )}
        {view === "history" && user.role === "admin" && (
          <FullHistory bids={bids} />
        )}
      </div>
    </div>
  );
}

/* ================= LOGIN ================= */

function Login({ users, setUser }) {
  const [name, setName] = useState("");

  const login = () => {
    const found = users.find(u => u.name === name);
    if (found) setUser(found);
    else alert("Sai tên đăng nhập");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-amber-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Đăng nhập</h1>
      <input
        className="border p-3 rounded-xl w-full mb-3"
        placeholder="Tên đăng nhập"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button
        onClick={login}
        className="bg-amber-700 text-white w-full py-3 rounded-xl font-bold"
      >
        Đăng nhập
      </button>
    </div>
  );
}

/* ================= HEADER ================= */

function Header({ user, setUser, setView }) {
  return (
    <div className="bg-amber-800 text-white p-4 flex justify-between items-center">
      <div className="font-bold">{user.name}</div>
      <div className="space-x-2">
        <button onClick={() => setView("dashboard")}>Trang chủ</button>
        {user.role === "admin" && (
          <>
            <button onClick={() => setView("admin")}>Quản lý</button>
            <button onClick={() => setView("history")}>Lịch sử</button>
          </>
        )}
        <button onClick={() => setUser(null)}>Đăng xuất</button>
      </div>
    </div>
  );
}

/* ================= DASHBOARD ================= */

function Dashboard({ user, sessions, bids }) {
  const [priceInput, setPriceInput] = useState({});

  const now = new Date();

  const activeSessions = sessions.filter(
  s => new Date(s.endTime) > new Date()
);


  const handleBid = async session => {
    if (!priceInput[session.id]) return alert("Nhập giá trước");

    await addDoc(
      collection(db, "artifacts", appId, "public", "data", "bids"),
      {
        sessionId: session.id,
        sessionName: session.name,
        supplierId: user.id,
        supplierName: user.name,
        price: Number(priceInput[session.id]),
        timestamp: new Date().toISOString()
      }
    );

    setPriceInput({ ...priceInput, [session.id]: "" });
    alert("Đã gửi giá");
  };

  const myBids = bids.filter(b => b.supplierId === user.id);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Phiên đang mở</h2>

      {activeSessions.map(s => (
        <div key={s.id} className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-bold text-amber-800">{s.name}</h3>
          <p className="text-sm text-gray-500">
            Kết thúc: {new Date(s.endTime).toLocaleString()}
          </p>

          {user.role === "ncc" && (
            <div className="mt-3 space-y-2">
              <input
                type="number"
                placeholder="Nhập giá"
                className="border w-full p-2 rounded-xl"
                value={priceInput[s.id] || ""}
                onChange={e =>
                  setPriceInput({
                    ...priceInput,
                    [s.id]: e.target.value
                  })
                }
              />
              <button
                onClick={() => handleBid(s)}
                className="bg-emerald-600 text-white w-full py-2 rounded-xl font-bold"
              >
                Gửi giá
              </button>
            </div>
          )}

          {user.role === "admin" && (
            <div className="mt-2 text-sm">
              Tổng giá bỏ thầu:{" "}
              {bids.filter(b => b.sessionId === s.id).length}
            </div>
          )}
        </div>
      ))}

      {user.role === "ncc" && (
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-bold mb-2">Lịch sử của bạn</h3>
          {myBids.map(b => (
            <div key={b.id} className="border-b py-1 text-sm">
              {b.sessionName} - {b.price.toLocaleString()}đ
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= ADMIN ================= */

function Admin({ sessions }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const createSession = async () => {
    if (!name || !start || !end) return alert("Nhập đủ thông tin");

    await addDoc(
      collection(db, "artifacts", appId, "public", "data", "sessions"),
      {
        name,
        startTime: start,
        endTime: end
      }
    );

    setName("");
    setStart("");
    setEnd("");
    alert("Đã tạo phiên");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Tạo phiên thầu</h2>

      <input
        className="border p-2 rounded-xl w-full"
        placeholder="Tên phiên"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <input
        type="datetime-local"
        className="border p-2 rounded-xl w-full"
        value={start}
        onChange={e => setStart(e.target.value)}
      />

      <input
        type="datetime-local"
        className="border p-2 rounded-xl w-full"
        value={end}
        onChange={e => setEnd(e.target.value)}
      />

      <button
        onClick={createSession}
        className="bg-amber-700 text-white w-full py-2 rounded-xl font-bold"
      >
        Tạo phiên
      </button>
    </div>
  );
}

/* ================= FULL HISTORY ================= */

function FullHistory({ bids }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h3 className="font-bold mb-3">Toàn bộ lịch sử</h3>
      {bids.map(b => (
        <div key={b.id} className="border-b py-1 text-sm">
          {b.sessionName} - {b.supplierName} -{" "}
          {b.price.toLocaleString()}đ
        </div>
      ))}
    </div>
  );
}
