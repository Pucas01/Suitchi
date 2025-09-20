import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'], // or just 'variable' if you're using all weights
});

export const metadata = {
  title: "ACL",
  description: "Web frontend to manage switch backups and ACL status",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}