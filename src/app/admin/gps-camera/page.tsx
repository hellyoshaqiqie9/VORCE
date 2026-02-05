"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GPSCameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"active" | "inactive" | "finding">("finding");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    startCamera();
    getLocation();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // Check if mediaDevices is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not available. Make sure you're using HTTPS.");
        alert("Camera tidak tersedia. Pastikan menggunakan HTTPS atau localhost.");
        return;
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("inactive");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data && data.display_name) {
             setLocation({
                lat: latitude,
                lng: longitude,
                address: data.display_name,
             });
             setLocationStatus("active");
          } else {
             // Fallback if address not found
             setLocation({
                lat: latitude,
                lng: longitude,
                address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
             });
             setLocationStatus("active");
          }
        } catch (error) {
           console.error("Error fetching address:", error);
           // Fallback on error
           setLocation({
              lat: latitude,
              lng: longitude,
              address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
           });
           setLocationStatus("active");
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationStatus("inactive");
      }
    );
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw location overlay if available
        if (location) {
            // Add a simple overlay on the image itself if needed, 
            // but the design shows the overlay as part of the UI.
            // However, to "send" the image with text, drawing it is better.
            // For now, we will just capture the raw image and handle overlay in display.
        }

        const imageUrl = canvas.toDataURL("image/png");
        setCapturedImage(imageUrl);
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendToChat = () => {
    if (capturedImage) {
      // Save image to local storage to be picked up by chat page
      localStorage.setItem('pendingChatImage', capturedImage);
      
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        router.push('/admin/chat');
      }, 1500);
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  if (!isClient) return null;

  return (
    <div className="gps-camera-container">
      <div className="camera-wrapper">
        {/* Header / Top Bar */}
        <div className="camera-header">
           <div className="top-left-actions">
              <input 
                 type="file" 
                 accept="image/*" 
                 ref={fileInputRef} 
                 style={{display: 'none'}} 
                 onChange={handleFileSelect}
              />
              <button className="gallery-btn-top" onClick={() => fileInputRef.current?.click()}>
                 <span className="material-icons">photo_library</span>
              </button>
           </div>
           
           <div className="mode-toggle">
              <button 
                className={`mode-btn ${mode === "photo" ? "active" : ""}`}
                onClick={() => setMode("photo")}
              >
                Foto
              </button>
              <button 
                className={`mode-btn ${mode === "video" ? "active" : ""}`}
                onClick={() => setMode("video")}
              >
                Video
              </button>
           </div>
           
           <div className="top-actions">
              <span className="material-icons flash-icon">flash_off</span>
              <span className="material-icons close-icon" onClick={() => router.back()}>close</span>
           </div>
        </div>

        {/* Camera Preview */}
        <div className="camera-preview">
          {!capturedImage ? (
             <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
          ) : (
             <img src={capturedImage} alt="Captured" className="captured-image" />
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
          
          {/* Location Badge Overlay */}
          <div className="location-badge">
             <div className="map-thumbnail">
                {/* Placeholder map image */}
                <div className="map-placeholder"></div>
             </div>
             <div className="location-info">
                <span className="date-time">
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="address-text">
                  {location ? location.address : "Mencari lokasi..."}
                </span>
             </div>
             <button className="refresh-loc-btn" onClick={getLocation}>
                <span className="material-icons">refresh</span>
             </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="camera-controls">
           {!capturedImage ? (
             <>
                <div className="shutter-outer" onClick={capturePhoto}>
                   <div className="shutter-inner"></div>
                </div>
             </>
           ) : (
             <div className="preview-actions">
                <button className="retake-btn secondary-btn" onClick={retake}>
                   <span className="material-icons">replay</span> Ulangi
                </button>
                <button className="send-btn primary-btn" onClick={handleSendToChat}>
                   <span className="material-icons">send</span> Kirim ke Chat
                </button>
             </div>
           )}
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="success-toast">
           <div className="toast-content">
              <h4>HORA PRO</h4>
              <p>Media tersimpan di Berkas HORA PRO</p>
              <small>Sentuh untuk membuka</small>
           </div>
        </div>
      )}

      {/* Location Status Notification (Mock) */}
      <div className={`location-status ${locationStatus === "active" ? "active" : "inactive"}`}>
         <span>Deteksi lokasi {locationStatus === "active" ? "aktif" : "nonaktif"}</span>
         <span className="material-icons close-status">close</span>
      </div>

      <style jsx>{`
        .gps-camera-container {
           height: calc(100vh - 80px); /* Adjust based on layout padding */
           background: #000;
           border-radius: 12px;
           overflow: hidden;
           position: relative;
           display: flex;
           justify-content: center;
           align-items: center;
           font-family: 'Montserrat', sans-serif;
           width: 100%;
        }

        .camera-wrapper {
           width: 100%;
           height: 100%;
           /* max-width removed for full page */
           position: relative;
           background: #000;
           display: flex;
           flex-direction: column;
        }

        /* Header */
        .camera-header {
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           padding: 24px;
           z-index: 10;
           display: flex;
           justify-content: space-between; /* Spread out items */
           align-items: center;
        }

        .top-left-actions {
           position: absolute;
           left: 24px;
        }

        .gallery-btn-top {
           background: rgba(0,0,0,0.5);
           border: none;
           width: 40px;
           height: 40px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           color: #fff;
           cursor: pointer;
           transition: background 0.2s;
        }
        
        .gallery-btn-top:hover {
           background: rgba(255,255,255,0.2);
        }

        .mode-toggle {
           background: rgba(0,0,0,0.5);
           border-radius: 20px;
           padding: 4px;
           display: flex;
           gap: 4px;
           margin: 0 auto; /* Center it */
        }

        .mode-btn {
           background: transparent;
           border: none;
           color: #fff;
           padding: 6px 16px;
           border-radius: 16px;
           font-family: 'Montserrat', sans-serif;
           font-size: 14px;
           font-weight: 500;
           cursor: pointer;
           transition: all 0.2s;
        }

        .mode-btn.active {
           background: #fff;
           color: #000;
           font-weight: 600;
        }

        .top-actions {
           position: absolute;
           right: 20px;
           display: flex;
           gap: 16px;
           color: #fff;
        }

        .material-icons {
           cursor: pointer;
        }

        /* Preview Area */
        .camera-preview {
           flex: 1;
           position: relative;
           background: #1a1a1a;
           overflow: hidden;
        }

        .video-feed, .captured-image {
           width: 100%;
           height: 100%;
           object-fit: cover;
        }

        /* Location Badge */
        .location-badge {
           position: absolute;
           bottom: 24px;
           left: 24px;
           right: 24px;
           background: rgba(20, 20, 20, 0.85);
           backdrop-filter: blur(8px);
           border-radius: 12px;
           padding: 12px;
           display: flex;
           align-items: center;
           gap: 12px;
           border: 1px solid rgba(255,255,255,0.1);
           max-width: 600px; /* Limit width on large screens */
           margin: 0 auto; /* Center on large screens if desired, or keep left aligned */
        }
        
        @media (min-width: 768px) {
            .location-badge {
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
            }
        }

        .map-thumbnail {
           width: 48px;
           height: 48px;
           background: #333;
           border-radius: 8px;
           overflow: hidden;
           flex-shrink: 0;
        }

        .map-placeholder {
           width: 100%;
           height: 100%;
           background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Google_Maps_icon_%282020%29.svg/1200px-Google_Maps_icon_%282020%29.svg.png'); /* Basic placeholder */
           background-size: cover;
           background-position: center;
        }

        .location-info {
           flex: 1;
           display: flex;
           flex-direction: column;
           gap: 2px;
           overflow: hidden;
        }

        .date-time {
           font-size: 11px;
           color: #94a3b8;
           font-weight: 500;
        }

        .address-text {
           font-size: 12px;
           color: #fff;
           font-weight: 600;
           line-height: 1.3;
           white-space: nowrap;
           overflow: hidden;
           text-overflow: ellipsis;
        }

        .refresh-loc-btn {
           background: rgba(255,255,255,0.1);
           border: none;
           color: #fff;
           width: 32px;
           height: 32px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           cursor: pointer;
           flex-shrink: 0;
        }

        .refresh-loc-btn span {
           font-size: 16px;
        }

        /* Bottom Controls */
        .camera-controls {
           height: 120px;
           background: #000;
           display: flex;
           align-items: center;
           justify-content: center;
           padding: 0 40px;
           gap: 40px;
           z-index: 20;
        }

        .shutter-outer {
           width: 72px;
           height: 72px;
           border-radius: 50%;
           border: 4px solid white;
           padding: 4px;
           cursor: pointer;
           display: flex;
           align-items: center;
           justify-content: center;
           transition: transform 0.1s;
        }

        .shutter-outer:active {
           transform: scale(0.95);
        }

        .shutter-inner {
           width: 100%;
           height: 100%;
           background: white;
           border-radius: 50%;
        }

        .gallery-btn, .flip-btn {
           background: rgba(255,255,255,0.1);
           border: none;
           width: 48px;
           height: 48px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           color: #fff;
           cursor: pointer;
        }

        .preview-actions {
           display: flex;
           gap: 16px;
           width: 100%;
           justify-content: center;
        }

        .primary-btn, .secondary-btn {
           padding: 12px 24px;
           border-radius: 12px;
           font-weight: 600;
           font-size: 14px;
           display: flex;
           align-items: center;
           gap: 8px;
           cursor: pointer;
           border: none;
           font-family: 'Montserrat', sans-serif;
        }

        .primary-btn {
           background: #7c3aed;
           color: white;
        }

        .secondary-btn {
           background: #334155;
           color: white;
        }

        /* Success Toast */
        .success-toast {
           position: absolute;
           top: 100px;
           right: 20px;
           background: #8b5cf6;
           padding: 16px;
           border-radius: 12px;
           color: white;
           box-shadow: 0 10px 30px rgba(0,0,0,0.2);
           animation: slideIn 0.3s ease-out;
           max-width: 300px;
           z-index: 100;
        }

        .success-toast h4 {
           margin: 0 0 4px 0;
           font-size: 14px;
           font-weight: 700;
        }

        .success-toast p {
           margin: 0 0 4px 0;
           font-size: 12px;
        }

        .success-toast small {
           font-size: 10px;
           opacity: 0.8;
        }

        /* Location Status */
        .location-status {
           position: absolute;
           top: 24px; /* Increased top spacing */
           right: 24px; /* Move to right */
           background: rgba(255,255,255,0.9);
           padding: 8px 16px;
           border-radius: 20px;
           display: flex;
           align-items: center;
           gap: 8px;
           font-size: 12px;
           font-weight: 600;
           color: #1e293b;
           transform: translateX(0); /* Make sure it's visible if needed */
           transition: transform 0.3s;
           z-index: 50; /* Ensure it's above everything */
        }
        
        .location-status.inactive {
           background: #fecaca;
           color: #dc2626;
        }
        
        @keyframes slideIn {
           from { transform: translateX(100%); opacity: 0; }
           to { transform: translateX(0); opacity: 1; }
        }

        @media (max-width: 768px) {
           .gps-camera-container {
              height: calc(100vh - 80px); /* Taller on mobile */
              border-radius: 0;
           }
           
           .camera-wrapper {
              max-width: 100%;
           }
        }
      `}</style>
    </div>
  );
}
