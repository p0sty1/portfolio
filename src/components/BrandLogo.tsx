import styled from 'styled-components';

export type BrandLogoVariant = 'header' | 'sidebar';

const LogoImg = styled.img<{ $variant: BrandLogoVariant }>`
  display: block;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: left center;

  ${({ $variant }) =>
    $variant === 'sidebar'
      ? `
    height: clamp(3rem, 5vw, 4rem);
    min-height: 3rem;
  `
      : `
    height: clamp(2.85rem, 11vw, 3.75rem);
    min-height: 2.85rem;
    max-width: min(88vw, 15.5rem);
    margin: 0 auto;
    object-position: center;
  `}
`;

interface BrandLogoProps {
  alt: string;
  className?: string;
  src: string;
  variant?: BrandLogoVariant;
}

export const BrandLogo = ({
  alt,
  className,
  src,
  variant = 'sidebar',
}: BrandLogoProps) => (
  <LogoImg
    alt={alt}
    className={className}
    data-v2="brand-logo"
    $variant={variant}
    decoding="async"
    src={src}
  />
);
