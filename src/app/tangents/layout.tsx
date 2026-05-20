import { DotGothic16 } from 'next/font/google';

const pixelFont = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

export default function TangentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={pixelFont.variable}>{children}</div>;
}
