import "./globals.css";

export const metadata = {
  title: "Corruchart",
  description: "An interactive charting tool to visualize preferences.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
