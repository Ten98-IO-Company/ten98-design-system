import type { AuthNotice } from './auth-flows.js';

/** State every settings flow shares with the auth flows; the application supplies all values and messages. */
export interface FlowState {
  busy?: boolean;
  busyLabel?: string;
  error?: string;
  /** The app could not confirm the outcome; it must reload current state before retrying. */
  unconfirmed?: string;
  notice?: AuthNotice;
  fieldErrors?: Partial<Record<string, string>>;
  /** Role-gated read-only view: inputs and actions are disabled, values stay visible. */
  disabled?: boolean;
  /** Hides the visible title when a surrounding Dialog already shows it; the section keeps the title as its accessible name. */
  hideTitle?: boolean;
}

/** A typed submit callback; the flow never sends requests itself. */
export type Submit<Values> = (values: Values) => void | Promise<void>;
