/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface Banner {
  _id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  link?: string;
  primaryBtnText?: string;
  primaryBtnLink?: string;
  secondaryBtnText?: string;
  secondaryBtnLink?: string;
}

interface HeroSliderProps {
  banners: Banner[];
  layout?: string;
}

const AUTOPLAY_DELAY = 5000;

export default function HeroAarong({ banners, layout }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = banners && banners.length > 0 ? banners : null;

  // Initialize Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 40,
    },
    [Autoplay({ delay: AUTOPLAY_DELAY, stopOnInteraction: false })]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    // Defer the initial selection update to avoid synchronous setState during render/effect phase
    const timeoutId = setTimeout(() => {
      onSelect();
    }, 0);
    
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      clearTimeout(timeoutId);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  // Fallback slides if DB is empty
  const defaultSlides: Banner[] = [
    {
      _id: 'default-1',
      title: 'Summer reset',
      subtitle: 'Summer/26 collection',
      image: '/placeholder.png', // Fallback
      link: '/shop',
      primaryBtnText: 'SHOP NOW',
      primaryBtnLink: '/shop'
    },
    {
      _id: 'default-2',
      title: 'Grounded in grace',
      subtitle: 'Summer/26 collection',
      image: '/placeholder.png', // Fallback
      link: '/shop',
      primaryBtnText: 'SHOP NOW',
      primaryBtnLink: '/shop'
    }
  ];

  const activeSlides = slides || defaultSlides;

  return (
    <div className="relative w-full h-[65vh] sm:h-[80vh] md:h-[90vh] lg:h-[95vh] overflow-hidden bg-muted group">
      
      {/* Embla Viewport */}
      <div className="w-full h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {activeSlides.map((slide, index) => (
            <div key={slide._id || index} className="relative flex-none w-full h-full select-none">
              
              {/* Slide Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={slide.image || '/placeholder.png'}
                  alt={slide.title || 'Aarong Collection'}
                  fill
                  className="object-cover w-full h-full object-center"
                  priority={index === 0}
                />
                {/* Subtle dark overlay for readability */}
                <div className="absolute inset-0 bg-black/15" />
              </div>

              {/* Aarong Elegant Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end items-center text-center pb-20 sm:pb-28 md:pb-36 px-4 z-10">
                <AnimatePresence mode="wait">
                  {activeIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="max-w-2xl space-y-4"
                    >
                      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-playfair tracking-tight text-white leading-tight drop-shadow-md">
                        {slide.title}
                      </h1>
                      {slide.subtitle && (
                        <p className="text-sm sm:text-base md:text-lg font-medium tracking-widest text-white/90 drop-shadow-sm uppercase">
                          {slide.subtitle}
                        </p>
                      )}
                      
                      <div className="pt-4 flex justify-center">
                        <Link
                          href={slide.primaryBtnLink || slide.link || '/shop'}
                          className="px-8 py-3.5 bg-black text-white hover:bg-neutral-900 border border-black text-xs font-black uppercase tracking-[0.25em] transition duration-300 shadow-xl"
                        >
                          {slide.primaryBtnText || 'SHOP NOW'}
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-white/20 bg-black/20 hover:bg-black/45 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-white/20 bg-black/20 hover:bg-black/45 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

    </div>
  );
}
