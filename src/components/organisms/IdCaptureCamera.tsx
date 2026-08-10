import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ImagePlus, RefreshCcw, Video, Sun } from "lucide-react";

interface IdCaptureCameraProps {
  onCapture: (dataUrl: string | null) => void;
  initial?: string | null;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

export const IdCaptureCamera: React.FC<IdCaptureCameraProps> = ({ onCapture, initial }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [preview, setPreview] = useState<string | null>(initial ?? null);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((all) => {
        if (cancelled) return;
        const cams = all
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 4)}` }));
        setDevices(cams);
        if (cams.length === 1) setSelectedDevice(cams[0].deviceId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const startCam = async (deviceId?: string) => {
    setCamError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
        audio: false,
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
    } catch {
      setCamError(true);
      setCamOn(false);
    }
  };

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  };

  const snap = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const outW = 800;
    const outH = 1000;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) return;

    const sourceRatio = outW / outH;
    const videoRatio = vw / vh;
    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;
    if (videoRatio > sourceRatio) {
      sw = vh * sourceRatio;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / sourceRatio;
      sy = (vh - sh) / 2;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreview(dataUrl);
    onCapture(dataUrl);
    stopCam();
  };

  const useFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onCapture(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5 text-cyan-600" />
        <span>ID Holder Photo Capture (Web / Phone Camera)</span>
      </span>

      {devices.length > 1 && (
        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
          <Video className="w-3.5 h-3.5 text-cyan-600" />
          <span>Camera source:</span>
          <select
            value={selectedDevice}
            onChange={(e) => {
              setSelectedDevice(e.target.value);
              if (camOn) startCam(e.target.value);
            }}
            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
        </label>
      )}

      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-950 overflow-hidden relative aspect-[4/5]">
        {camOn ? (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[62%] h-[78%] rounded-[50%] border-2 border-dashed border-emerald-300/90" />
            </div>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/80 border border-slate-700 px-2 py-0.5 rounded-full pointer-events-none">
              Align face inside the oval, look straight ahead
            </span>
          </>
        ) : preview ? (
          <img src={preview} alt="Captured holder photo" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-900">
            <CameraOff className="w-8 h-8" />
            <span className="text-[11px] font-bold">No photo captured yet</span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-1.5 text-[10px] text-slate-500 font-semibold bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1.5">
        <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span>
          Use a web camera or a phone camera plugged into the laptop (via USB or DroidCam / Camo). Ensure even lighting with no shadows on the face for a passport-quality photo.
        </span>
      </div>

      {camError && (
        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1 inline-block">
          Camera unavailable — enable camera access, select the correct source above, or upload a photo below.
        </span>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!camOn ? (
          <button
            type="button"
            onClick={() => startCam(selectedDevice || undefined)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            Start Camera
          </button>
        ) : (
          <button
            type="button"
            onClick={snap}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer"
          >
            Capture Photo
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setPreview(null);
            onCapture(null);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Retake
        </button>
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer">
          <ImagePlus className="w-3.5 h-3.5" />
          Upload Photo
          <input type="file" accept="image/*" className="hidden" onChange={useFile} />
        </label>
      </div>
    </div>
  );
};
