const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports for specific incompatibilities
config.resolver.unstable_enablePackageExports = false;

// Production Obfuscation custom serializer
if (process.env.NODE_ENV === 'production' || process.env.EAS_BUILD === 'true') {
  const originalSerializer = config.serializer?.customSerializer;

  config.serializer = {
    ...config.serializer,
    customSerializer: async (entryPoint, preModules, graph, options) => {
      let result;
      if (originalSerializer) {
        result = await originalSerializer(entryPoint, preModules, graph, options);
      } else {
        const bundle = require('metro/src/shared/output/bundle');
        result = bundle.build(entryPoint, preModules, graph, options);
      }

      // Skip obfuscation on Web to avoid breaking reflection/decorators in Web3/Privy SDKs
      const isWebBuild = options.platform === 'web' || process.argv.includes('web');
      if (isWebBuild) {
        return result;
      }

      let code = typeof result === 'string' ? result : result.code;

      const JavaScriptObfuscator = require('javascript-obfuscator');
      const obfuscated = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.3,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.8,
        numbersToExpressions: true,
        simplify: true,
      });

      const obfuscatedCode = obfuscated.getObfuscatedCode();
      if (typeof result === 'string') {
        return obfuscatedCode;
      }
      return {
        ...result,
        code: obfuscatedCode,
      };
    }
  };
}

module.exports = config;
