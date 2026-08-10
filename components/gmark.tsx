import Image from 'next/image';

type GMarkProps = {
  tone?: 'gold' | 'white' | 'black';
  className?: string;
  size?: number;
};

const sources = {
  gold: '/marks/gmark-gold.png',
  white: '/marks/gmark-white.png',
  black: '/marks/gmark-black.png'
};

export function GMark({ tone = 'gold', className = '', size = 640 }: GMarkProps) {
  return (
    <Image
      src={sources[tone]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`watermark-mark ${className}`}
    />
  );
}
