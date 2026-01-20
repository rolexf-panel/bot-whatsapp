import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
const socket = io();

export default function QRPage() {
  const [qr, setQr] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    socket.on('qr', data => setQr(data.dataUrl));
    socket.on('ready', () => setReady(true));
    socket.on('auth_failure', () => alert('Auth failure, please re-pair'));
    return () => { socket.off('qr'); socket.off('ready'); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Pairing WhatsApp Companion</h2>
        {!ready ? (
          <>
            {qr ? <img src={qr} alt="QR Code" className="mx-auto" /> : <div className="h-48 flex items-center justify-center">Menunggu QR…</div>}
            <p className="mt-4 text-sm text-slate-600">Scan QR dengan WhatsApp di ponsel Anda.</p>
          </>
        ) : (
          <div className="text-green-600">Bot siap dan terhubung ✅</div>
        )}
      </div>
    </div>
  );
}
