import Image from 'next/image';

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className = '', compact = false }: BrandLogoProps) {
  return (
    <Image
      src="/gold-logo-exact.png"
      alt="GOLD Investment Opportunities"
      width={569}
      height={181}
      priority
      className={`h-auto ${compact ? 'w-[160px] sm:w-[180px]' : 'w-[280px] sm:w-[320px]'} ${className}`}
    />
  );
}
