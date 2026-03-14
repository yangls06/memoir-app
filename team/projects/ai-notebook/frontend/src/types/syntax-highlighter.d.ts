declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';
  
  export const Prism: ComponentType<{
    style?: Record<string, unknown>;
    language?: string;
    PreTag?: string;
    children?: string;
  }>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const oneDark: Record<string, unknown>;
  export const oneLight: Record<string, unknown>;
}
