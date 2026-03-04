'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Linkedin, Instagram, Facebook } from 'lucide-react';
import { brandify } from '@/lib/brand';
import Logo from '@/components/ui/Logo';

const navLinks = [
  { key: 'services', href: '#servicos' },
  { key: 'portfolio', href: '#portfolio' },
  { key: 'process', href: '#processo' },
  { key: 'pricing', href: '#precos' },
  { key: 'contact', href: '#contacto' }
];

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('header');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  async function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      const data = await res.json();
      if (data.duplicate) setStatus('duplicate');
      else if (res.ok && data.success) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <footer className="relative bg-re-dark-blue text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Logo size={34} />
              <div className="flex items-baseline">
                <span className="text-2xl font-extrabold text-re-yellow">Re-</span>
                <span className="text-2xl font-extrabold text-re-blue">Evolution</span>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-4">{t('tagline')}</p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-white/80" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-white/80" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-white/80" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-white font-bold mb-4">{t('navigation')}</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-re-yellow hover:underline transition-colors"
                  >
                    {tNav(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold mb-4">{t('legal')}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`/${locale}/politica-privacidade`}
                  className="text-sm text-white/60 hover:text-re-yellow hover:underline transition-colors"
                >
                  {t('privacy_policy')}
                </a>
              </li>
              <li>
                <a
                  href={`/${locale}/termos-servico`}
                  className="text-sm text-white/60 hover:text-re-yellow hover:underline transition-colors"
                >
                  {t('terms')}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-bold mb-4">{t('newsletter_title')}</h3>
            {status === 'success' ? (
              <p className="text-sm text-re-yellow">{locale === 'pt' ? '✓ Subscrito com sucesso!' : '✓ Subscribed successfully!'}</p>
            ) : status === 'duplicate' ? (
              <p className="text-sm text-re-yellow/80">{locale === 'pt' ? 'Este email já está subscrito.' : 'This email is already subscribed.'}</p>
            ) : (
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('newsletter_placeholder')}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-re-yellow"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-4 py-2 bg-re-yellow text-re-dark-blue text-sm font-semibold rounded-lg hover:bg-re-yellow/90 transition-colors disabled:opacity-60"
                >
                  {status === 'loading' ? '...' : t('newsletter_submit')}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="text-xs text-red-400 mt-1">{locale === 'pt' ? 'Erro. Tenta novamente.' : 'Error. Please try again.'}</p>
            )}
            <p className="text-xs text-white/50 mt-2">{t('newsletter_description')}</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-white/60">
            © 2025 <span className="font-bold text-re-yellow">Re-</span><span className="font-bold text-re-blue">Evolution</span>, Digital Services. {locale === 'pt' ? 'Todos os direitos reservados.' : 'All rights reserved.'}
          </p>
          <p className="text-xs text-white/40 mt-1">{brandify(t('made_with'))}</p>
        </div>
      </div>
    </footer>
  );
}
