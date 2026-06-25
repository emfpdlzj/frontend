import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const envKeys = [
  'REACT_APP_API_BASE_URL',
  'REACT_APP_KAKAO_CLIENT_ID',
  'REACT_APP_KAKAO_REDIRECT_URI',
  'REACT_APP_NAVER_CLIENT_ID',
  'REACT_APP_NAVER_REDIRECT_URI',
  'REACT_APP_NAVER_MAP_CLIENT_ID',
  'REACT_APP_SITE_URL',
  'REACT_APP_LOG_LEVEL',
  'REACT_APP_WEB_VITALS_ENDPOINT'
];
const forbiddenClientEnvPattern = /(SECRET|PRIVATE|PASSWORD|PASSWD|TOKEN|JWT|CLIENT_SECRET|SERVICE_KEY)/i;
const publicClientEnvAllowList = new Set(envKeys);

const validateClientEnv = (env) => {
  const exposedKeys = Object.keys(env).filter((key) => key.startsWith('REACT_APP_') || key.startsWith('VITE_'));
  const forbiddenKeys = exposedKeys.filter((key) => {
    const reactKey = key.replace(/^VITE_/, 'REACT_APP_');
    return forbiddenClientEnvPattern.test(key) && !publicClientEnvAllowList.has(reactKey);
  });

  if (forbiddenKeys.length > 0) {
    throw new Error(
      `Client env contains keys that look sensitive: ${forbiddenKeys.join(', ')}. ` +
        'Do not expose secrets through REACT_APP_* or VITE_* variables.'
    );
  }
};

const jsAsJsxPlugin = (define = {}) => ({
  name: 'bridgework-js-as-jsx',
  async transform(code, id) {
    if (!id.includes('/src/') || !id.endsWith('.js')) {
      return null;
    }

    return transformWithEsbuild(code, id, {
      loader: 'jsx',
      jsx: 'automatic',
      define
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  validateClientEnv(env);
  const clientEnv = {};
  const define = {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development')
  };

  envKeys.forEach((key) => {
    clientEnv[key] = env[key] || env[key.replace('REACT_APP_', 'VITE_')] || '';
    define[`process.env.${key}`] = JSON.stringify(clientEnv[key]);
  });
  define['process.env'] = JSON.stringify({
    NODE_ENV: mode === 'production' ? 'production' : 'development',
    ...clientEnv
  });

  return {
    plugins: [
      jsAsJsxPlugin(define),
      react({
        include: /\.(js|jsx|ts|tsx)$/
      })
    ],
    define,
    envPrefix: ['VITE_', 'REACT_APP_'],
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
