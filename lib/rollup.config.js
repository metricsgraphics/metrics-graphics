import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/MG.ts',
  output: {
    dir: 'dist',
    format: 'es'
  },
  plugins: [typescript()]
}
