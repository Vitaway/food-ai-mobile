import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  calculateDiameterCm,
  pointsAreTooClose,
  viroPositionToPoint3D,
  type MeasureStep,
  type Point3D,
} from '@/utils/arMeasure';

type ARMeasureSessionValue = {
  step: MeasureStep;
  pointA: Point3D | null;
  pointB: Point3D | null;
  diameterCm: number | null;
  planeDetected: boolean;
  tapHint: string | null;
  canAcceptTap: boolean;
  handlePlaneDetected: () => void;
  handleSceneTap: (position: [number, number, number]) => void;
  resetMeasurement: () => void;
};

const ARMeasureSessionContext = createContext<ARMeasureSessionValue | null>(null);

export function ARMeasureSessionProvider({ children }: PropsWithChildren) {
  const [step, setStep] = useState<MeasureStep>('scanning');
  const [pointA, setPointA] = useState<Point3D | null>(null);
  const [pointB, setPointB] = useState<Point3D | null>(null);
  const [diameterCm, setDiameterCm] = useState<number | null>(null);
  const [planeDetected, setPlaneDetected] = useState(false);
  const [tapHint, setTapHint] = useState<string | null>(null);

  const handlePlaneDetected = useCallback(() => {
    setPlaneDetected(true);
    setStep((current) => (current === 'scanning' ? 'tapFirst' : current));
  }, []);

  const resetMeasurement = useCallback(() => {
    setStep(planeDetected ? 'tapFirst' : 'scanning');
    setPointA(null);
    setPointB(null);
    setDiameterCm(null);
    setTapHint(null);
  }, [planeDetected]);

  const handleSceneTap = useCallback(
    (position: [number, number, number]) => {
      if (!planeDetected || step === 'confirmed' || step === 'scanning') return;

      const nextPoint = viroPositionToPoint3D(position);
      setTapHint(null);

      if (step === 'tapFirst') {
        setPointA(nextPoint);
        setStep('tapSecond');
        return;
      }

      if (step === 'tapSecond' && pointA) {
        if (pointsAreTooClose(pointA, nextPoint)) {
          setTapHint('Points too close, try again');
          return;
        }

        setPointB(nextPoint);
        setDiameterCm(calculateDiameterCm(pointA, nextPoint));
        setStep('confirmed');
      }
    },
    [planeDetected, pointA, step],
  );

  const canAcceptTap = planeDetected && (step === 'tapFirst' || step === 'tapSecond');

  const value = useMemo<ARMeasureSessionValue>(
    () => ({
      step,
      pointA,
      pointB,
      diameterCm,
      planeDetected,
      tapHint,
      canAcceptTap,
      handlePlaneDetected,
      handleSceneTap,
      resetMeasurement,
    }),
    [
      canAcceptTap,
      diameterCm,
      handlePlaneDetected,
      handleSceneTap,
      planeDetected,
      pointA,
      pointB,
      resetMeasurement,
      step,
      tapHint,
    ],
  );

  return <ARMeasureSessionContext.Provider value={value}>{children}</ARMeasureSessionContext.Provider>;
}

export function useARMeasureSession() {
  const context = useContext(ARMeasureSessionContext);
  if (!context) {
    throw new Error('useARMeasureSession must be used within ARMeasureSessionProvider');
  }
  return context;
}
