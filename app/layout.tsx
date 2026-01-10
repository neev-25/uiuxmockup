import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import {ClerkProvider} from '@clerk/nextjs'
import Provider from "./provider";
import { Toaster } from "@/components/ui/sonner";
const appFont=DM_Sans({
  subsets:["latin"]
})
export const metadata: Metadata = {
  title: "UIUX MockUp generator App",
  description: "Generate High quality Free UIUX Mobile and Web Movkup design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
      <body
      className={appFont.className}
      > 
      <Provider>
         {children}
      </Provider>
       <Toaster position="top-center"/>
      </body>
    </html>    
     </ClerkProvider>
  );
}
