'use client';

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { cta } from '@/content/landing';
import { trackEvent } from '@/lib/analytics';

export default function FinalCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const waitlistJoined = localStorage.getItem('waitlist_joined');
      if (waitlistJoined) {
        setStatus('success');
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      if (typeof window !== 'undefined') {
        localStorage.setItem('waitlist_joined', 'true');
      }
      trackEvent('waitlist_submit', {
        location: 'cta_final'
      });
    }, 1000);
  };

  return (
    <section id="cta" className="section-pad">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 p-10 text-center">
          <div className="absolute inset-0 bg-[length:200%_200%] opacity-40" />
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-4">
            <h2 className="font-display text-3xl font-semibold text-text md:text-4xl">
              {status === 'success' ? '¡Gracias por sumarte!' : cta.title}
            </h2>
            <p className="text-base text-muted md:text-lg">
              {status === 'success' 
                ? 'Te estaremos avisando por correo cuando tu acceso esté listo.' 
                : cta.description}
            </p>
            
            {status !== 'success' && (
              <form 
                onSubmit={handleSubmit}
                className="mt-2 flex w-full max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  placeholder="Tu mejor email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={status === 'loading'}
                  className={status === 'loading' ? 'w-full sm:w-auto animate-pulse' : 'w-full sm:w-auto'}
                >
                  {status === 'loading' ? 'Enviando...' : cta.button}
                </Button>
              </form>
            )}

            {status !== 'success' && (
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted">
                Beta privada - cupos limitados
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
