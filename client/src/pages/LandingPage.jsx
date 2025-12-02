/**
 * LandingPage - Public landing page for Data Hub
 *
 * Win98 Dungeon Theme:
 * - Zero border-radius
 * - 2px solid borders
 * - Gold titles with text-shadow
 * - PSX sprites for visual flair
 *
 * Sections:
 * 1. Header - Logo + Sign In button
 * 2. Hero - Tagline + CTAs
 * 3. Video Demo - Product demo video
 * 4. Features Grid - 6 feature cards
 * 5. CTA Section - Final call to action
 * 6. Footer
 */

import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PSXSprite from '../components/common/PSXSprite';
import { ROUTES } from '../constants/routes';
import styles from './LandingPage.module.css';

// Feature data for the grid
const FEATURES = [
  {
    id: 'warehouse',
    sprite: 'floppy',
    title: 'Data Warehouse',
    description:
      'Platform-specific tables with normalized schemas for Meta, Google, TikTok, GA4, and Shopify.',
  },
  {
    id: 'reports',
    sprite: 'coin',
    title: 'Automated Reports',
    description:
      'Scheduled PDF/CSV delivery via email with professional formatting.',
  },
  {
    id: 'visualization',
    sprite: 'star',
    title: 'Visual Analytics',
    description: 'KPI cards and charts that bring your data to life.',
  },
  {
    id: 'alerts',
    sprite: 'heartRed',
    title: 'Smart Alerts',
    description:
      'Threshold, trend, and freshness monitoring that catches issues before they become problems.',
  },
  {
    id: 'lineage',
    sprite: 'gameboy',
    title: 'Full Lineage',
    description:
      'Answer "if X breaks, what reports fail?" in under 30 seconds.',
  },
  {
    id: 'platforms',
    sprite: 'monitor',
    title: 'Multi-Platform',
    description:
      'Meta Ads, Google Ads, TikTok Ads, GA4, Shopify, and custom sources.',
  },
];

/**
 * Feature Card Component
 */
function FeatureCard({ feature }) {
  return (
    <Card className={styles.featureCard} padding="lg">
      <div className={styles.featureIcon}>
        <PSXSprite sprite={feature.sprite} size="lg" />
      </div>
      <h3 className={styles.featureTitle}>{feature.title}</h3>
      <p className={styles.featureDescription}>{feature.description}</p>
    </Card>
  );
}

FeatureCard.propTypes = {
  feature: PropTypes.shape({
    id: PropTypes.string.isRequired,
    sprite: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
};

export default function LandingPage() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link to={ROUTES.LANDING} className={styles.logoLink} aria-label="Data Hub home">
          <img src="/favicon.gif" alt="" className={styles.logoIcon} />
          <span className={styles.logoText}>Data Hub</span>
        </Link>
        <Button to={ROUTES.LOGIN} variant="secondary" size="sm">
          Sign In
        </Button>
      </header>

      {/* Hero Section */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroLayout}>
          {/* Left sprite zone */}
          <div className={`${styles.heroSpriteZone} ${styles.left}`}>
            <PSXSprite sprite="star" size="lg" className={styles.heroSprite} />
          </div>

          {/* Center content */}
          <div className={styles.heroCenter}>
            <h1 id="hero-title" className={styles.heroTitle}>
              Bring clarity to chaos.
            </h1>
            <p className={styles.heroSubtitle}>
              The all-in-one marketing data platform for agencies. Data warehousing, ETL,
              visualization, and automated reporting—unified.
            </p>
            <div className={styles.heroCtas}>
              <Button to={ROUTES.LOGIN} variant="primary" size="lg">
                Get Started
              </Button>
              <Button href="#demo" variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>

            {/* Social proof cards */}
            <div className={styles.heroCards}>
              <div className={styles.heroCard}>
                <div className={styles.heroCardIcon}>
                  <PSXSprite sprite="floppy" size="sm" />
                </div>
                <div className={styles.heroCardContent}>
                  <span className={styles.heroCardValue}>5+</span>
                  <span className={styles.heroCardLabel}>Platform Integrations</span>
                </div>
              </div>
              <div className={styles.heroCard}>
                <div className={styles.heroCardIcon}>
                  <PSXSprite sprite="heartGreen" size="sm" />
                </div>
                <div className={styles.heroCardContent}>
                  <span className={styles.heroCardValue}>100%</span>
                  <span className={styles.heroCardLabel}>Self-Hosted</span>
                </div>
              </div>
              <div className={styles.heroCard}>
                <div className={styles.heroCardIcon}>
                  <PSXSprite sprite="coin" size="sm" />
                </div>
                <div className={styles.heroCardContent}>
                  <span className={styles.heroCardValue}>$0</span>
                  <span className={styles.heroCardLabel}>Open Source</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right sprite zone */}
          <div className={`${styles.heroSpriteZone} ${styles.right}`}>
            <PSXSprite sprite="coin" size="lg" className={styles.heroSprite} />
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="demo" className={styles.videoSection} aria-labelledby="demo-title">
        <h2 id="demo-title" className={styles.sectionTitle}>
          See It In Action
        </h2>
        <div className={styles.videoWrapper}>
          <video
            className={styles.video}
            controls
            preload="metadata"
            poster="/assets/demo/demo-poster.jpg"
            aria-label="Data Hub product demonstration"
          >
            <source src="/assets/demo/data-hub-demo.mp4" type="video/mp4" />
            <p className={styles.videoFallback}>
              Your browser does not support HTML5 video.
            </p>
          </video>
          <div className={styles.videoTitleBar}>
            <span className={styles.videoTitle}>demo.mp4</span>
            <PSXSprite sprite="hourglass" size="sm" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className={styles.featuresSection}
        aria-labelledby="features-title"
      >
        <h2 id="features-title" className={styles.sectionTitle}>
          Everything You Need
        </h2>
        <p className={styles.sectionSubtitle}>
          From raw data to delivered reports, all in one place.
        </p>
        <div className={styles.featuresGrid}>
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection} aria-labelledby="cta-title">
        <div className={styles.ctaContent}>
          <PSXSprite sprite="heartGreen" size="lg" className={styles.ctaSprite} />
          <h2 id="cta-title" className={styles.ctaTitle}>
            Ready to bring clarity to your data?
          </h2>
          <p className={styles.ctaSubtitle}>
            Join agencies already transforming their data workflows.
          </p>
          <Button to={ROUTES.LOGIN} variant="primary" size="lg">
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          Data Hub — All-in-one marketing data platform
        </p>
        <p className={styles.footerCopyright}>
          Built with the Win98 Dungeon aesthetic
        </p>
      </footer>
    </div>
  );
}
