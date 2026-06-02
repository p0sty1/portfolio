import styled from 'styled-components';

export type BrandLogoVariant = 'header' | 'sidebar';

const LogoViewport = styled.span<{ $variant: BrandLogoVariant }>`
  --brand-logo-height: clamp(3rem, 5vw, 4rem);
  --brand-logo-width: min(100%, 13.25rem);
  --brand-logo-item-width: 5.9rem;
  --brand-logo-gap: 0.72rem;
  --brand-logo-track-distance: -50%;

  position: relative;
  isolation: isolate;
  display: block;
  width: var(--brand-logo-width);
  height: var(--brand-logo-height);
  max-width: 100%;
  overflow: hidden;
  border-radius: 7px;
  mask-image: linear-gradient(
    90deg,
    transparent 0%,
    #000 12%,
    #000 88%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0%,
    #000 12%,
    #000 88%,
    transparent 100%
  );

  ${({ $variant }) =>
    $variant === 'header'
      ? `
    --brand-logo-height: clamp(2.85rem, 11vw, 3.75rem);
    --brand-logo-width: min(88vw, 15.5rem);
    --brand-logo-item-width: 6.5rem;
    margin: 0 auto;
  `
      : ''}

  @media (prefers-reduced-motion: reduce) {
    .brand-logo-track {
      animation: none;
    }
  }
`;

const LogoTrack = styled.span`
  display: flex;
  align-items: center;
  gap: var(--brand-logo-gap);
  width: max-content;
  height: 100%;
  animation: brand-logo-pan 15s linear infinite;
  will-change: transform;

  ${LogoViewport}:hover & {
    animation-duration: 9s;
  }

  @keyframes brand-logo-pan {
    from {
      transform: translate3d(0, 0, 0);
    }

    to {
      transform: translate3d(var(--brand-logo-track-distance), 0, 0);
    }
  }
`;

const LogoRun = styled.span`
  display: flex;
  align-items: center;
  gap: var(--brand-logo-gap);
  height: 100%;
`;

const LogoImg = styled.img`
  display: block;
  width: var(--brand-logo-item-width);
  max-width: none;
  height: calc(100% - 0.75rem);
  flex: 0 0 var(--brand-logo-item-width);
  object-fit: contain;
  object-position: center;
`;

const LOGO_REPEAT_COUNT = 8;

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
  <LogoViewport className={className} data-v2="brand-logo" $variant={variant}>
    <LogoTrack className="brand-logo-track">
      {[0, 1].map((runIndex) => (
        <LogoRun key={runIndex}>
          {Array.from({ length: LOGO_REPEAT_COUNT }).map((_, logoIndex) => (
            <LogoImg
              key={logoIndex}
              alt={runIndex === 0 && logoIndex === 0 ? alt : ''}
              aria-hidden={
                runIndex === 0 && logoIndex === 0 ? undefined : 'true'
              }
              decoding="async"
              src={src}
            />
          ))}
        </LogoRun>
      ))}
    </LogoTrack>
  </LogoViewport>
);
