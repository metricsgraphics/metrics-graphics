import esbuild from 'esbuild'

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  target: 'esnext'
}

// esm
esbuild.build({
  ...baseConfig,
  outdir: 'dist/esm',
  splitting: true,
  format: 'esm'
})

// cjs
esbuild.build({
  ...baseConfig,
  outdir: 'dist/cjs',
  format: 'cjs'
})
