<script setup lang="ts">
import { ref, watch } from "vue";
import { QrcodeStream, type DetectedBarcode, type BarcodeFormat } from "vue-qrcode-reader";

const props = withDefaults(
  defineProps<{
    active?: boolean;
    pauseDuration?: number;
  }>(),
  { active: false, pauseDuration: 1800 },
);

const emit = defineEmits<{
  scan: [barcode: string];
  "update:active": [value: boolean];
  error: [message: string];
}>();

const SCANNER_ID = "qrcode-stream-scanner";

const paused = ref(false);
const error = ref("");
const zoomSupported = ref(false);
const currentZoom = ref(1);
const zoomMin = ref(1);
const zoomMax = ref(1);
let videoTrack: MediaStreamTrack | null = null;

const barcodeFormats: BarcodeFormat[] = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "qr_code",
];

function onDetect(detectedCodes: DetectedBarcode[]) {
  if (paused.value || !detectedCodes.length) return;
  const code = detectedCodes[0];
  if (!code) return;
  paused.value = true;
  playBeep();
  emit("scan", code.rawValue);
  setTimeout(() => {
    paused.value = false;
  }, props.pauseDuration);
}

function onCameraOn(caps: Partial<MediaTrackCapabilities>) {
  const video = document.querySelector<HTMLVideoElement>(
    `#${SCANNER_ID} video`,
  );
  if (video?.srcObject) {
    videoTrack =
      (video.srcObject as MediaStream).getVideoTracks()[0] ?? null;
  }
  const zoom = (caps as any).zoom as
    | { min: number; max: number }
    | undefined;
  if (zoom && videoTrack) {
    zoomSupported.value = true;
    zoomMin.value = zoom.min;
    zoomMax.value = zoom.max;
    currentZoom.value = zoom.min;
  }
}

function onError(err: Error) {
  const msg = getErrorMessage(err);
  error.value = msg;
  emit("error", msg);
  emit("update:active", false);
}

function getErrorMessage(err: { name?: string; message?: string }): string {
  if (!window.isSecureContext) {
    return "يجب تشغيل هذا النظام عبر رابط آمن HTTPS لتفعيل الكاميرا.";
  }
  if (err.name === "NotAllowedError") {
    return "تم رفض صلاحية الكاميرا. يرجى تفعيلها من إعدادات المتصفح.";
  }
  if (err.name === "NotFoundError") {
    return "لم يتم العثور على كاميرا خلفية متوافقة.";
  }
  return `تعذر تشغيل الكاميرا: ${err.message || err}`;
}

async function applyZoom(value: number) {
  if (!videoTrack) return;
  try {
    await videoTrack.applyConstraints({
      advanced: [{ zoom: value }] as unknown as MediaTrackConstraintSet[],
    });
    currentZoom.value = value;
  } catch {
    // zoom not supported for this track
  }
}

function playBeep() {
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
  } catch {
    // silent
  }
}

watch(
  () => props.active,
  (active) => {
    error.value = "";
    if (!active) {
      paused.value = false;
    }
  },
);
</script>

<template>
  <div v-show="active" class="w-full max-w-[400px] mx-auto">
    <div
      :id="SCANNER_ID"
      class="border border-outline-variant rounded-lg bg-slate-950 relative shadow-inner overflow-hidden"
    >
      <QrcodeStream
        :paused="paused"
        :formats="barcodeFormats"
        class="w-full h-[300px] block"
        @detect="onDetect"
        @camera-on="onCameraOn"
        @error="onError"
      >
        <div
          class="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div class="relative w-[280px] h-[140px]">
            <div
              class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-sky-400 rounded-tl"
            />
            <div
              class="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-sky-400 rounded-tr"
            />
            <div
              class="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-sky-400 rounded-bl"
            />
            <div
              class="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-sky-400 rounded-br"
            />
          </div>
        </div>
        <div
          v-if="zoomSupported"
          class="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10"
        >
          <span
            class="text-white text-[10px] font-bold tabular-nums drop-shadow-sm"
          >
            {{ currentZoom.toFixed(1) }}x
          </span>
          <input
            type="range"
            :min="zoomMin"
            :max="zoomMax"
            step="0.1"
            :value="currentZoom"
            @input="
              applyZoom(
                Number(($event.target as HTMLInputElement).value),
              )
            "
            class="zoom-slider"
          />
        </div>
        <div
          v-if="paused"
          class="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs"
        >
          <span
            class="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-bold animate-pulse"
            >تم التقاط الكود بنجاح...</span
          >
        </div>
      </QrcodeStream>
    </div>
    <div
      v-if="error"
      class="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[10px] font-semibold"
    >
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.zoom-slider {
  appearance: none;
  cursor: pointer;
  height: 96px;
  width: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  writing-mode: vertical-lr;
  direction: rtl;
}

.zoom-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.zoom-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 9999px;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}
</style>
