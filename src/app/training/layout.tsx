export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#1a0606',
          color: '#f0e6d8',
          fontFamily: '"EB Garamond", "Songti SC", serif',
        }}
      >
        {children}
      </div>
    </>
  );
}
