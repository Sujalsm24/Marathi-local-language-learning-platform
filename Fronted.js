import React, { createContext, useState, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import axios from 'axios';

// 1. GLOBAL CORE CONFIGS & AXIOS INTERCEPTORS
const API = axios.create({ baseURL: 'https://localhost:7001/api' });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('user'));
  
  const login = (t, u) => { setToken(t); setUser(u); localStorage.setItem('token', t); localStorage.setItem('user', u); };
  const logout = () => { setToken(null); setUser(null); localStorage.clear(); };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// 2. ROUTE PROTECTOR SECURITY GUARDS
const ProtectedRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// 3. UI COMPONENTS VIEWS
const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold text-amber-400">शिका मराठी (Learn Marathi)</h1>
      <div className="flex gap-4 items-center">
        <Link to="/" className="hover:text-amber-300">Lessons</Link>
        <Link to="/leaderboard" className="hover:text-amber-300">Leaderboard</Link>
        <span className="text-sm bg-slate-800 px-3 py-1 rounded border border-slate-700">Namaste, {user || 'Guest'}</span>
        <button onClick={logout} className="bg-rose-600 hover:bg-rose-700 text-xs px-3 py-1 rounded font-medium transition-colors">Logout</button>
      </div>
    </nav>
  );
};

const LoginView = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { email, password, fullName: '' });
      login(res.data.token, res.data.user);
    } catch { alert('Invalid auth credential tokens.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Sign In</h2>
        <input type="email" placeholder="Email Address" onChange={e => setEmail(e.target.value)} className="w-full mb-4 p-3 border border-slate-200 rounded-xl" required />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} className="w-full mb-6 p-3 border border-slate-200 rounded-xl" required />
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">Login</button>
      </form>
    </div>
  );
};

const LessonsView = () => {
  const [lessons, setLessons] = useState([]);
  useEffect(() => { API.get('/lessons/1').then(res => setLessons(res.data)).catch(err => console.log(err)); }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-8">Available Marathi Modules</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {lessons.map(lesson => (
          <div key={lesson.lessonID} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{lesson.title}</h3>
              <p className="text-slate-600 text-sm mb-6">{lesson.description}</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">शिका (Start Learning)</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const LeaderboardView = () => {
  const [ranks, setRanks] = useState([]);
  useEffect(() => { API.get('/leaderboard').then(res => setRanks(res.data)).catch(err => console.log(err)); }, []);

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl shadow-lg border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">🏆 Leaderboard Rankings</h2>
      <div className="divide-y divide-slate-100">
        {ranks.map((u, i) => (
          <div key={u.userId} className="flex justify-between py-3">
            <span className="font-medium text-slate-700">#{i+1} {u.fullName}</span>
            <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-md font-bold text-sm">{u.totalPoints} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. MAIN INTERACTIVE APP CONTAINER RUNNER
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<><Navigation /><LessonsView /></>} />
            <Route path="/leaderboard" element={<><Navigation /><LeaderboardView /></>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
