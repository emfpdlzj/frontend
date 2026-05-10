import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const envKeys = [
  'REACT_APP_API_BASE_URL',
  'REACT_APP_KAKAO_CLIENT_ID',
  'REACT_APP_KAKAO_REDIRECT_URI',
  'REACT_APP_NAVER_CLIENT_ID',
  'REACT_APP_NAVER_REDIRECT_URI',
  'REACT_APP_NAVER_MAP_CLIENT_ID',
  'REACT_APP_LOG_LEVEL',
  'REACT_APP_WEB_VITALS_ENDPOINT'
];

const jsAsJsxPlugin = () => ({
  name: 'bridgework-js-as-jsx',
  async transform(code, id) {
    if (!id.includes('/src/') || !id.endsWith('.js')) {
      return null;
    }

    return transformWithEsbuild(code, id, {
      loader: 'jsx',
      jsx: 'automatic'
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const define = {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development')
  };

  envKeys.forEach((key) => {
    define[`process.env.${key}`] = JSON.stringify(env[key] || env[key.replace('REACT_APP_', 'VITE_')] || '');
  });

  return {
    plugins: [
      jsAsJsxPlugin(),
      react({
        include: /\.(js|jsx|ts|tsx)$/
      })
    ],
    define,
    server: {
      port: 3000,
      strictPort: true
    },
    oxc: {
      include: /src\/.*\.js$/,
      exclude: /node_modules/,
      lang: 'jsx',
      jsx: {
        runtime: 'automatic'
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    },
    build: {
      outDir: 'build'
    }
  };
});
