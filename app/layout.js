import './globals.css';

export const metadata = {
  title: 'CAMS - Consumer Attention Mapping System',
  description: 'AI-Powered Retail Attention Intelligence Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
