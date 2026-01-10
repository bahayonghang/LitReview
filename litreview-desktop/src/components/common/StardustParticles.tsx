/**
 * ✧ Celestial Library Stardust Particles ✧
 * 星辰图书馆星尘粒子效果组件
 * 为应用添加漂浮的星光点缀
 */

import React, { useMemo } from 'react';
import styles from './StardustParticles.module.css';

interface Particle {
  id: number;
  type: 'gold' | 'white' | 'purple';
  size: number;
  left: string;
  top: string;
  duration: number;
  delay: number;
  opacity: number;
}

interface StardustParticlesProps {
  /** Number of particles to render */
  count?: number;
  /** Whether to show shooting stars */
  showShootingStars?: boolean;
}

/**
 * StardustParticles - 星尘粒子效果组件
 *
 * 在背景中渲染漂浮的星光粒子和流星效果
 * 自动适配深色/浅色主题
 */
export const StardustParticles: React.FC<StardustParticlesProps> = ({
  count = 30,
  showShootingStars = true,
}) => {
  // Generate particles with random properties
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const types: Array<'gold' | 'white' | 'purple'> = ['gold', 'white', 'purple'];
      const typeWeights = [0.5, 0.35, 0.15]; // Gold is most common

      // Weighted random selection
      const rand = Math.random();
      let type: 'gold' | 'white' | 'purple' = 'gold';
      let cumulative = 0;
      for (let j = 0; j < types.length; j++) {
        cumulative += typeWeights[j];
        if (rand < cumulative) {
          type = types[j];
          break;
        }
      }

      return {
        id: i,
        type,
        size: Math.random() * 3 + 1, // 1-4px
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: Math.random() * 10 + 15, // 15-25s
        delay: Math.random() * 10, // 0-10s delay
        opacity: Math.random() * 0.4 + 0.2, // 0.2-0.6
      };
    });
  }, [count]);

  return (
    <div className={styles.stardustContainer} aria-hidden="true">
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`${styles.particle} ${styles[particle.type]}`}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: particle.left,
            top: particle.top,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            '--particle-opacity': particle.opacity,
          } as React.CSSProperties}
        />
      ))}

      {/* Shooting stars */}
      {showShootingStars && (
        <>
          <div className={styles.shootingStar} />
          <div className={styles.shootingStar} />
          <div className={styles.shootingStar} />
        </>
      )}
    </div>
  );
};

export default StardustParticles;
