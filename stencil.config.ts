import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import { reactOutputTarget } from '@stencil/react-output-target';

export const config: Config = {
  namespace: 'mustib-ui',

  preamble: 'created by @mustib https://github.com/mustib using https://stenciljs.com',

  hydratedFlag: {
    name: 'mu-hydrated',
  },

  globalStyle: './src/styles/global.scss',

  plugins: [sass({ injectGlobalPaths: ['./src/styles/functions.scss', './src/styles/mixins.scss'] })],

  outputTargets: [
    {
      type: 'dist',
      isPrimaryPackageOutputTarget: true,
    },

    reactOutputTarget({
      outDir: './dist/react',
      stencilPackageName: '../..',
    }),

    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },

    {
      type: 'www',
      serviceWorker: null,
    },
  ],
  testing: {
    browserHeadless: 'new',
  },
};
