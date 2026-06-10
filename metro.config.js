const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'glb',
  'gltf',
  'obj',
  'mtl',
  'bin',
  'hdr',
  'vrx',
  'arsc',
);

module.exports = withNativeWind(config, { input: './global.css' });
