import type { ComponentType, ReactElement } from 'react';
import { NativeModules, Platform } from 'react-native';

type ViroARSceneNavigatorProps = {
  autofocus?: boolean;
  initialScene: { scene: () => ReactElement };
  style?: object;
};

type ARMeasureSceneBundle = {
  ViroARScene: ComponentType<Record<string, unknown>>;
  ViroARPlaneSelector: ComponentType<Record<string, unknown>>;
  ViroSphere: ComponentType<Record<string, unknown>>;
  ViroTrackingStateConstants: { TRACKING_NORMAL: number };
  ViroMaterials: {
    createMaterials: (materials: Record<string, unknown>) => void;
  };
};

function isViroRuntimeReady(): boolean {
  if (Platform.OS === 'ios') {
    const materialManager = NativeModules.VRTMaterialManager as { setJSMaterials?: unknown } | undefined;
    const arUtils = NativeModules.VRTARUtils as { isARSupported?: unknown } | undefined;
    return (
      typeof materialManager?.setJSMaterials === 'function' &&
      typeof arUtils?.isARSupported === 'function'
    );
  }

  if (Platform.OS === 'android') {
    const navigator = NativeModules.VRTARSceneNavigatorModule as
      | { isARSupportedOnDevice?: unknown }
      | undefined;
    return typeof navigator?.isARSupportedOnDevice === 'function';
  }

  return false;
}

/**
 * Viro is only linked in device builds. Requiring the package entry point loads
 * ViroARPlaneSelector, which calls ViroMaterials.createMaterials at module init
 * and crashes when native modules are missing (simulator builds).
 */
export function isViroNativeLinked(): boolean {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'ios') {
    return Boolean(NativeModules.VRTARUtils && NativeModules.VRTMaterialManager);
  }

  if (Platform.OS === 'android') {
    return Boolean(NativeModules.VRTARSceneNavigatorModule);
  }

  return false;
}

/** True only when native Viro modules exist and expose the methods we call. */
export function canUseAR(): boolean {
  return isViroNativeLinked() && isViroRuntimeReady();
}

export function getInitialARSupportState(): boolean | null {
  if (Platform.OS === 'web' || !canUseAR()) return false;
  return null;
}

export async function checkARSupport(): Promise<boolean> {
  if (!canUseAR()) return false;

  try {
    const { isARSupportedOnDevice } =
      require('@viro-community/react-viro/dist/components/Utilities/ViroUtils') as typeof import('@viro-community/react-viro/dist/components/Utilities/ViroUtils');
    const result = await isARSupportedOnDevice();
    return Boolean(result?.isARSupported);
  } catch {
    return false;
  }
}

export function loadViroARSceneNavigator(): ComponentType<ViroARSceneNavigatorProps> | null {
  if (!canUseAR()) return null;

  try {
    return require('@viro-community/react-viro/dist/components/AR/ViroARSceneNavigator')
      .ViroARSceneNavigator as ComponentType<ViroARSceneNavigatorProps>;
  } catch {
    return null;
  }
}

export function loadARMeasureSceneComponents(): ARMeasureSceneBundle | null {
  if (!canUseAR()) return null;

  try {
    const arScene = require('@viro-community/react-viro/dist/components/AR/ViroARScene');
    const planeSelector = require('@viro-community/react-viro/dist/components/AR/ViroARPlaneSelector');
    const sphere = require('@viro-community/react-viro/dist/components/ViroSphere');
    const constants = require('@viro-community/react-viro/dist/components/ViroConstants');
    const materials = require('@viro-community/react-viro/dist/components/Material/ViroMaterials');

    return {
      ViroARScene: arScene.ViroARScene,
      ViroARPlaneSelector: planeSelector.ViroARPlaneSelector,
      ViroSphere: sphere.ViroSphere,
      ViroTrackingStateConstants: constants.ViroTrackingStateConstants,
      ViroMaterials: materials.ViroMaterials,
    };
  } catch {
    return null;
  }
}
