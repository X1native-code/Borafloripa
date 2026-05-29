"use client";

import React from 'react';
import { Icon } from './Icon';

export const WhatsAppFab: React.FC = () => (
  <a className="fab-wpp" href="https://wa.me/5548999991234" target="_blank" rel="noopener noreferrer" aria-label="Chatea por WhatsApp">
    <Icon name="whatsapp" size={22} />
    <span className="fab-label">Bora chatear?</span>
  </a>
);
