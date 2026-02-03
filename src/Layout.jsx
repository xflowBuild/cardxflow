import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-slate-900" dir="rtl">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
          
          * {
            font-family: 'Heebo', sans-serif;
          }
          
          :root {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --popover: 222.2 84% 4.9%;
            --popover-foreground: 210 40% 98%;
            --primary: 263.4 70% 50.4%;
            --primary-foreground: 210 40% 98%;
            --secondary: 217.2 32.6% 17.5%;
            --secondary-foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --destructive: 0 62.8% 30.6%;
            --destructive-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --input: 217.2 32.6% 17.5%;
            --ring: 263.4 70% 50.4%;
          }
          
          html {
            direction: rtl;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgb(30 41 59);
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgb(71 85 105);
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgb(100 116 139);
          }

          /* Mobile optimizations */
          @media (max-width: 640px) {
            .prose {
              font-size: 14px;
            }
          }
        `}
      </style>
      {children}
    </div>
  );
}