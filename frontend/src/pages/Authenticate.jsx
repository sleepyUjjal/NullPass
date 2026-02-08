import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateKeys, generateDeviceId, signData } from '../utils/crypto';
import api from '../services/api';
import { ShieldCheck, Smartphone, ArrowRight, Loader2 } from 'lucide-react';

export default function Authenticate() {
  const [searchParams] = useSearchParams();
  
  // UI States
  const [step, setStep] = useState('INIT'); // INIT, NAME_INPUT, PROCESSING, SUCCESS, ERROR
  const [statusMsg, setStatusMsg] = useState('Initializing...');
  const [logs, setLogs] = useState([]);
  const [deviceName, setDeviceName] = useState('');
  
  // Logic Refs
  const hasRun = useRef(false);
  const action = searchParams.get('action');
  const challengeId = searchParams.get('challenge_id');
  const nonce = searchParams.get('nonce') || '';

  const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`]);

  // 1. Initial Check on Mount
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    checkDeviceStatus();
  }, []);

  const checkDeviceStatus = () => {
    const existingId = localStorage.getItem('nullpass_device_id');

    if (action === 'enroll') {
      if (existingId) {
        setStep('ERROR');
        setStatusMsg("Device Already Enrolled");
        addLog(`Found existing ID: ${existingId}`);
        addLog("To re-enroll, clear your browser data.");
      } else {
        // Not enrolled? Great, ask for name.
        setStep('NAME_INPUT');
        setStatusMsg("New Device Detected");
      }
    } 
    else if (challengeId) {
      // Login Flow - Proceed immediately
      setStep('PROCESSING');
      performLogin(challengeId, nonce);
    }
  };

  // 2. Handle Enrollment (User clicked "Register")
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    setStep('PROCESSING');
    setStatusMsg("Registering Device...");
    
    try {
      addLog("Generating New Key Pair...");
      const { pubPem, privBase64 } = await generateKeys();
      
      const deviceId = generateDeviceId();
      addLog(`Device ID: ${deviceId}`);

      // Register with Server
      const enrollRes = await api.finalizeEnrollment({
        device_id: deviceId,
        public_key: pubPem,
        device_name: deviceName // Use user input
      });

      if (enrollRes.data.success) {
        localStorage.setItem('nullpass_device_id', deviceId);
        localStorage.setItem('nullpass_private_key', privBase64);
        localStorage.setItem('nullpass_device_name', deviceName);
        
        addLog("Device Registered Successfully.");

        // If this enrollment was triggered by a QR scan (has challenge_id), verify it now
        if (challengeId && challengeId !== 'undefined') {
            addLog("Finalizing Enrollment Session...");
            const signature = await signData(privBase64, challengeId + nonce);
            await api.verifySignature({
                challenge_id: challengeId,
                device_id: deviceId,
                signature: signature
            });
            addLog("Session Finalized.");
        }

        setStep('SUCCESS');
        setStatusMsg("Device Enrolled!");
      }
    } catch (err) {
      setStep('ERROR');
      setStatusMsg("Enrollment Failed");
      addLog(err.response?.data?.error || err.message);
    }
  };

  // 3. Handle Login (Automatic)
  const performLogin = async (cId, n) => {
    try {
      const deviceId = localStorage.getItem('nullpass_device_id');
      const privKey = localStorage.getItem('nullpass_private_key');

      if (!deviceId || !privKey) {
        setStep('ERROR');
        setStatusMsg("Device Not Enrolled");
        addLog("Please scan the Enrollment QR first.");
        return;
      }

      addLog(`Signing Challenge...`);
      const signature = await signData(privKey, cId + n);

      addLog("Verifying with Server...");
      const res = await api.verifySignature({
        challenge_id: cId,
        device_id: deviceId,
        signature: signature
      });

      if (res.data.success) {
        setStep('SUCCESS');
        setStatusMsg("Authenticated!");
      }
    } catch (err) {
      setStep('ERROR');
      setStatusMsg("Authentication Failed");
      addLog(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-8 font-mono text-sm flex items-center justify-center">
      <div className="w-full max-w-md border border-green-800 p-6 rounded shadow-[0_0_20px_rgba(0,255,0,0.1)] bg-gray-900/50 backdrop-blur">
        
        <h1 className="text-xl font-bold mb-6 border-b border-green-800 pb-2 flex items-center gap-2">
           <ShieldCheck size={20}/> NULLPASS_AUTHENTICATOR
        </h1>

        {/* --- STEP: NAME INPUT --- */}
        {step === 'NAME_INPUT' && (
          <form onSubmit={handleEnrollSubmit} className="space-y-4">
            <div className="bg-green-900/20 p-4 rounded border border-green-800/50">
               <h2 className="text-white font-bold mb-2 flex items-center gap-2">
                 <Smartphone size={16}/> Setup New Device
               </h2>
               <p className="text-xs opacity-70 mb-4">
                 This browser will be registered as a trusted authenticator.
               </p>
               
               <label className="block text-xs uppercase text-gray-500 mb-1">Device Name</label>
               <input 
                 type="text" 
                 value={deviceName}
                 onChange={(e) => setDeviceName(e.target.value)}
                 placeholder="e.g. Chrome on MacBook"
                 className="w-full bg-black border border-green-700 rounded p-2 text-white focus:outline-none focus:border-green-400 transition-colors"
                 autoFocus
               />
            </div>
            <button 
              type="submit" 
              disabled={!deviceName.trim()}
              className="w-full py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Register Device <ArrowRight size={16}/>
            </button>
          </form>
        )}

        {/* --- STEP: PROCESSING / LOGS --- */}
        {(step === 'PROCESSING' || step === 'SUCCESS' || step === 'ERROR') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
               <span className="text-gray-500 text-xs uppercase">Status</span>
               <span className={`font-bold ${step === 'ERROR' ? 'text-red-500' : 'text-white'} flex items-center gap-2`}>
                 {step === 'PROCESSING' && <Loader2 className="animate-spin" size={12}/>}
                 {statusMsg}
               </span>
            </div>

            <div className="bg-black p-4 rounded h-48 overflow-y-auto text-xs font-mono border border-green-900/50 shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 opacity-80">{log}</div>
              ))}
            </div>
            
            {step === 'SUCCESS' && (
               <div className="text-center text-xs text-gray-500 mt-4">
                 You can close this tab now.
               </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}