import React, { useState, useRef } from 'react';
import type { Camera3D } from './utils/geometry3d';

export function useCamera() {
  const [camera, setCamera] = useState<Camera3D>({ yaw: -35, pitch: 35, zoom: 0.95 });
  const [isDraggingCamera, setIsDraggingCamera] = useState(false);
  const cameraDragStartRef = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });

  const shouldIgnoreTarget = (e: { target: EventTarget | null }) => {
    const target = e.target as HTMLElement;
    return !!(
      target.closest('#agent-icon-g-master') ||
      target.closest('#agent-icon-g-dosing') ||
      target.closest('#agent-icon-g-uf') ||
      target.closest('#agent-icon-g-membrane') ||
      target.closest('button') ||
      target.closest('[id^="floating-card-"]') ||
      target.closest('.cursor-pointer')
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (shouldIgnoreTarget(e)) return;
    setIsDraggingCamera(true);
    cameraDragStartRef.current = { x: e.clientX, y: e.clientY, yaw: camera.yaw, pitch: camera.pitch };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCamera) return;
    const dx = e.clientX - cameraDragStartRef.current.x;
    const dy = e.clientY - cameraDragStartRef.current.y;
    setCamera(prev => ({
      ...prev,
      yaw: (cameraDragStartRef.current.yaw + dx * 0.4) % 360,
      pitch: Math.max(15, Math.min(80, cameraDragStartRef.current.pitch + dy * 0.4))
    }));
  };

  const handleMouseUp = () => { setIsDraggingCamera(false); };

  const handleWheel = (e: React.WheelEvent) => {
    const direction = e.deltaY < 0 ? 1 : -1;
    setCamera(prev => ({
      ...prev,
      zoom: parseFloat(Math.max(0.4, Math.min(3.0, prev.zoom + direction * 0.05)).toFixed(2))
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (shouldIgnoreTarget(e)) return;
    if (e.touches.length === 1) {
      setIsDraggingCamera(true);
      cameraDragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, yaw: camera.yaw, pitch: camera.pitch };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingCamera || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - cameraDragStartRef.current.x;
    const dy = e.touches[0].clientY - cameraDragStartRef.current.y;
    setCamera(prev => ({
      ...prev,
      yaw: (cameraDragStartRef.current.yaw + dx * 0.4) % 360,
      pitch: Math.max(15, Math.min(80, cameraDragStartRef.current.pitch + dy * 0.4))
    }));
  };

  const resetCamera = () => { setCamera({ zoom: 0.95, yaw: -35, pitch: 35 }); };

  return {
    camera,
    setCamera,
    resetCamera,
    cameraHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleMouseUp,
      onWheel: handleWheel
    }
  };
}
