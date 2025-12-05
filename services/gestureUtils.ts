import { GestureState, HandLandmark } from '../types';

// MediaPipe Hand Landmark Indices
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;

const TIPS = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
const PIP_JOINTS = [2, 6, 10, 14, 18]; // Joints to compare against for curl detection

// Calculate Euclidean distance between two 3D points
export const distance = (p1: HandLandmark, p2: HandLandmark): number => {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)
  );
};

// Check if a specific finger is extended
export const isFingerExtended = (landmarks: HandLandmark[], fingerIndex: number): boolean => {
  const tipIndex = TIPS[fingerIndex];
  const pipIndex = PIP_JOINTS[fingerIndex];
  
  // Simple check: Tip is higher (lower y value in screen space) than the PIP joint
  // Note: MediaPipe Y coordinates: 0 is top, 1 is bottom. 
  // However, for more robustness regardless of hand orientation, we compare distance to wrist.
  const wrist = landmarks[WRIST];
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];

  return distance(wrist, tip) > distance(wrist, pip);
};

// Determine the current gesture based on landmarks
export const detectGesture = (landmarks: HandLandmark[]): GestureState => {
  const thumbOpen = isFingerExtended(landmarks, 0);
  const indexOpen = isFingerExtended(landmarks, 1);
  const middleOpen = isFingerExtended(landmarks, 2);
  const ringOpen = isFingerExtended(landmarks, 3);
  const pinkyOpen = isFingerExtended(landmarks, 4);

  const openCount = [thumbOpen, indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

  // 1. ROTATE_XY: Index finger only (others closed)
  // Allow thumb to be loosely open or closed, but strictly index must be open, middle/ring/pinky closed.
  if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
    return GestureState.ROTATE_XY;
  }

  // 2. ROTATE_Z: Index + Middle open (Victory sign), others closed
  if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
    return GestureState.ROTATE_Z;
  }

  // 3. ZOOM_EXPLODE: 
  // State A: 5 Fingers Open (Expansion)
  // State B: Fist (0 Fingers Open) (Contraction)
  if (openCount === 5 || openCount === 0) {
    return GestureState.ZOOM_EXPLODE;
  }

  return GestureState.IDLE;
};

// Calculate Expansion factor (0 to 1)
// 0 = Fist, 1 = Open Hand
// We calculate the average distance of tips from the center of the palm (approx by wrist or calculating centroid)
export const calculateExpansion = (landmarks: HandLandmark[]): number => {
  const wrist = landmarks[WRIST];
  let totalDist = 0;
  TIPS.forEach(tipIdx => {
    totalDist += distance(wrist, landmarks[tipIdx]);
  });
  const avgDist = totalDist / 5;
  // Normalize based on heuristic values (0.1 is usually closed, 0.3+ is open)
  // Clamping between 0 and 1
  return Math.min(Math.max((avgDist - 0.1) / 0.25, 0), 1);
};

// Calculate Rotation Z angle (in radians) based on Index and Middle finger
export const calculateRotationZ = (landmarks: HandLandmark[]): number => {
  const p1 = landmarks[INDEX_TIP];
  const p2 = landmarks[MIDDLE_TIP];
  
  // Calculate angle of the line connecting the two fingertips
  // Y is inverted in screen space usually, but for simple rotation we just want the delta
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};
