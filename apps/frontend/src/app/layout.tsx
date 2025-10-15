import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DupMe - Game',
  description: 'Multiplayer game application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}