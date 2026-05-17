import type { NextConfig } from 'next'

const config: NextConfig = {
  turbopack: {},
  webpack(cfg) {
    cfg.module.rules.push({ test: /\.(glb|gltf)$/, type: 'asset/resource' })
    return cfg
  },
}

export default config
