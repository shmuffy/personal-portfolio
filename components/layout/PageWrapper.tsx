interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  return (
    <div className={`max-w-7xl mx-auto px-6 md:px-12 ${className}`}>
      {children}
    </div>
  );
}
