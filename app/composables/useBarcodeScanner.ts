import { ref, computed, onBeforeUnmount } from "vue";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export function useBarcodeScanner(options: {
  elementId: string;
  pauseDuration?: number;
  onScan: (barcode: string, done: () => void) => void;
  onError?: (error: string) => void;
}) {
  const { elementId, pauseDuration = 1800, onScan, onError } = options;

  let instance: Html5Qrcode | null = null;
  const isPaused = ref(false);
  const errorMessage = ref("");
  const zoomSupported = ref(false);
  const currentZoom = ref(1);
  const zoomMin = ref(1);
  const zoomMax = ref(1);

  const isActive = computed(() => instance?.isScanning ?? false);

  const getVideoTrack = (): MediaStreamTrack | null => {
    const videoEl = document.querySelector(
      `#${elementId} video`,
    ) as HTMLVideoElement | null;
    if (!videoEl?.srcObject) return null;
    return (videoEl.srcObject as MediaStream).getVideoTracks()[0] ?? null;
  };

  const getErrorMessage = (err: any): string => {
    if (!window.isSecureContext) {
      return "يجب تشغيل هذا النظام عبر رابط آمن HTTPS لتفعيل الكاميرا.";
    }
    const name = err?.name;
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "تم رفض صلاحية الكاميرا. يرجى تفعيلها من إعدادات المتصفح.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "لم يتم العثور على كاميرا خلفية متوافقة.";
    }
    return `تعذر تشغيل الكاميرا: ${err?.message || err}`;
  };

  const checkZoomCapability = async () => {
    const track = getVideoTrack();
    if (!track) return;
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: { min: number; max: number; step?: number };
    };
    if (capabilities?.zoom) {
      zoomSupported.value = true;
      zoomMin.value = capabilities.zoom.min;
      zoomMax.value = capabilities.zoom.max;
      currentZoom.value = capabilities.zoom.min;
    }
  };

  const applyZoom = async (value: number) => {
    const track = getVideoTrack();
    if (!track) return;
    await track.applyConstraints({
      advanced: [{ zoom: value }] as unknown as MediaTrackConstraintSet[],
    });
    currentZoom.value = value;
  };

  const playBeep = () => {
    try {
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
    )();
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio feedback failed:", e);
    }
  };

  const resetPause = () => {
    isPaused.value = false;
  };

  const start = async () => {
    errorMessage.value = "";
    try {
      instance = new Html5Qrcode(elementId);

      const config = {
        fps: 10,
        qrbox: { width: 280, height: 140 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      };

      await instance.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (isPaused.value) return;
          isPaused.value = true;
          playBeep();
          onScan(decodedText, resetPause);
        },
        () => {},
      );

      await checkZoomCapability();
    } catch (err: any) {
      const msg = getErrorMessage(err);
      errorMessage.value = msg;
      onError?.(msg);
      instance = null;
    }
  };

  const stop = async () => {
    if (instance && instance.isScanning) {
      try {
        await instance.stop();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    instance = null;
    zoomSupported.value = false;
    currentZoom.value = 1;
  };

  onBeforeUnmount(async () => {
    await stop();
  });

  return {
    isActive,
    isPaused,
    errorMessage,
    zoomSupported,
    currentZoom,
    zoomMin,
    zoomMax,
    start,
    stop,
    applyZoom,
    getVideoTrack,
  };
}
