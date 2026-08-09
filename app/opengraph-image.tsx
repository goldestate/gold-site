import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background:
            'radial-gradient(circle at 12% 18%, rgba(255,215,0,0.18), transparent 18%), radial-gradient(circle at 82% 18%, rgba(255,255,255,0.06), transparent 16%), linear-gradient(180deg, #2a2627 0%, #231f20 46%, #181516 100%)',
          color: '#FFFFFF',
          padding: '72px'
        }}
      >
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div
            style={{
              width: 116,
              height: 116,
              borderRadius: 28,
              border: '2px solid rgba(255,215,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFD700',
              fontSize: 58,
              fontWeight: 700
            }}
          >
            G
          </div>
          <div>
            <div
              style={{
                fontSize: 30,
                letterSpacing: '0.42em',
                textTransform: 'uppercase',
                color: 'rgba(255,215,0,0.9)'
              }}
            >
              GOLD
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 18,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.72)'
              }}
            >
              Investment Opportunities
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 860 }}>
          <div
            style={{
              fontSize: 82,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase'
            }}
          >
            Luxury Real Estate
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 26,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.78)'
            }}
          >
            Premium holding brand for private investors, elite consultation, and long-term value.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
