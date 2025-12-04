import React, { useState } from 'react';
import './PasswordModal.css';

const PasswordModal = ({ isOpen, onClose, onSubmit, moduleName }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await onSubmit(password);
    
    setLoading(false);
    
    if (!success) {
      setError('ACCESS DENIED');
      setPassword('');
    } else {
      setPassword('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-black border-4 border-[#333] p-1 w-full max-w-md shadow-[0_0_50px_rgba(0,255,0,0.2)] font-mono">
        {/* Outer Bezel */}
        <div className="border-2 border-[#1a1a1a] p-6 relative overflow-hidden">
          
          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')]"></div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-[#333] text-xs mb-2">*** SECURITY CHECKPOINT ***</div>
            <h2 className="text-2xl font-bold text-green-500 tracking-widest glitch-text">
              ACCESS CONTROL
            </h2>
            <div className="text-green-500/50 text-xs mt-1">
              MODULE: {moduleName}
            </div>
          </div>

          {/* Terminal Input Area */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#0a0a0a] border border-green-900/50 p-4 font-mono text-lg relative">
              <div className="flex items-center text-green-500 mb-2 text-xs opacity-70">
                <span>C:\SYSTEM\AUTH&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 animate-pulse">{'>'}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="bg-transparent border-none outline-none text-green-500 w-full font-bold tracking-[0.5em] placeholder-green-900/30"
                  placeholder="PASSWORD"
                  autoFocus
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-xs font-bold text-center animate-pulse bg-red-900/10 p-2 border border-red-900/30">
                [!] ACCESS DENIED: INVALID CREDENTIALS
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-[#333]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-[#1a1a1a] text-gray-500 hover:bg-[#2a2a2a] hover:text-gray-300 transition-colors text-xs font-bold border border-[#333]"
              >
                [ ABORT ]
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-green-900/20 text-green-500 hover:bg-green-500 hover:text-black transition-all text-xs font-bold border border-green-900/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
              >
                {loading ? '[ VERIFYING... ]' : '[ EXECUTE ]'}
              </button>
            </div>
          </form>
          
          {/* Footer */}
          <div className="mt-6 text-center text-[#333] text-[10px]">
            SECURE TERMINAL V.3.1 // UNAUTHORIZED ACCESS IS PROHIBITED
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
