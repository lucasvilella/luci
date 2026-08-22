import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface FaceProfile {
  id: string;
  name: string;
  photoUrl?: string;
  vector: number[];
  registeredAt: number;
}

const STORAGE_KEY = "luci_face_profiles";

/**
 * Default enrolled profile for primary owner
 */
const DEFAULT_PROFILES: FaceProfile[] = [
  {
    id: "user-lucas",
    name: "Lucas",
    vector: [0.65, 0.65, 0.52, 0.52, 1.42, 0.85],
    registeredAt: Date.now(),
  },
];

export class FaceRecognizerManager {
  private profiles: FaceProfile[] = [];

  constructor() {
    this.loadProfiles();
  }

  public loadProfiles(): FaceProfile[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.profiles = JSON.parse(saved);
      } else {
        this.profiles = DEFAULT_PROFILES;
        this.saveProfiles();
      }
    } catch {
      this.profiles = DEFAULT_PROFILES;
    }
    return this.profiles;
  }

  public saveProfiles(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
    } catch (e) {
      console.error("Failed to save face profiles:", e);
    }
  }

  public getProfiles(): FaceProfile[] {
    return this.profiles;
  }

  public addProfile(name: string, vector: number[], photoUrl?: string): FaceProfile {
    const newProfile: FaceProfile = {
      id: `profile-${Date.now()}`,
      name,
      photoUrl,
      vector,
      registeredAt: Date.now(),
    };
    this.profiles.push(newProfile);
    this.saveProfiles();
    return newProfile;
  }

  public removeProfile(id: string): void {
    this.profiles = this.profiles.filter((p) => p.id !== id);
    this.saveProfiles();
  }

  /**
   * Extracts a scale and rotation invariant facial geometry vector from MediaPipe 478 Face Landmarks.
   */
  public static extractVector(landmarks: NormalizedLandmark[]): number[] | null {
    if (!landmarks || landmarks.length < 300) return null;

    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const chin = landmarks[152];

    const eyeDist = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y);
    if (eyeDist < 1e-4) return null;

    const eyeNoseLeft = Math.hypot(leftEye.x - nose.x, leftEye.y - nose.y) / eyeDist;
    const eyeNoseRight = Math.hypot(rightEye.x - nose.x, rightEye.y - nose.y) / eyeDist;
    const noseMouthLeft = Math.hypot(leftMouth.x - nose.x, leftMouth.y - nose.y) / eyeDist;
    const noseMouthRight = Math.hypot(rightMouth.x - nose.x, rightMouth.y - nose.y) / eyeDist;
    const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
    const eyeChin = Math.hypot(eyeCenter.x - chin.x, eyeCenter.y - chin.y) / eyeDist;
    const mouthWidth = Math.hypot(leftMouth.x - rightMouth.x, leftMouth.y - rightMouth.y) / eyeDist;

    return [
      Number(eyeNoseLeft.toFixed(3)),
      Number(eyeNoseRight.toFixed(3)),
      Number(noseMouthLeft.toFixed(3)),
      Number(noseMouthRight.toFixed(3)),
      Number(eyeChin.toFixed(3)),
      Number(mouthWidth.toFixed(3)),
    ];
  }

  /**
   * Matches live face vector against enrolled profiles using Euclidean Distance.
   */
  public match(liveVector: number[]): { matched: boolean; name: string; score: number } {
    if (!liveVector || this.profiles.length === 0) {
      return { matched: false, name: "Lucas", score: 0 };
    }

    let bestName = "Lucas";
    let minDistance = Infinity;

    for (const profile of this.profiles) {
      if (!profile.vector || profile.vector.length !== liveVector.length) continue;
      
      let sumSq = 0;
      for (let i = 0; i < liveVector.length; i++) {
        const diff = liveVector[i] - profile.vector[i];
        sumSq += diff * diff;
      }
      const dist = Math.sqrt(sumSq);

      if (dist < minDistance) {
        minDistance = dist;
        bestName = profile.name;
      }
    }

    // Threshold for valid match
    const MATCH_THRESHOLD = 0.35;
    const matched = minDistance <= MATCH_THRESHOLD;

    return {
      matched,
      name: matched ? bestName : "VISITANTE",
      score: Number(minDistance.toFixed(3)),
    };
  }
}
