import "./globals.css";

export const metadata = {
  title: "BronzeFit AI - Elderly Wellness Companion",
  description: "AI-powered exercise monitoring for seniors with heart rate safety and family dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#32ff7e" />
      </head>
      <body>
        <div className="app-container">
          <div className="particles" aria-hidden="true">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }} />
            ))}
          </div>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}