/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEEPGRAM_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}