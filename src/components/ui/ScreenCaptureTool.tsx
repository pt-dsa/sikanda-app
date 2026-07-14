import React, { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Clipboard, Download, RefreshCw, Share2, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type CaptureSize = { width: number; height: number };
type CropRect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

function normalizedRect(start: Point, end: Point): CropRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

async function imageFromUrl(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

export function ScreenCaptureTool({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [size, setSize] = useState<CaptureSize>({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl("");
    setCrop(null);
    setDragStart(null);
  }, [open]); // imageUrl sengaja tidak menjadi dependency agar URL dibersihkan saat modal ditutup.

  const cropStyle = useMemo(() => {
    if (!crop || !size.width || !size.height) return undefined;
    return {
      left: `${(crop.x / size.width) * 100}%`,
      top: `${(crop.y / size.height) * 100}%`,
      width: `${(crop.width / size.width) * 100}%`,
      height: `${(crop.height / size.height) * 100}%`,
    };
  }, [crop, size]);

  const pointFromEvent = (event: React.PointerEvent): Point | null => {
    const element = previewRef.current;
    if (!element || !size.width || !size.height) return null;
    const bounds = element.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(size.width, ((event.clientX - bounds.left) / bounds.width) * size.width)),
      y: Math.max(0, Math.min(size.height, ((event.clientY - bounds.top) / bounds.height) * size.height)),
    };
  };

  const startCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Capture Tidak Didukung", "Gunakan Chrome/Edge terbaru melalui HTTPS.");
      return;
    }
    setBusy(true);
    let stream: MediaStream | null = null;
    document.body.classList.add("sikanda-capture-active");
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      if (!video.videoWidth || !video.videoHeight) {
        await new Promise<void>((resolve) => video.addEventListener("loadedmetadata", () => resolve(), { once: true }));
      }
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
      if (!blob) throw new Error("Gambar capture tidak dapat dibuat.");
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      const nextUrl = URL.createObjectURL(blob);
      setImageUrl(nextUrl);
      setSize({ width: canvas.width, height: canvas.height });
      setCrop({ x: 0, y: 0, width: canvas.width, height: canvas.height });
    } catch (error: any) {
      if (error?.name !== "NotAllowedError") {
        toast.error("Capture Gagal", error?.message || "Layar belum berhasil dicapture.");
      }
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      document.body.classList.remove("sikanda-capture-active");
      setBusy(false);
    }
  };

  const cropBlob = async (): Promise<Blob> => {
    if (!imageUrl || !crop) throw new Error("Belum ada area capture.");
    const selected = crop.width >= 4 && crop.height >= 4 ? crop : { x: 0, y: 0, ...size };
    const image = await imageFromUrl(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(selected.width));
    canvas.height = Math.max(1, Math.round(selected.height));
    canvas.getContext("2d")?.drawImage(
      image,
      selected.x,
      selected.y,
      selected.width,
      selected.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) throw new Error("Area capture tidak dapat diproses.");
    return blob;
  };

  const fileName = () => `SIKANDA_Capture_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`;

  const download = async () => {
    try {
      const blob = await cropBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName();
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Capture Tersimpan", "PNG siap dilampirkan ke percakapan WhatsApp.");
    } catch (error: any) {
      toast.error("Penyimpanan Gagal", error?.message || "Capture belum dapat disimpan.");
    }
  };

  const copy = async () => {
    try {
      const blob = await cropBlob();
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") throw new Error("Clipboard gambar tidak didukung browser ini.");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Capture Disalin", "Tempelkan langsung ke percakapan WhatsApp.");
    } catch (error: any) {
      toast.warning("Salin Belum Tersedia", error?.message || "Gunakan tombol Simpan PNG.");
    }
  };

  const share = async () => {
    try {
      const blob = await cropBlob();
      const file = new File([blob], fileName(), { type: "image/png" });
      if (!navigator.share || !navigator.canShare?.({ files: [file] })) throw new Error("Bagikan langsung tidak didukung browser ini.");
      await navigator.share({ files: [file], title: "Capture Data SIKANDA" });
    } catch (error: any) {
      if (error?.name !== "AbortError") toast.warning("Bagikan Belum Tersedia", error?.message || "Gunakan Salin atau Simpan PNG.");
    }
  };

  if (!open) return null;
  return (
    <div className="capture-ui fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Capture Bagian Layar</h2>
            <p className="text-xs text-gray-500">Pilih tab SIKANDA, lalu tarik area yang ingin dikirim kepada pegawai.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Tutup capture"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-3 dark:bg-slate-950">
          {!imageUrl ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <Camera size={54} className="mb-4 text-blue-600" />
              <p className="max-w-lg text-sm text-gray-600 dark:text-gray-300">Browser akan meminta sumber layar. Pilih tab SIKANDA agar hasil tajam dan hanya berisi data yang sedang diperiksa.</p>
              <button type="button" onClick={startCapture} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Camera size={17} />{busy ? "Mengambil..." : "Mulai Capture"}</button>
            </div>
          ) : (
            <div
              ref={previewRef}
              className="relative mx-auto w-fit max-w-full cursor-crosshair select-none overflow-hidden border border-blue-300 bg-black shadow-lg touch-none"
              onPointerDown={(event) => {
                const point = pointFromEvent(event);
                if (!point) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragStart(point);
                setCrop({ x: point.x, y: point.y, width: 1, height: 1 });
              }}
              onPointerMove={(event) => {
                if (!dragStart) return;
                const point = pointFromEvent(event);
                if (point) setCrop(normalizedRect(dragStart, point));
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                setDragStart(null);
              }}
            >
              <img src={imageUrl} alt="Pratinjau capture" className="block max-h-[68vh] max-w-full object-contain" draggable={false} />
              {cropStyle && <div className="pointer-events-none absolute border-2 border-blue-500 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]" style={cropStyle} />}
            </div>
          )}
        </div>
        {imageUrl && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <p className="text-xs text-gray-500">Tarik ulang untuk memilih area. Capture tetap lokal di perangkat sampai Anda menyimpan atau membagikannya.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={startCapture} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold dark:border-gray-700"><RefreshCw size={14} /> Ulangi</button>
              <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold dark:border-gray-700"><Clipboard size={14} /> Salin</button>
              <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 dark:border-green-800 dark:bg-green-900/20"><Share2 size={14} /> Bagikan</button>
              <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><Download size={14} /> Simpan PNG</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
