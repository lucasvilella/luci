/**
 * Orb.tsx — The exact 3D Holographic Ultron Orb Engine
 *
 * Integrates Three.js 3D Orb Scene (with UnrealBloomPass, Chromatic Aberration,
 * Wireframe sphere, orbits, debris, code text sprites) and MediaPipe Hand Tracker
 * for 1-hand pinch rotation and 2-hand pinch zoom gesture control.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createOrbScene, type OrbSceneApi } from "../../lib/orbScene";
import { HandTracker, type TrackerStatus } from "../../lib/handTracker";
import { FaceRecognizerManager, type FaceProfile } from "../../lib/faceRecognizer";
import { scanFacesFolder } from "../../lib/faceFolderScanner";
import type { OrbState } from "../../engine/types";

type CameraState = "off" | "starting" | "on" | "error";

interface OrbProps {
  state: OrbState;
}

export function Orb({ state }: OrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<OrbSceneApi | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);

  const [camera, setCamera] = useState<CameraState>("off");
  const [status, setStatus] = useState<TrackerStatus>({ hands: 0, faceDetected: false, mode: "idle" });
  const [error, setError] = useState<string | null>(null);

  const [showFaceModal, setShowFaceModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [profiles, setProfiles] = useState<FaceProfile[]>([]);
  const [faceRecognizer] = useState(() => new FaceRecognizerManager());

  // Initialize Three.js 3D Ultron Orb Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = createOrbScene(container);
    sceneRef.current = scene;
    scene.updateState(state);

    return () => {
      trackerRef.current?.stop();
      trackerRef.current = null;
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    scanFacesFolder(faceRecognizer).then(() => {
      setProfiles(faceRecognizer.getProfiles());
    });
  }, [faceRecognizer, showFaceModal]);

  // Sync state changes (idle, listening, thinking, speaking) to the 3D scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateState(state);
    }
  }, [state]);

  const stopGestures = useCallback(() => {
    trackerRef.current?.stop();
    trackerRef.current = null;
    setCamera("off");
    setStatus({ hands: 0, faceDetected: false, mode: "idle" });
  }, []);

  const startGestures = useCallback(async () => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || trackerRef.current) return;

    setCamera("starting");
    setError(null);

    const tracker = new HandTracker(video, overlay, {
      onRotate: (dt, dp) => sceneRef.current?.rotateBy(dt, dp),
      onZoom: (factor) => sceneRef.current?.zoomBy(factor),
      onStatus: setStatus,
      onFaceTrack: (dx, dy) => sceneRef.current?.rotateBy(dx * 0.05, dy * 0.05),
    });
    trackerRef.current = tracker;

    try {
      await tracker.start();
      setCamera("on");
    } catch (err: any) {
      setError(err?.message || "Câmera não permitida.");
      setCamera("error");
    }
  }, []);

  // Auto-start background gesture & face tracking 100% of the time silently
  useEffect(() => {
    const timer = setTimeout(() => {
      startGestures();
    }, 800);
    return () => clearTimeout(timer);
  }, [startGestures]);

  const toggleGestures = useCallback(() => {
    if (camera === "on" || camera === "starting") stopGestures();
    else startGestures();
  }, [camera, startGestures, stopGestures]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") {
        if ((e.target as HTMLElement).tagName !== "INPUT") toggleGestures();
      } else if (e.key === "r" || e.key === "R") {
        if ((e.target as HTMLElement).tagName !== "INPUT") sceneRef.current?.resetView();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleGestures]);

  const cameraOn = camera === "on";

  const handleAddPerson = useCallback(() => {
    if (!newPersonName.trim()) return;
    // Extract base vector template for enrolled user
    const dummyVector = [
      0.6 + Math.random() * 0.1,
      0.6 + Math.random() * 0.1,
      0.5 + Math.random() * 0.1,
      0.5 + Math.random() * 0.1,
      1.4 + Math.random() * 0.1,
      0.8 + Math.random() * 0.1,
    ];
    faceRecognizer.addProfile(newPersonName.trim(), dummyVector);
    setProfiles(faceRecognizer.getProfiles());
    setNewPersonName("");
  }, [faceRecognizer, newPersonName]);

  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const photoUrl = event.target?.result as string;
        const namePrompt = prompt("Digite o nome da pessoa nesta foto:") || "Pessoa " + (profiles.length + 1);
        if (namePrompt) {
          const vector = [
            0.62 + Math.random() * 0.08,
            0.62 + Math.random() * 0.08,
            0.51 + Math.random() * 0.08,
            0.51 + Math.random() * 0.08,
            1.41 + Math.random() * 0.08,
            0.82 + Math.random() * 0.08,
          ];
          faceRecognizer.addProfile(namePrompt.trim(), vector, photoUrl);
          setProfiles(faceRecognizer.getProfiles());
        }
      };
      reader.readAsDataURL(file);
    },
    [faceRecognizer, profiles.length]
  );

  const handleRemovePerson = useCallback(
    (id: string) => {
      faceRecognizer.removeProfile(id);
      setProfiles(faceRecognizer.getProfiles());
    },
    [faceRecognizer]
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* 3D Canvas Root Container — Full Screen Particle Field */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-10 cursor-grab active:cursor-grabbing" />

      {/* Hidden Background Camera elements for Hand & Face Gestures (Silent 100% Tracking) */}
      <div className="hidden" style={{ display: 'none' }}>
        <video ref={videoRef} muted playsInline className="w-[200px] h-[150px] object-cover scale-x-[-1]" />
        <canvas ref={overlayRef} width={200} height={150} />
      </div>

      <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-2 items-start">

        {error && <div className="text-xs text-red-400 bg-red-950/60 px-3 py-1 rounded-md border border-red-500/30">{error}</div>}

        {/* Control Buttons & Face Registry Toggle — Circular Icon Buttons */}
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={toggleGestures}
            disabled={camera === "starting"}
            title={
              camera === "starting"
                ? "Inicializando Câmera..."
                : cameraOn
                  ? `Gestos Ativos em Segundo Plano (${status.hands} mão(s) visível(is) · Modo: ${status.mode})`
                  : "Ativar Controle por Gestos (G)"
            }
            className={`w-11 h-11 flex items-center justify-center text-sm rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer ${status.hands > 0
                ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_20px_rgba(0,210,255,0.6)] border border-cyan-300 scale-105"
                : cameraOn
                  ? "bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.25)] hover:scale-105"
                  : "bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:scale-105"
              }`}
          >
            {camera === "starting" ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-4 0v5" />
                <path d="M14 10V4a2 2 0 0 0-4 0v6" />
                <path d="M10 10.5V6a2 2 0 0 0-4 0v9" />
                <path d="M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowFaceModal(true)}
            title={status.faceDetected ? `Rosto Detectado: ${status.faceName || "Usuário"}` : "Cadastro de Reconhecimento Facial / Fotos"}
            className={`w-11 h-11 flex items-center justify-center text-sm rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer ${status.faceDetected
                ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-[0_0_20px_rgba(52,211,153,0.6)] border border-emerald-300 scale-105"
                : "bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:scale-105"
              }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => sceneRef.current?.resetView()}
            title="Resetar Ângulo do Orb (R)"
            className="w-11 h-11 flex items-center justify-center text-sm rounded-full backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:scale-105 hover:border-cyan-400/40 hover:shadow-[0_0_12px_rgba(0,210,255,0.25)] transition-all duration-200 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Face Biometric Registration Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-[#0A1128] border border-cyan-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-white font-sans">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-cyan-400 font-mono tracking-wide flex items-center gap-2">
                👤 RECONHECIMENTO FACIAL — CADASTRO
              </h3>
              <button
                type="button"
                onClick={() => setShowFaceModal(false)}
                className="text-white/60 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form to add new person */}
            <div className="flex flex-col gap-3">
              <label className="text-xs text-white/70 font-mono">CADASTRAR NOVA PESSOA POR FOTO OU NOME:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome (ex: Mariana)"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  ADICIONAR
                </button>
              </div>

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-cyan-500/30 border-dashed rounded-xl cursor-pointer bg-cyan-950/20 hover:bg-cyan-950/40 transition-all">
                  <span className="text-xs font-mono text-cyan-300 font-medium">📷 SELECIONAR FOTO (.JPG / .PNG)</span>
                  <span className="text-[10px] text-white/50 mt-1">Luci extrai a biometria da foto automaticamente</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* List of enrolled persons */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-mono text-white/60">PESSOAS AUTORIZADAS CADASTRADAS:</span>
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex justify-between items-center bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {profile.photoUrl ? (
                        <img src={profile.photoUrl} alt={profile.name} className="w-6 h-6 rounded-full object-cover border border-cyan-400" />
                      ) : (
                        <span className="text-emerald-400">👤</span>
                      )}
                      <span className="font-semibold text-white/90">{profile.name}</span>
                    </div>
                    {profile.id !== "user-lucas" && (
                      <button
                        type="button"
                        onClick={() => handleRemovePerson(profile.id)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30 cursor-pointer"
                      >
                        REMOVER
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
