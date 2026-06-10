import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useARMeasureSession } from '@/context/ARMeasureSessionContext';
import { loadARMeasureSceneComponents } from '@/utils/arAvailability';

let viroMaterialsReady = false;

function ensureMarkerMaterial(
  ViroMaterials: NonNullable<ReturnType<typeof loadARMeasureSceneComponents>>['ViroMaterials'],
) {
  if (viroMaterialsReady) return true;
  try {
    ViroMaterials.createMaterials({
      markerRed: {
        lightingModel: 'Constant',
        diffuseColor: '#E53935',
      },
    });
    viroMaterialsReady = true;
    return true;
  } catch {
    return false;
  }
}

export function ARMeasureScene() {
  const {
    pointA,
    pointB,
    canAcceptTap,
    handlePlaneDetected,
    handleSceneTap,
  } = useARMeasureSession();

  const viro = useMemo(() => loadARMeasureSceneComponents(), []);
  const materialsReady = viro ? ensureMarkerMaterial(viro.ViroMaterials) : false;

  useEffect(() => {
    if (viro) ensureMarkerMaterial(viro.ViroMaterials);
  }, [viro]);

  if (!viro || !materialsReady) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-center text-base text-white">AR scene failed to load.</Text>
      </View>
    );
  }

  const {
    ViroARScene,
    ViroARPlaneSelector,
    ViroSphere,
    ViroTrackingStateConstants,
  } = viro;

  return (
    <ViroARScene
      anchorDetectionTypes="PlanesHorizontal"
      onAnchorFound={() => handlePlaneDetected()}
      onTrackingUpdated={(state: number) => {
        if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
          handlePlaneDetected();
        }
      }}
      onClick={
        canAcceptTap
          ? (position: [number, number, number]) => handleSceneTap(position)
          : undefined
      }>
      <ViroARPlaneSelector alignment="Horizontal" maxPlanes={3} />
      {pointA ? (
        <ViroSphere
          position={[pointA.x, pointA.y, pointA.z]}
          radius={0.01}
          materials={['markerRed']}
        />
      ) : null}
      {pointB ? (
        <ViroSphere
          position={[pointB.x, pointB.y, pointB.z]}
          radius={0.01}
          materials={['markerRed']}
        />
      ) : null}
    </ViroARScene>
  );
}
