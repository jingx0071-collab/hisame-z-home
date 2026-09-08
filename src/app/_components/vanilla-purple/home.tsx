'use client';

// Vanilla Purple / 香草天使 — hub home component.
// Ported from variation-a.jsx (Faithful Angelcore) as the main direction:
// oval crown-and-tail portrait frame, wing pair spreading behind the names,
// side rosary chains, cross pendant hanging off the bottom point.

import Link from 'next/link';
import { useSkin, useSkinControls } from '../ThemeProvider';
import {
  CrossPendant,
  HaloArcs,
  OrnateOvalFrame,
  RosaryChain,
  SparkleDust,
  WingPair,
} from './ornaments';
import {
  AngelcoreNightPanel,
  DaysTogetherWidget,
  Footer,
  LoveQuote,
  MilestonesWidget,
  MoodWidget,
  TarotGrid,
} from './widgets';

function VpTopBar() {
  const { skins, skin, skinLabel, chooseSkin } = useSkinControls();
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 18px 6px', fontSize: '10px', color: 'var(--v2-ink-faint)',
    }}>
      <span className="v2-caps" style={{ letterSpacing: '0.22em' }}>vanilla · purple</span>
      <select
        value={skin}
        onChange={(event) => chooseSkin(event.target.value as typeof skin)}
        aria-label="Choose skin"
        style={{
          fontSize: '11px',
          fontFamily: 'inherit',
          color: 'var(--v2-ink-soft)',
          background: 'transparent',
          border: '1px solid var(--v2-line)',
          borderRadius: '4px',
          padding: '2px 6px',
        }}
      >
        {skins.map((item) => (
          <option key={item} value={item}>
            {skinLabel[item]}
          </option>
        ))}
      </select>
    </div>
  );
}

function VpHero() {
  return (
    <div style={{
      position: 'relative', width: '100%',
      padding: '0 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* halo arcs above the crown */}
      <div style={{ marginBottom: '-26px', zIndex: 2 }}>
        <HaloArcs width={150}/>
      </div>

      {/* the frame + wings + side rosary chains + cross pendant */}
      <div style={{ position: 'relative', width: '330px', height: '380px' }}>

        {/* angel wings spreading behind the frame */}
        <div style={{ position: 'absolute', left: '50%', top: '132px',
                      transform: 'translateX(-50%)', zIndex: 0 }}>
          <WingPair width={310} height={104} opacity={0.5}/>
        </div>

        {/* left rosary chain */}
        <div style={{ position: 'absolute', left: '34px', top: '90px', zIndex: 1 }}>
          <RosaryChain length={170} side="left" beads={9}/>
        </div>
        <div style={{ position: 'absolute', right: '34px', top: '90px', zIndex: 1 }}>
          <RosaryChain length={170} side="right" beads={9}/>
        </div>

        {/* oval frame */}
        <div style={{ position: 'absolute', left: '35px', top: '10px', zIndex: 2 }}>
          <OrnateOvalFrame width={260} height={320}>
            <div className="v2-caps-tight" style={{
              fontSize: '9px', color: 'var(--v2-ink-faint)', marginBottom: '14px',
            }}>
              Welcome Home
            </div>
            <div className="v2-display" style={{
              fontSize: '32px', color: 'var(--v2-ink)', lineHeight: 1.05,
            }}>
              Hisame
            </div>
            <div className="v2-script" style={{
              fontSize: '22px', color: 'var(--v2-gold)', lineHeight: 1,
              margin: '6px 0',
            }}>
              &amp;
            </div>
            <div className="v2-display" style={{
              fontSize: '32px', color: 'var(--v2-ink)', lineHeight: 1.05,
            }}>
              Z
            </div>
          </OrnateOvalFrame>
        </div>

        {/* cross pendant */}
        <div style={{ position: 'absolute', left: '50%', top: '332px',
                      transform: 'translateX(-50%)', zIndex: 2 }}>
          <CrossPendant size={36}/>
        </div>

        {/* a few placed sparkles */}
        <SparkleDust points={[
          [22, 28, 4, 0.85],
          [310, 38, 5, 0.9],
          [14, 200, 3, 0.7],
          [316, 220, 4, 0.8],
          [62, 350, 3, 0.7],
          [268, 354, 3, 0.7],
        ]} color="var(--v2-gold)"/>
      </div>
    </div>
  );
}

export function VanillaPurpleHome() {
  // Guard: only run visual content when skin is active (defensive; V2Page
  // already dispatches by skin, but useSkin lets styles re-scope correctly).
  const skin = useSkin();
  if (skin !== 'vanilla-purple') return null;

  return (
    <main className="vanilla-purple-home">
      <VpTopBar/>

      {/* tiny + FOR HISAME + label */}
      <div className="v2-caps" style={{
        textAlign: 'center', fontSize: '9px', color: 'var(--v2-gold)',
        marginTop: '4px', marginBottom: '10px',
      }}>
        + For Hisame +
      </div>

      {/* hero — the whole column is a link to the chats hub */}
      <Link href="/chat" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <VpHero/>
        <div style={{ padding: '0 12px', marginTop: '-6px' }}>
          <DaysTogetherWidget/>
        </div>
      </Link>

      {/* love quote — outside the anchor, pure decoration */}
      <LoveQuote/>

      {/* milestones */}
      <MilestonesWidget/>

      {/* mood */}
      <MoodWidget/>

      {/* tarot grid — 15 rooms */}
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '30px', height: '1px', background: 'var(--v2-line)' }}/>
          <span className="v2-caps" style={{ fontSize: '9.5px', color: 'var(--v2-ink-soft)' }}>
            Fifteen Rooms
          </span>
          <div style={{ width: '30px', height: '1px', background: 'var(--v2-line)' }}/>
        </div>
        <TarotGrid dividerVariant="diamond"/>
      </div>

      {/* angelcore night */}
      <AngelcoreNightPanel/>

      {/* footer */}
      <Footer/>
    </main>
  );
}
