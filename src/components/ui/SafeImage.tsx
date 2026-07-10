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
  [key: string]: any;
}

/**
 * Pembungkus <img> dengan penanganan error: bila src kosong atau gagal dimuat
 * (broken link), tampilkan ikon ImageOff alih-alih ikon "broken image" bawaan
 * browser. className diteruskan ke kedua kondisi agar tata letak konsisten.
 */
export function SafeImage({ src, alt, className, fallbackClassName, ...props }: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  // Reset status error bila src berganti (mis. modal zoom dipakai ulang).
  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (errored || !src) {
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
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...props}
    />
  );
}
