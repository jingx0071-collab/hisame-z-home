import './_styles/tokens.css';
import { ThemeProvider } from './_components/ThemeProvider';

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}