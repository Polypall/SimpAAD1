
export type ShapeType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus';

export interface ShapeConfig {
  id: string;
  type: ShapeType;
  params: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    segments?: number;
    tube?: number;
  };
  position: [number, number, number];
  color: string;
  label: string;
}

export type AuthMode = 'login' | 'signup' | 'forgot-password';

export interface User {
  id: string;
  email: string;
}
