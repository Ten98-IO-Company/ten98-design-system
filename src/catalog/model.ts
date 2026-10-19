import type { ReactNode } from 'react';

export type ComponentCategory = 'Controls' | 'Feedback' | 'Navigation' | 'Data display' | 'Layout' | 'Application adapters';
export interface ComponentProp {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  description: string;
}
export interface ComponentState {
  name: string;
  description: string;
  preview: ReactNode;
  code?: string;
}
export interface ComponentEntry {
  name: string;
  category: ComponentCategory;
  description: string;
  usage: string;
  importPath?: '@ten98/ui' | '@ten98/ui/app';
  props: ComponentProp[];
  nativeProps?: string;
  tokens: string[];
  accessibility: string[];
  related?: string[];
  example: string;
  states: ComponentState[];
}

/** One complete, copyable file, with imports and any local demo state included. */
export function tsx(imports: string[], jsx: string, setup = '', reactImports: string[] = [], importPath = '@ten98/ui') {
  return `'use client';\n\n${reactImports.length ? `import { ${reactImports.join(', ')} } from 'react';\n` : ''}import { ${imports.join(', ')} } from '${importPath}';\n\nexport default function Example() {\n${setup ? setup.split('\n').map(line => '  ' + line).join('\n') + '\n' : ''}  return (\n${jsx.split('\n').map(line => '    ' + line).join('\n')}\n  );\n}\n`;
}

/** Copy the rendered catalogue source using public package imports. */
export const publicCode = (source: string) => source.replaceAll("'../../lib'", "'@ten98/ui'").replaceAll("'../../lib/app'", "'@ten98/ui/app'").replaceAll("'../lib'", "'@ten98/ui'");
