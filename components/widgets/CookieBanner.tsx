'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ChevronDown, ChevronUp } from 'lucide-react';

interface ConsentState {
  analytics: boolean;
  marketing: boolean;
}

function applyConsent(analytics: boolean, marketing: boolean) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied',
    });
  }
}

export default function CookieBanner() {
  const t = useTranslations('cookies');
  const locale = useLocale();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent');
    if (!stored) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
    try {
      const parsed = JSON.parse(stored) as ConsentState;
      applyConsent(parsed.analytics, parsed.marketing);
    } catch {
      // Formato legado ('accepted'/'rejected')
      if (stored === 'accepted') applyConsent(true, true);
    }
  }, []);

  const saveAndClose = (analytics: boolean, marketing: boolean) => {
    localStorage.setItem('cookie-consent', JSON.stringify({ analytics, marketing }));
    setShowBanner(false);
    applyConsent(analytics, marketing);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-border shadow-2xl"
        >
          <div className="max-w-5xl mx-auto p-4 md:p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <Cookie className="w-5 h-5 text-re-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-base text-text-primary mb-0.5">{t('title')}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t('description')}{' '}
                  <a
                    href={`/${locale}/politica-privacidade`}
                    className="text-re-blue hover:underline font-medium"
                  >
                    {t('privacy_link')}
                  </a>.
                </p>
              </div>
            </div>

            {/* Categorias granulares (expansível) */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border border-border rounded-lg mb-3 divide-y divide-border">
                    {/* Essenciais */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{t('categories.essential.title')}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{t('categories.essential.description')}</p>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-4 flex-shrink-0">
                        {t('always_active')}
                      </span>
                    </div>

                    {/* Analíticos */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{t('categories.analytics.title')}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{t('categories.analytics.description')}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={analyticsEnabled}
                        onClick={() => setAnalyticsEnabled(v => !v)}
                        className={`relative ml-4 flex-shrink-0 w-10 h-5 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-re-blue/40 ${analyticsEnabled ? 'bg-re-blue' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${analyticsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Marketing */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{t('categories.marketing.title')}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{t('categories.marketing.description')}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={marketingEnabled}
                        onClick={() => setMarketingEnabled(v => !v)}
                        className={`relative ml-4 flex-shrink-0 w-10 h-5 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-re-blue/40 ${marketingEnabled ? 'bg-re-blue' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${marketingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botões de ação */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                onClick={() => saveAndClose(false, false)}
                className="px-4 py-2 border-2 border-border rounded-lg text-text-secondary text-sm font-medium hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                {t('reject_all')}
              </button>
              <button
                onClick={() => setShowDetails(v => !v)}
                className="flex items-center gap-1 px-4 py-2 border-2 border-re-blue/30 rounded-lg text-re-blue text-sm font-medium hover:bg-re-blue/5 transition-colors cursor-pointer"
              >
                {t('customize')}
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showDetails && (
                <button
                  onClick={() => saveAndClose(analyticsEnabled, marketingEnabled)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  {t('save_preferences')}
                </button>
              )}
              <button
                onClick={() => saveAndClose(true, true)}
                className="px-4 py-2 bg-re-blue text-white rounded-lg text-sm font-medium hover:bg-[#0056CC] transition-colors cursor-pointer"
              >
                {t('accept_all')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
