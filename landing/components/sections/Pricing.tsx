'use client';

import Container from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { pricingPlans, partnerProgram } from '@/content/landing';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check } from 'lucide-react';

export default function Pricing() {
  return (
    <section id="pricing" className="section-pad">
      <Container>
        <SectionHeader
          label="Planes"
          title="Elegi el plan que mejor se ajuste"
          description="Podes arrancar gratis y subir cuando la sala crezca."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`glass flex h-full flex-col rounded-3xl border p-6 ${
                plan.featured
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-white/10'
              }`}
            >
              {plan.tag ? <Badge>{plan.tag}</Badge> : null}
              <div className="mt-4">
                <p className="text-lg font-semibold text-text">{plan.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-text">
                    {plan.price}
                  </span>
                  {plan.suffix ? (
                    <span className="text-xs text-muted">{plan.suffix}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted">{plan.description}</p>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-accent" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button
                  href="#cta"
                  size="sm"
                  variant={plan.featured ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <Badge>Partner</Badge>
            <h3 className="mt-4 text-xl font-semibold text-text">
              {partnerProgram.title}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {partnerProgram.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted">
              {partnerProgram.perks.map((perk) => (
                <span
                  key={perk}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                >
                  {perk}
                </span>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl border border-white/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Metricas que usamos
            </p>
            <div className="mt-4 grid gap-3 text-sm text-muted">
              {partnerProgram.metrics.map((metric) => (
                <div key={metric} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{metric}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
