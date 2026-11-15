/* Internal: the options of the nearest DisplayFormatProvider. Not exported from the package entry point. */
import { createContext } from 'react';
import type { DisplayFormatOptions } from './display-format.js';

/** What the nearest provider set, merged with its parents'. Empty outside any provider, so a root provider keeps the
 * browser defaults for whatever it leaves out, and components can tell an app's explicit date format from the default. */
export const DisplayFormatOptionsContext = createContext<DisplayFormatOptions>({});
