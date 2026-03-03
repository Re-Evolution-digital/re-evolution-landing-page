'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { slideUp, viewportConfig } from '@/lib/animations';
import { trackFormSubmit, trackCTA } from '@/lib/analytics';
import Button from '@/components/ui/Button';
import { brandify } from '@/lib/brand';
import Logo from '@/components/ui/Logo';

interface FormData {
  name: string;
  email: string;
  phone: string;
  businessType: string;
  challenge: string;
  budget: string;
  urgency: string;
  privacy: boolean;
}

export default function CTAForm() {
  const t = useTranslations('ctaForm');
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>();

  const businessTypes = t.raw('business_types') as string[];
  const budgetOptions = t.raw('budget_options') as string[];
  const urgencyOptions = t.raw('urgency_options') as string[];

  const onSubmit = async (data: FormData) => {
    trackCTA('DiagnosticForm');
    trackFormSubmit(data.budget);

    const res = await fetch('/api/submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, locale }),
    });

    if (!res.ok) throw new Error('Erro ao submeter formulário');

    setSubmittedEmail(data.email);
    setSubmitted(true);
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-white/[0.08] border border-white/15 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-re-yellow/40 focus:border-re-yellow/50 transition-colors text-sm';
  const labelClass = 'block text-xs font-semibold text-white/90 mb-1';
  const errorClass = 'text-xs text-red-400 mt-1';

  return (
    <section
      id="diagnostico"
      className="relative py-16 md:py-20 overflow-hidden"
    >
      {/* Background image + gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#061f5c] via-re-dark-blue to-[#0a3590]" />
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat bg-fixed opacity-25"
        style={{ backgroundImage: 'url(/images/diagnostico-gratuito-background.png)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-circuit" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="2" fill="#007AFF" />
              <circle cx="0" cy="0" r="1.5" fill="#f3be1b" />
              <circle cx="120" cy="120" r="1.5" fill="#f3be1b" />
              <line x1="60" y1="0" x2="60" y2="58" stroke="#007AFF" strokeWidth="0.5" />
              <line x1="62" y1="60" x2="120" y2="60" stroke="#007AFF" strokeWidth="0.5" />
              <line x1="0" y1="2" x2="0" y2="60" stroke="#f3be1b" strokeWidth="0.4" />
              <line x1="0" y1="60" x2="58" y2="60" stroke="#f3be1b" strokeWidth="0.4" />
              <rect x="30" y="30" width="8" height="8" rx="1" fill="none" stroke="#007AFF" strokeWidth="0.5" opacity="0.5" />
              <rect x="90" y="90" width="6" height="6" rx="1" fill="none" stroke="#f3be1b" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-circuit)" />
        </svg>
      </div>

      {/* Accent glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-re-yellow/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-re-blue/15 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-8"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <div className="flex justify-center mb-3">
            <Logo size={48} />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            {brandify(t('title'))}
          </h2>
          <p className="text-base text-white/70 max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {submitted ? (
            <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
              <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t('success_title')}
              </h3>
              <p className="text-white/70 text-sm">
                {t('success_message', { email: submittedEmail })}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-5 md:p-8 border border-white/10 space-y-4"
              noValidate
            >
              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    {t('fields.name')} *
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={inputClass}
                    {...register('name', { required: t('errors.required') })}
                  />
                  {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    {t('fields.email')} *
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={inputClass}
                    {...register('email', {
                      required: t('errors.required'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('errors.email_invalid')
                      }
                    })}
                  />
                  {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                </div>
              </div>

              {/* Row 2: Phone + Business Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    {t('fields.phone')} *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={inputClass}
                    {...register('phone', {
                      required: t('errors.required'),
                      pattern: {
                        value: /^(\+351)?\s?9\d{8}$/,
                        message: t('errors.phone_invalid')
                      }
                    })}
                  />
                  {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
                </div>
                <div>
                  <label htmlFor="businessType" className={labelClass}>
                    {t('fields.business_type')} *
                  </label>
                  <select
                    id="businessType"
                    className={`${inputClass} appearance-none`}
                    {...register('businessType', { required: t('errors.required') })}
                    defaultValue=""
                  >
                    <option value="" disabled>---</option>
                    {businessTypes.map((type: string, idx: number) => (
                      <option key={idx} value={type} className="bg-re-dark-blue text-white">{type}</option>
                    ))}
                  </select>
                  {errors.businessType && <p className={errorClass}>{errors.businessType.message}</p>}
                </div>
              </div>

              {/* Challenge */}
              <div>
                <label htmlFor="challenge" className={labelClass}>
                  {t('fields.challenge')} *
                </label>
                <textarea
                  id="challenge"
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder={t('fields.challenge_placeholder')}
                  {...register('challenge', { required: t('errors.required') })}
                />
                {errors.challenge && <p className={errorClass}>{errors.challenge.message}</p>}
              </div>

              {/* Budget + Urgency side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset>
                  <legend className={labelClass}>{t('fields.budget')} *</legend>
                  <div className="space-y-1.5 mt-1">
                    {budgetOptions.map((option: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={option}
                          className="w-3.5 h-3.5 accent-re-yellow"
                          {...register('budget', { required: t('errors.required') })}
                        />
                        <span className="text-xs text-white/70">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.budget && <p className={errorClass}>{errors.budget.message}</p>}
                </fieldset>

                <fieldset>
                  <legend className={labelClass}>{t('fields.urgency')} *</legend>
                  <div className="space-y-1.5 mt-1">
                    {urgencyOptions.map((option: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={option}
                          className="w-3.5 h-3.5 accent-re-yellow"
                          {...register('urgency', { required: t('errors.required') })}
                        />
                        <span className="text-xs text-white/70">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.urgency && <p className={errorClass}>{errors.urgency.message}</p>}
                </fieldset>
              </div>

              {/* Privacy */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 mt-0.5 accent-re-yellow"
                    {...register('privacy', { required: t('errors.required') })}
                  />
                  <span className="text-xs text-white/60">
                    {t('fields.privacy')} *{' '}
                    <a href={`/${locale}/politica-privacidade`} className="text-re-yellow hover:underline" target="_blank" rel="noopener noreferrer">
                      →
                    </a>
                  </span>
                </label>
                {errors.privacy && <p className={errorClass}>{errors.privacy.message}</p>}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="md"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="w-full !bg-re-yellow !text-re-dark-blue hover:!bg-[#e0ad10]"
              >
                {isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
