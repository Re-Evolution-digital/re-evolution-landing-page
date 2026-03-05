'use client';

import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { trackContact } from '@/lib/analytics';

export default function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/351969063633"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[998] w-14 h-14 bg-whatsapp rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: [1, 1.08, 1],
        boxShadow: [
          '0 4px 15px rgba(37, 211, 102, 0.35)',
          '0 4px 28px rgba(37, 211, 102, 0.7), 0 0 40px rgba(37, 211, 102, 0.25)',
          '0 4px 15px rgba(37, 211, 102, 0.35)',
        ],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-label="Chat on WhatsApp"
      onClick={() => trackContact('whatsapp')}
    >
      <FaWhatsapp className="w-8 h-8 text-white" size={32} />
    </motion.a>
  );
}
