import type { ReactNode } from 'react';

export default function DeeptalkLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#1a1a1a',
          color: '#e8e0d4',
          fontFamily: '"EB Garamond", "Songti SC", "Source Han Serif SC", serif',
        }}
      >
        {children}
      </div>
    </>
  );
}
