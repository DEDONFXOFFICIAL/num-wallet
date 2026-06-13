const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports for specific incompatibilities
config.resolver.unstable_enablePackageExports = false;

// Production Obfuscation custom serializer
if (process.env.EAS_BUILD_PROFILE === 'production') {
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

      const JavaScriptObfuscator = require('javascript-obfuscator');
      const obfuscationOptions = {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        stringArray: false,
        numbersToExpressions: false,
        simplify: true,
      };

      if (typeof result === 'string') {
        const obfuscated = JavaScriptObfuscator.obfuscate(result, obfuscationOptions);
        return obfuscated.getObfuscatedCode();
      }

      if (result && typeof result === 'object') {
        // Obfuscate top-level result.code if present
        if (typeof result.code === 'string') {
          const obfuscated = JavaScriptObfuscator.obfuscate(result.code, obfuscationOptions);
          result.code = obfuscated.getObfuscatedCode();
        }

        // Obfuscate js artifacts if present
        if (Array.isArray(result.artifacts)) {
          for (const art of result.artifacts) {
            if (art && art.type === 'js' && typeof art.source === 'string') {
              const obfuscated = JavaScriptObfuscator.obfuscate(art.source, obfuscationOptions);
              art.source = obfuscated.getObfuscatedCode();
            }
          }
        }
      }

      return result;
    }
  };
}

module.exports = config;
