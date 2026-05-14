'use client';

export default function PixelLoader() {
  return (
    <div className="fixed inset-0 bg-[#141315] flex flex-col items-center justify-center gap-6 z-50">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Coin icon */}
        <div className="w-16 h-16 bg-[#a5d655] border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-[#223600] stroke-2" strokeLinecap="square" strokeLinejoin="miter">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 7v2M12 15v2M9.5 10a2.5 2.5 0 0 1 5 0c0 1.5-1 2-2.5 2s-2.5.5-2.5 2a2.5 2.5 0 0 0 5 0" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="text-[#a5d655] uppercase tracking-tight leading-none font-extrabold text-2xl" style={{ fontFamily: 'var(--font-anybody)' }}>
            Pixel Pocket
          </p>
          <p className="text-[#8d937f] text-[10px] mt-1 tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
            LOADING...
          </p>
        </div>

        {/* Pixel progress bar */}
        <div className="w-48 bg-[#1c1b1e] border-4 border-black flex items-center gap-[3px] p-[3px] h-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-full bg-[#a5d655]"
              style={{
                animation: `pixel-blink 1.2s steps(1) infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pixel-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
