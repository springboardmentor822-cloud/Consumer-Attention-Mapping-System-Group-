import { createContext, useContext, useMemo, useState } from "react";

const CameraContext = createContext(null);

export function CameraProvider({ children }) {
  const [selectedCamera, setSelectedCamera] = useState(1);

  // =====================================================
  // Only supported cameras
  // =====================================================

  const cameras = useMemo(
    () => [
      {
        id: 1,
        name: "Camera 1 - Entrance",
        zone: "Entrance",
      },
      {
        id: 2,
        name: "Camera 2 - Supermarket Aisle",
        zone: "Supermarket Aisle",
      },
    ],
    []
  );

  const currentCamera =
    cameras.find((camera) => camera.id === selectedCamera) || cameras[0];

  return (
    <CameraContext.Provider
      value={{
        cameras,
        selectedCamera,
        setSelectedCamera,
        currentCamera,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  const context = useContext(CameraContext);

  if (!context) {
    throw new Error("useCamera must be used inside CameraProvider");
  }

  return context;
}