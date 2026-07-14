import { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props SafeImage. Proyek ini tidak memasang @types/react, sehingga tipe
 * atribut DOM React tidak tersedia. Karena itu props dideklarasikan mandiri
 * dengan index signature agar atribut <img> standar (onClick, loading, dll)
 * tetap bisa diteruskan tanpa error tipe.
 */
interface SafeImageProps {
  src?: string;
  alt?: string;
  className?: string;
  /** Kelas tambahan khusus untuk kotak fallback (opsional). */
  fallbackClassName?: string;
  /** Sumber cadangan dicoba berurutan sebelum menampilkan fallback. */
  fallbackSrcs?: string[];
  [key: string]: any;
}

/**
 * Pembungkus <img> dengan penanganan error: bila src kosong atau gagal dimuat
 * (broken link), tampilkan ikon ImageOff alih-alih ikon "broken image" bawaan
 * browser. className diteruskan ke kedua kondisi agar tata letak konsisten.
 */
export function SafeImage({ src, alt, className, fallbackClassName, fallbackSrcs = [], ...props }: SafeImageProps) {
  const driveMatch = String(src || "").match(/[?&]id=([A-Za-z0-9_-]+)/);
  const implicitFallbacks = driveMatch ? [`https://drive.google.com/uc?export=view&id=${encodeURIComponent(driveMatch[1])}`] : [];
  const sources = [src, ...fallbackSrcs, ...implicitFallbacks].filter((value, index, list): value is string => !!value && list.indexOf(value) === index);
  const [sourceIndex, setSourceIndex] = useState(0);

  // Reset status error bila src berganti (mis. modal zoom dipakai ulang).
  useEffect(() => {
    setSourceIndex(0);
  }, [src, fallbackSrcs.join("|")]);

  if (!sources[sourceIndex]) {
    return (
      <div
        role="img"
        aria-label={alt || "Gambar tidak tersedia"}
        className={cn(
          "flex flex-col items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 p-6",
          className,
          fallbackClassName
        )}
      >
        <ImageOff className="w-10 h-10" />
        <span className="text-xs">Gambar tidak tersedia</span>
      </div>
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      className={className}
      loading={props.loading || "lazy"}
      decoding={props.decoding || "async"}
      referrerPolicy={props.referrerPolicy || "no-referrer"}
      onError={() => setSourceIndex((index) => index + 1)}
      {...props}
    />
  );
}
