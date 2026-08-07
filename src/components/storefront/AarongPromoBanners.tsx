'use client';

import Link from 'next/link';
import Image from 'next/image';

export function AarongPromoBanners() {
  const leftImage = '/assets/images/ArongSections/D-Left-Living-Box-Banner1_24-02-2026-SM.webp';
  const rightImage = '/assets/images/ArongSections/D-Right-Dining-box-banner1-22-07-2025-SM.webp';

  return (
    <section className="w-full bg-background py-1">
      <div className="w-full px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
          
          {/* Left Banner */}
          <Link 
            href="/shop?category=home-decor" 
            className="group relative block aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/11] xl:aspect-[16/10] overflow-hidden bg-muted"
          >
            <Image
              src={leftImage}
              alt="Bronze ballad"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-105"
              priority
            />
            {/* Subtle Overlay */}
            <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/20" />
            
            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-12 text-center text-white px-4">
              <h3 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold tracking-wide font-serif mb-1 drop-shadow-sm">
                Bronze ballad
              </h3>
              <p className="text-xs sm:text-sm font-light tracking-widest uppercase mb-4 opacity-90">
                Explore living
              </p>
              <span className="inline-block bg-black text-white hover:bg-neutral-900 transition-colors px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em]">
                SHOP NOW
              </span>
            </div>
          </Link>

          {/* Right Banner */}
          <Link 
            href="/shop?category=home-decor" 
            className="group relative block aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/11] xl:aspect-[16/10] overflow-hidden bg-muted"
          >
            <Image
              src={rightImage}
              alt="Tales in taupe"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-105"
              priority
            />
            {/* Subtle Overlay */}
            <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/20" />
            
            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-12 text-center text-white px-4">
              <h3 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold tracking-wide font-serif mb-1 drop-shadow-sm">
                Tales in taupe
              </h3>
              <p className="text-xs sm:text-sm font-light tracking-widest uppercase mb-4 opacity-90">
                Explore dining
              </p>
              <span className="inline-block bg-black text-white hover:bg-neutral-900 transition-colors px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em]">
                SHOP NOW
              </span>
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
}
