
import React, { useState } from 'react';
import { LiffProfile } from '../types';

interface HeaderProps {
  profile: LiffProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  isLiffInit: boolean;
  liffError: boolean;
  isAuthorized: boolean | null;
}

const Header: React.FC<HeaderProps> = ({ profile, onLogin, onLogout, isLiffInit, liffError, isAuthorized }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#06C755] rounded-lg flex items-center justify-center shadow-lg shadow-[#06C755]/20">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 10.3c0-4.6-4.9-8.3-11-8.3C6.9 2 2 5.7 2 10.3c0 4.1 3.9 7.5 9.2 8.1l-1.3 3.9 4.3-2.6h1.8c6.1 0 11-3.7 11-8.1z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-none">
              Rich Menu Studio
            </span>
            {/* <span className="text-[10px] font-bold text-[#06C755] tracking-tighter uppercase mt-0.5">
              by Punnathat.k
            </span> */}
          </div>
        </div>
        
        <div className="flex items-center space-x-5">
          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

          {profile ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-full transition-all group"
              >
                <div className={`w-8 h-8 rounded-full border-2 overflow-hidden shadow-sm transition-all ${isAuthorized === true ? 'border-[#06C755]/50' : isAuthorized === false ? 'border-red-500/50' : 'border-slate-200'}`}>
                  <img src={profile.pictureUrl || `https://ui-avatars.com/api/?name=${profile.displayName}`} alt={profile.displayName} className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-black text-slate-800">{profile.displayName}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${isAuthorized === true ? 'text-[#06C755]' : isAuthorized === false ? 'text-red-500' : 'text-slate-400'}`}>
                    {isAuthorized === true ? 'ตรวจสอบแล้ว' : isAuthorized === false ? 'ไม่มีสิทธิ์' : 'กำลังตรวจสอบ...'}
                  </span>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 animate-scaleUp overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">เข้าสู่ระบบ ด้วย Line</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{profile.displayName}</p>
                    </div>
                    <button 
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      ออกจากระบบ
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : liffError ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>เกิดข้อผิดพลาด</span>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              disabled={!isLiffInit}
              className={`bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg flex items-center gap-2 ${!profile ? 'animate-pulse ring-2 ring-[#06C755]/20' : ''}`}
            >
              {!isLiffInit && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 10.3c0-4.6-4.9-8.3-11-8.3C6.9 2 2 5.7 2 10.3c0 4.1 3.9 7.5 9.2 8.1l-1.3 3.9 4.3-2.6h1.8c6.1 0 11-3.7 11-8.1z" />
              </svg>
              <span>{isLiffInit ? 'เข้าสู่ระบบ' : 'กำลังเตรวจสอบ...'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
