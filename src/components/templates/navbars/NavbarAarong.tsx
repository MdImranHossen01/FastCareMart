"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  Mic,
  MicOff,
  LayoutDashboard,
  LogOut,
  Package,
  Truck,
  ChevronDown,
  X,
  Sparkles
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/mode-toggle';
import { useAppSelector } from '@/store/hooks';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { Logo } from '@/components/ui/logo';
import { useSettings } from '@/components/SettingsProvider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Swal from 'sweetalert2';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/blog', label: 'Blogs' },
  { href: '/contact', label: 'Contact' },
];

export default function NavbarAarong() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [megaMenuHovered, setMegaMenuHovered] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { totalQuantity: cartCount } = useAppSelector((state) => state.cart);
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
  const wishlistCount = wishlistItems.length;
  const settings = useSettings();

  const [categories, setCategories] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  // Monitor scroll for sticky style transitions
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch categories
  useEffect(() => {
    const controller = new AbortController();
    async function fetchCats() {
      try {
        const res = await fetch('/api/categories', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.filter((c: any) => c.isActive));
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Failed to fetch categories', e);
        }
      }
    }
    fetchCats();
    return () => controller.abort();
  }, []);

  // Fetch profile
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (status === 'authenticated') {
      fetch('/api/user/profile', { signal: controller.signal })
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (isMounted && data) setProfile(data);
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('Could not load user profile data');
          }
        });
    } else {
      const timer = setTimeout(() => {
        if (isMounted) {
          setProfile((prev: any) => prev !== null ? null : prev);
        }
      }, 0);
      return () => {
        isMounted = false;
        controller.abort();
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [status]);

  // Voice Search Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current = null;
      }
      setIsListening(false);
    };
  }, []);

  const getParentId = (catObj: any) => {
    if (!catObj.parentCategory) return null;
    if (typeof catObj.parentCategory === 'object') {
      return catObj.parentCategory._id;
    }
    return catObj.parentCategory;
  };

  // Reverse the main categories so they appear in chronological order (Women, Men, Kids', Home Décor...)
  const mainCategories = categories.filter(c => !getParentId(c)).reverse();

  const getSubcategories = (catId: string) => {
    return categories.filter(c => getParentId(c) === catId);
  };

  const getChildren = (subId: string) => {
    return categories.filter(c => getParentId(c) === subId);
  };

  // Live search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      debounceRef.current = setTimeout(() => {
        setLiveResults([]);
        setShowDropdown(false);
      }, 0);
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setLiveResults(data.products || []);
          setShowDropdown(true);
        }
      } catch {
        // silent
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setShowDropdown(false);
      setLiveResults([]);
    }
  };

  const handleResultClick = () => {
    setShowDropdown(false);
    setSearchTerm('');
    setLiveResults([]);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Swal.fire({
        title: 'Voice Search Unsupported',
        text: 'Voice search is not supported in your browser. Please use Google Chrome for the best experience.',
        icon: 'info',
        confirmButtonColor: 'var(--primary)'
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable it in browser settings.');
      } else if (event.error === 'network') {
        toast.error('Network error. Please check your connection.');
      } else if (event.error === 'no-speech') {
        toast.info('No speech detected. Please try again.');
      }
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      router.push(`/shop?search=${encodeURIComponent(transcript.trim())}`);
    };

    recognition.start();
  };

  return (
    <>

      {/* ── Navbar Wrapper ── */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled
        ? 'bg-background/90 backdrop-blur-md shadow-md border-b border-border/30 py-2'
        : 'bg-background py-3'
        }`}>
        <div className="w-full px-4 lg:px-6 relative">
          
          {/* ── Mobile Layout (Single Row) ── */}
          <div className="flex items-center justify-between gap-4 lg:hidden">
            {/* Mobile Burger Menu */}
            <div className="flex items-center">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-6 overflow-y-auto bg-background text-foreground border-r border-border">
                  <div className="mb-8 flex items-center justify-between">
                    <Logo />
                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex flex-col gap-6">
                    {/* Public Links */}
                    <div className="flex flex-col gap-3 font-semibold uppercase tracking-wider text-sm">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`hover:text-primary transition-colors py-2 ${pathname === item.href ? 'text-primary' : ''}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="h-px bg-border my-2" />

                    {/* Categories Accordion */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Categories</h4>
                      <Accordion type="single" collapsible className="w-full">
                        {mainCategories.map((cat) => {
                          const subs = getSubcategories(cat._id);
                          if (subs.length === 0) {
                            return (
                              <Link
                                key={cat._id}
                                href={`/shop?category=${cat.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="block py-3 text-sm font-semibold uppercase tracking-wide hover:text-primary"
                              >
                                {cat.name}
                              </Link>
                            );
                          }
                          return (
                            <AccordionItem key={cat._id} value={cat._id} className="border-none">
                              <AccordionTrigger className="py-3 text-sm font-semibold uppercase tracking-wide hover:text-primary hover:no-underline">
                                {cat.name}
                              </AccordionTrigger>
                              <AccordionContent className="pl-4 pb-2 flex flex-col gap-2">
                                <Link
                                  href={`/shop?category=${cat.slug}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="text-xs font-bold text-muted-foreground hover:text-primary py-1 uppercase tracking-wider"
                                >
                                  All {cat.name}
                                </Link>
                                {subs.map((sub) => (
                                  <Link
                                    key={sub._id}
                                    href={`/shop?category=${sub.slug}`}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-xs font-bold text-muted-foreground hover:text-primary py-1 uppercase tracking-wider"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo />
            </div>

            {/* Mobile Utilities */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleVoiceSearch}
                aria-label="Voice Search"
                aria-pressed={isListening}
                className={`p-2 rounded-full hover:bg-muted text-foreground ${isListening ? 'text-primary animate-pulse bg-primary/10' : ''}`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <CartDrawer>
                <button className="relative p-2 text-foreground hover:text-primary transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 min-w-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center shadow-md">
                      {cartCount}
                    </span>
                  )}
                </button>
              </CartDrawer>
              <ModeToggle />
            </div>
          </div>

          {/* ── Desktop Layout (Two Rows next to Left Spanning Logo) ── */}
          <div className="hidden lg:flex gap-3 items-stretch">
            
            {/* Logo Image Column (Spanning both rows) */}
            <div className="flex items-center justify-center border-r border-border/10 pr-3 shrink-0 py-1">
              <Link href="/" className="relative block w-[85px] h-[85px] transition-transform hover:scale-105">
                <Image
                  src={settings.logoUrl || "/logo.webp"}
                  alt={`${settings.brandName || "Fast Care Mart"} Logo`}
                  fill
                  sizes="85px"
                  className="object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Content Column (Row 1 and Row 2) */}
            <div className="flex-1 flex flex-col justify-between py-1">
              
              {/* Row 1: Logo Brand Name, Sub-Brands, Utilities */}
              <div className="flex items-center justify-between w-full border-b border-border/10 pb-2 gap-4">
                {/* Logo Brand Name Text Only */}
                <Link href="/" className="text-xl xl:text-2xl uppercase text-foreground transition-colors hover:text-primary font-black tracking-tighter font-logo shrink-0">
                  {settings.brandName || "FAST CARE MART"}
                </Link>

                {/* Right-side Utilities */}
                <div className="flex items-center gap-3">
                  {/* Search Bar Container */}
                  <div ref={searchContainerRef} className="relative">
                    <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                      <input
                        type="text"
                        placeholder={isListening ? "Listening..." : "Search products..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48 xl:w-60 h-9 pl-9 pr-8 text-xs bg-muted/40 border border-border/70 focus:border-primary focus:bg-background outline-none rounded-full transition-all"
                      />
                      <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />

                      <button
                        type="button"
                        onClick={handleVoiceSearch}
                        aria-label="Voice Search"
                        className={`absolute right-2.5 p-1 rounded-full text-muted-foreground hover:text-primary transition-colors ${isListening ? 'text-primary animate-pulse bg-primary/10' : ''}`}
                      >
                        {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </form>

                    {/* Live Search Dropdown */}
                    {showDropdown && liveResults.length > 0 && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border shadow-xl rounded-none overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/10">
                          Matches Found
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                          {liveResults.map((prod) => (
                            <Link
                              key={prod._id}
                              href={`/product/${prod.slug}`}
                              onClick={handleResultClick}
                              className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors"
                            >
                              <div className="relative h-10 w-10 flex-shrink-0 bg-muted">
                                <Image
                                  src={prod.images?.[0] || '/placeholder.png'}
                                  alt={prod.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold text-foreground truncate uppercase tracking-wide">
                                  {prod.name}
                                </h5>
                                <p className="text-[10px] font-black text-primary mt-0.5">
                                  ৳ {(prod.salePrice ?? prod.price).toLocaleString()}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href={`/shop?search=${encodeURIComponent(searchTerm)}`}
                          onClick={handleResultClick}
                          className="block text-center text-xs font-black uppercase tracking-widest text-primary p-2.5 border-t border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          See All Matches
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Wishlist Link */}
                  <Link href="/dashboard/wishlist" className="relative p-2 text-foreground hover:text-primary transition-colors">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 min-w-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow-md">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  {/* Cart Drawer */}
                  <CartDrawer>
                    <button className="relative p-2 text-foreground hover:text-primary transition-colors">
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 min-w-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center shadow-md">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  </CartDrawer>

                  {/* Theme Toggle */}
                  <ModeToggle />

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative rounded-full text-foreground hover:text-primary">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mt-2 rounded-none border border-border shadow-xl bg-background text-foreground" align="end">
                      {status === 'authenticated' ? (
                        <>
                          <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground p-3">
                            My Account
                            <div className="text-[10px] text-foreground lowercase font-normal mt-0.5 truncate">{profile?.email || session.user?.email}</div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild className="p-2.5 text-xs font-bold uppercase tracking-wider hover:bg-muted focus:bg-muted cursor-pointer">
                              <Link href="/dashboard/profile" className="flex items-center w-full">
                                <User className="mr-2 h-4 w-4 text-primary" /> Profile Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="p-2.5 text-xs font-bold uppercase tracking-wider hover:bg-muted focus:bg-muted cursor-pointer">
                              <Link href="/dashboard" className="flex items-center w-full">
                                <Package className="mr-2 h-4 w-4 text-primary" /> Order History
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="p-2.5 text-xs font-bold uppercase tracking-wider hover:bg-muted focus:bg-muted cursor-pointer">
                              <Link href="/track-order" className="flex items-center w-full">
                                <Truck className="mr-2 h-4 w-4 text-primary" /> Track My Order
                              </Link>
                            </DropdownMenuItem>
                            {(session.user as any)?.role === 'admin' || (session.user as any)?.role === 'super_admin' ? (
                              <DropdownMenuItem asChild className="p-2.5 text-xs font-black uppercase tracking-wider hover:bg-muted focus:bg-muted cursor-pointer text-primary">
                                <Link href="/admin/dashboard" className="flex items-center w-full">
                                  <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Controls
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            onClick={() => {
                              signOut({ callbackUrl: '/login' });
                              toast.success('Logged out successfully');
                            }}
                            className="p-2.5 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer"
                          >
                            <LogOut className="mr-2 h-4 w-4" /> Log Out
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground p-3">
                            Guest
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem asChild className="p-2.5 text-xs font-bold uppercase tracking-wider hover:bg-muted focus:bg-muted cursor-pointer">
                            <Link href="/login" className="flex items-center w-full">
                              <User className="mr-2 h-4 w-4 text-primary" /> Log In
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="p-2.5 text-xs font-bold uppercase tracking-wider hover:bg-muted focus:bg-muted cursor-pointer">
                            <Link href="/register" className="flex items-center w-full">
                              <User className="mr-2 h-4 w-4 text-primary" /> Sign Up
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="p-2.5 text-xs font-bold uppercase tracking-wider hover:bg-muted focus:bg-muted cursor-pointer">
                            <Link href="/track-order" className="flex items-center w-full">
                              <Truck className="mr-2 h-4 w-4 text-primary" /> Track Order
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Row 2: Category Navigation Menu */}
              <div className="flex pt-1 pb-1">
                <nav className="flex items-center gap-6 xl:gap-8">
                  {mainCategories.map((cat) => {
                    const subs = getSubcategories(cat._id);
                    return (
                      <div
                        key={cat._id}
                        className="py-1"
                        onMouseEnter={() => setMegaMenuHovered(cat._id)}
                        onMouseLeave={() => setMegaMenuHovered(null)}
                      >
                        <Link
                          href={`/shop?category=${cat.slug}`}
                          className="text-xs font-black uppercase tracking-[0.18em] text-foreground/80 hover:text-primary transition-all flex items-center"
                        >
                          {cat.name}
                        </Link>

                        {/* Mega Menu Dropdown */}
                        {subs.length > 0 && megaMenuHovered === cat._id && (
                          <div className="absolute top-full left-0 right-0 w-full bg-background border-t border-b border-border shadow-2xl rounded-none p-6 flex gap-6 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            {/* Subcategories columns (Left part) */}
                            <div className="flex-1 grid grid-cols-4 gap-6 max-h-[400px] overflow-y-auto pr-2">
                              {subs.map((sub) => {
                                const children = getChildren(sub._id);
                                return (
                                  <div key={sub._id} className="space-y-2">
                                    <Link
                                      href={`/shop?category=${sub.slug}`}
                                      className="text-xs font-black uppercase tracking-wider text-foreground hover:text-primary transition-colors block"
                                    >
                                      {sub.name}
                                    </Link>
                                    {children.length > 0 && (
                                      <div className="flex flex-col gap-1">
                                        {children.map((child) => (
                                          <Link
                                            key={child._id}
                                            href={`/shop?category=${child.slug}`}
                                            className="text-[11px] text-muted-foreground hover:text-primary transition-colors block py-0.5"
                                          >
                                            {child.name}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Right part: Category Banner Image (like Aarong) */}
                            {cat.image && (
                              <div className="w-[200px] h-[280px] relative hidden xl:block flex-shrink-0 bg-muted">
                                <Image
                                  src={cat.image}
                                  alt={cat.name}
                                  fill
                                  sizes="200px"
                                  className="object-cover"
                                  priority
                                />
                                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors duration-300" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>

            </div>

          </div>

          {/* Mobile Search Input Strip */}
          <div className="lg:hidden mt-3 relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs bg-muted/40 border border-border/75 focus:border-primary outline-none rounded-full"
              />
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </form>
          </div>
        </div>
      </header>
    </>
  );
}
