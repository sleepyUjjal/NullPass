import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateKeys, generateDeviceId, signData } from '../utils/crypto';
import api from '../services/api';

export default function Authenticate() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Initializing...');
  const [logs, setLogs] = useState([]);
  
  // LOCK: Prevents double-execution in React Strict Mode
  const hasRun = useRef(false);

  const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`]);

  useEffect(() => {
    const performAuthAction = async () => {
      // 1. Prevent Double Run
      if (hasRun.current) return;
      hasRun.current = true;

      const action = searchParams.get('action');
      const challengeId = searchParams.get('challenge_id');
      const nonce = searchParams.get('nonce') || ''; 

      // ------------------------------------------
      // FLOW 1: ENROLLMENT
      // ------------------------------------------
      if (action === 'enroll') {
        try {
          addLog("Generating New Key Pair...");
          const { pubPem, privBase64 } = await generateKeys();
          
          const deviceId = generateDeviceId();
          const deviceName = "Browser Device " + Math.floor(Math.random() * 1000);

          addLog(`Device ID: ${deviceId}`);
          addLog("Registering with Server...");

          // 1. Register Device
          const enrollRes = await api.finalizeEnrollment({
            device_id: deviceId,
            public_key: pubPem,
            device_name: deviceName
          });

          if (enrollRes.data.success) {
            localStorage.setItem('nullpass_device_id', deviceId);
            localStorage.setItem('nullpass_private_key', privBase64);
            localStorage.setItem('nullpass_device_name', deviceName);
            
            addLog("Device Registered Successfully.");

            // 2. Mark QR as Used (If challenge_id exists)
            if (challengeId) {
                addLog(`Finalizing Enrollment Session (${challengeId.substring(0,8)}...)...`);
                
                const signature = await signData(privBase64, challengeId + nonce);
                
                // Send Verification
                await api.verifySignature({
                    challenge_id: challengeId,
                    device_id: deviceId,
                    signature: signature
                });
                
                addLog("Session Finalized.");
            } else {
                addLog("WARNING: No Challenge ID found in URL. Registration okay, but screen won't redirect.");
            }

            setStatus("SUCCESS: Device Enrolled!");
          }
        } catch (err) {
          console.error(err);
          setStatus("ERROR: Enrollment Failed");
          addLog(err.response?.data?.error || err.message);
        }
      }

      // ------------------------------------------
      // FLOW 2: LOGIN
      // ------------------------------------------
      else if (challengeId) {
        try {
          const deviceId = localStorage.getItem('nullpass_device_id');
          const privKey = localStorage.getItem('nullpass_private_key');

          if (!deviceId || !privKey) {
            setStatus("ERROR: Device Not Enrolled");
            addLog("Please scan the Enrollment QR first.");
            return;
          }

          addLog(`Signing Challenge...`);
          const signature = await signData(privKey, challengeId + nonce);

          addLog("Verifying with Server...");
          const res = await api.verifySignature({
            challenge_id: challengeId,
            device_id: deviceId,
            signature: signature
          });

          if (res.data.success) {
            setStatus("SUCCESS: Authenticated!");
            addLog("You can check the main tab now.");
          }
        } catch (err) {
          setStatus("ERROR: Authentication Failed");
          addLog(err.response?.data?.error || err.message);
        }
      }
      
      else {
        setStatus("Waiting for QR Scan...");
      }
    };

    performAuthAction();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black text-green-400 p-8 font-mono text-sm">
      <div className="max-w-md mx-auto border border-green-800 p-6 rounded shadow-[0_0_20px_rgba(0,255,0,0.1)]">
        <h1 className="text-xl font-bold mb-4 border-b border-green-800 pb-2">NULLPASS_AUTHENTICATOR_V1</h1>
        
        <div className="mb-6">
          <span className="text-gray-500">STATUS:</span>
          <span className={`ml-2 font-bold ${status.includes('ERROR') ? 'text-red-500' : 'text-white'}`}>
            {status}
          </span>
        </div>

        <div className="bg-gray-900 p-4 rounded h-64 overflow-y-auto text-xs">
          {logs.map((log, i) => (
            <div key={i} className="mb-1 opacity-80">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}