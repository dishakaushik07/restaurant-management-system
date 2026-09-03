'use client';

import { useEffect, useRef, useState } from 'react';
import { sendNudge } from './api';

// Since we use the public opencv.js script, it attaches to window.cv
declare global {
  interface Window {
    cv: any;
  }
}

interface CameraPanelProps {
  ip: string | undefined;
  targetMarkerId: number | null;
}

export function CameraPanel({ ip, targetMarkerId }: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Camera offline');
  const frameRequestRef = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setStatusMsg('Searching for markers...');
        })
        .catch((err) => {
          console.error('Error accessing camera', err);
          setStatusMsg('Error accessing camera');
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [cameraActive]);

  useEffect(() => {
    if (!cameraActive || !window.cv) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const cv = window.cv;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const src = cv.imread(canvas);
            const dictionary = new cv.aruco_Dictionary(cv.DICT_4X4_50);
            const markerCorners = new cv.MatVector();
            const markerIds = new cv.Mat();
            const parameters = new cv.aruco_DetectorParameters();

            cv.detectMarkers(src, dictionary, markerCorners, markerIds, parameters);

            if (markerIds.rows > 0) {
              cv.drawDetectedMarkers(src, markerCorners, markerIds);
              
              // check if target is found
              let foundTarget = false;
              for (let i = 0; i < markerIds.rows; i++) {
                const id = markerIds.data32S[i];
                if (targetMarkerId !== null && id === targetMarkerId) {
                  foundTarget = true;
                  
                  // simple heuristic for left/right based on center of marker
                  const corners = markerCorners.get(i).data32F;
                  // corners array [x1,y1, x2,y2, x3,y3, x4,y4]
                  const centerX = (corners[0] + corners[2] + corners[4] + corners[6]) / 4;
                  const imgCenterX = canvas.width / 2;

                  if (centerX < imgCenterX - 50) {
                    setStatusMsg(`Marker ${id} detected — Nudging Left`);
                    if (ip) sendNudge(ip, 'left', 'small');
                  } else if (centerX > imgCenterX + 50) {
                    setStatusMsg(`Marker ${id} detected — Nudging Right`);
                    if (ip) sendNudge(ip, 'right', 'small');
                  } else {
                    setStatusMsg(`Arrived at Table ${id}`);
                    // might send stop or confirm arrival here depending on logic
                  }
                }
              }

              if (!foundTarget && targetMarkerId !== null) {
                setStatusMsg(`Searching for marker ${targetMarkerId}...`);
              } else if (targetMarkerId === null) {
                 setStatusMsg(`Detected markers: ${Array.from(markerIds.data32S).join(', ')}`);
              }
            } else {
              if (targetMarkerId !== null) setStatusMsg(`Searching for marker ${targetMarkerId}...`);
              else setStatusMsg('Searching for markers...');
            }

            cv.imshow(canvas, src);
            src.delete();
            dictionary.delete();
            markerCorners.delete();
            markerIds.delete();
            parameters.delete();
          } catch (err) {
            // OpenCV not ready or error
            console.error('OpenCV frame processing error', err);
          }
        }
      }
      frameRequestRef.current = requestAnimationFrame(processFrame);
    };

    frameRequestRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [cameraActive, targetMarkerId, ip]);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/50">
        <h3 className="font-bold uppercase tracking-wider text-sm">Vision System</h3>
        <button
          onClick={() => setCameraActive(!cameraActive)}
          className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
            cameraActive ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
          }`}
        >
          {cameraActive ? 'Stop Camera' : 'Start Camera'}
        </button>
      </div>
      
      <div className="flex-1 bg-black relative min-h-[200px] flex items-center justify-center">
        {!cameraActive ? (
          <div className="text-gray-600 uppercase text-sm font-bold tracking-widest text-center px-4">
            Camera offline<br/><span className="text-xs font-normal text-gray-700 mt-2 block">Enable for ArUco Marker Navigation</span>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </>
        )}
      </div>

      <div className="p-3 bg-gray-950 text-xs font-mono text-gray-400 border-t border-gray-900 truncate">
        &gt; {statusMsg}
      </div>
    </div>
  );
}
