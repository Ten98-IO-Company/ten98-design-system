import { createRoot } from 'react-dom/client';
import { SignInFlow, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
createRoot(document.getElementById('auth-card-fixture')!).render(
  <SignInFlow brand={<Text as="span" weight="semibold">Ten98</Text>} title="Sign in to Campaign" description="Use your work email." onSubmit={() => {}} />,
);
