import "./globals.css";

export const metadata = {
  title: "SilverFit Web",
  description: "Elderly-safe exercise monitoring app"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
