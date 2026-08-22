/// <reference types="vite/client" />

// GLSL shader modules
declare module '*.glsl?raw' {
  const value: string;
  export default value;
}

declare module '*.vert.glsl?raw' {
  const value: string;
  export default value;
}

declare module '*.frag.glsl?raw' {
  const value: string;
  export default value;
}
