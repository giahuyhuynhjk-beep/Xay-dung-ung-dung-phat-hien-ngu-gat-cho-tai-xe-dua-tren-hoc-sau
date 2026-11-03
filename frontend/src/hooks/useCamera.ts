import { useState, useRef, useCallback, useEffect } from 'react';
import type { UnavailableReason } from '../types/monitor';
import { CONFIG } from '../config/env';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isLoadingCamera: boolean;
  cameraError: UnavailableReason | null;
  cameraErrorMessage: string | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  captureFrameBase64: () => string | null;
}

export function useCamera(onCameraInterrupted?: (reason: UnavailableReason) => void): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<UnavailableReason | null>(null);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsLoadingCamera(false);
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    setCameraError(null);
    setCameraErrorMessage(null);
    setIsLoadingCamera(true);

    // Kiểm tra context bảo mật (HTTPS hoặc localhost)
    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const errReason: UnavailableReason = 'insecure_context';
      setCameraError(errReason);
      setCameraErrorMessage('Trình duyệt yêu cầu kết nối HTTPS để mở camera trên điện thoại.');
      setIsLoadingCamera(false);
      onCameraInterrupted?.(errReason);
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errReason: UnavailableReason = 'camera_not_found';
      setCameraError(errReason);
      setCameraErrorMessage('Trình duyệt không hỗ trợ MediaDevices API hoặc camera không khả dụng.');
      setIsLoadingCamera(false);
      onCameraInterrupted?.(errReason);
      return false;
    }

    // Dừng stream cũ nếu có
    stopCamera();

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'user' },
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Lắng nghe sự kiện track kết thúc bất thường
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setIsCameraActive(false);
          setCameraError('camera_stopped');
          setCameraErrorMessage('Luồng camera đã bị dừng bất ngờ.');
          onCameraInterrupted?.('camera_stopped');
        };
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((playErr) => {
          console.warn('Lỗi auto-play video camera:', playErr);
        });
      }

      setIsCameraActive(true);
      setIsLoadingCamera(false);
      return true;
    } catch (err: unknown) {
      setIsLoadingCamera(false);
      setIsCameraActive(false);

      let reason: UnavailableReason = 'camera_stopped';
      let message = 'Không thể truy cập camera.';

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          reason = 'camera_denied';
          message = 'Người dùng từ chối cấp quyền truy cập camera.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          reason = 'camera_not_found';
          message = 'Không tìm thấy thiết bị camera hoặc webcam.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          reason = 'camera_in_use';
          message = 'Camera đang bị ứng dụng khác chiếm dụng hoặc bị lỗi phần cứng.';
        } else {
          message = `Lỗi truy cập camera: ${err.name} - ${err.message}`;
        }
      }

      setCameraError(reason);
      setCameraErrorMessage(message);
      onCameraInterrupted?.(reason);
      return false;
    }
  }, [stopCamera, onCameraInterrupted]);

  // Hàm chụp khung hình, resize theo max width và nén JPEG base64
  const captureFrameBase64 = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    const origW = video.videoWidth;
    const origH = video.videoHeight;
    const targetW = Math.min(origW, CONFIG.FRAME_MAX_WIDTH);
    const targetH = Math.round((origH * targetW) / origW);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL('image/jpeg', CONFIG.FRAME_JPEG_QUALITY);

    // Bỏ prefix 'data:image/jpeg;base64,' để lấy chuỗi base64 thuần
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex !== -1) {
      return dataUrl.substring(commaIndex + 1);
    }
    return dataUrl;
  }, []);

  // Lắng nghe visibilitychange khi tab bị ẩn hoặc màn hình khóa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isCameraActive) {
          onCameraInterrupted?.('tab_hidden');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCameraActive, onCameraInterrupted]);

  // Dọn dẹp tài nguyên khi unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isCameraActive,
    isLoadingCamera,
    cameraError,
    cameraErrorMessage,
    startCamera,
    stopCamera,
    captureFrameBase64,
  };
}
