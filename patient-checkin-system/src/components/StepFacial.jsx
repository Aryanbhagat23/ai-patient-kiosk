import React, { useEffect } from 'react';
import { Video, Loader2 } from 'lucide-react';

export default function StepFacial({ t, isProcessing, scanStatus, isCameraReady, videoRef, canvasRef, handleAIScan }) {
  useEffect(() => {
    let timer;
    if (isCameraReady && !isProcessing) {
       timer = setTimeout(() => {
         if (canvasRef.current && videoRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
            handleAIScan(canvasRef.current.toDataURL('image/jpeg', 0.8));
         }
       }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isCameraReady, isProcessing, canvasRef, videoRef, handleAIScan]);

  return (
    <div className="text-center">
      <Video className="w-20 h-20 mx-auto mb-6 text-blue-600 animate-pulse" />
      <h2 className="text-2xl font-bold mb-3">AI Face Recognition</h2>
      <p className="text-gray-600 mb-6">{t.lookAtCamera}</p>
      <div className="relative mx-auto rounded-lg overflow-hidden shadow-2xl max-w-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full bg-black" style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} className="hidden" />
        {/* Visual overlay for face area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="border-4 border-blue-500/50 w-1/2 h-2/3 rounded-xl"></div>
        </div>
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />{scanStatus}
          </div>
        )}
      </div>
      <div className="mt-6 text-blue-600 font-semibold">{scanStatus}</div>
    </div>
  );
}