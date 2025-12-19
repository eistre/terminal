import type { Locale as DbLocale } from '@terminal/database';
import { z } from 'zod';

export const LOCALES = ['en', 'et'] as const satisfies readonly DbLocale[];

export const localeSchema = z.enum(LOCALES);

export type Locale = DbLocale;
