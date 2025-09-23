import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'], 
});

export const metadata = {
  title: "Suitchi",
  description: "Web frontend to manage switch backups and ACL status",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="flex flex-col min-h-screen">
        {children}
        <Toaster/>
      </body>
    </html>
  );
}