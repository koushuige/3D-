export enum GestureState {
  IDLE = 'IDLE',
  ZOOM_EXPLODE = 'ZOOM_EXPLODE', // 5 fingers open or fist
  ROTATE_XY = 'ROTATE_XY',       // Index finger only
  ROTATE_Z = 'ROTATE_Z'          // Index + Middle finger
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  gesture: GestureState;
  // Normalized values 0-1 or angles
  values: {
    expansion: number; // For zoom
    rotationX: number; // For XY
    rotationY: number; // For XY
    rotationZ: number; // For Z
  };
}

export interface ParticleConfig {
  count: number;
  color: string;
}
