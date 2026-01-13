import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

export const AnimatedBackground: React.FC<{ isTyping?: boolean }> = ({ isTyping = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const initParticles = () => {
      particles.current = [];
      const particleCount = window.innerWidth < 768 ? 40 : 80;

      for (let i = 0; i < particleCount; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.3 + 0.1,
          hue: Math.random() * 40 + 200, // Elegant blue-teal range
        });
      }
    };
    initParticles();

    const animate = () => {
      timeRef.current += 0.005;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((particle, i) => {
        const wave = Math.sin(timeRef.current + i * 0.1);
        particle.x += particle.vx * (isTyping ? 2 : 1) + wave * 0.3;
        particle.y += particle.vy * (isTyping ? 2 : 1) + Math.cos(timeRef.current + i * 0.1) * 0.3;

        const dx = mousePos.x - particle.x;
        const dy = mousePos.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150 && distance > 0) {
          const force = (150 - distance) / 150;
          const angle = Math.atan2(dy, dx);
          particle.x -= Math.cos(angle) * force * 1.5;
          particle.y -= Math.sin(angle) * force * 1.5;
        }

        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 2
        );

        gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 70%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        particles.current.slice(i + 1, i + 4).forEach((particle2) => {
          const dx = particle.x - particle2.x;
          const dy = particle.y - particle2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle2.x, particle2.y);
            ctx.strokeStyle = `hsla(${particle.hue}, 70%, 60%, ${(1 - distance / 100) * 0.15})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isTyping, mousePos.x, mousePos.y]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Elegant gradient orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          top: '10%',
          left: '5%',
        }}
        animate={{
          x: [0, 80, 0],
          y: [0, -60, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          bottom: '15%',
          right: '10%',
        }}
        animate={{
          x: [0, -60, 0],
          y: [0, 80, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full blur-[80px]"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
          top: '40%',
          right: '5%',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
        }}
      />
    </div>
  );
};

export const TypingText: React.FC<{
  texts: string[];
  className?: string;
  onTypingChange?: (isTyping: boolean) => void;
}> = ({ texts, className = '', onTypingChange }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentText = texts[currentTextIndex];

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(
      () => {
        if (!isDeleting) {
          if (displayText.length < currentText.length) {
            setDisplayText(currentText.slice(0, displayText.length + 1));
            onTypingChange?.(true);
          } else {
            timeoutRef.current = setTimeout(() => {
              setIsDeleting(true);
              onTypingChange?.(false);
            }, 2000);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText(displayText.slice(0, -1));
            onTypingChange?.(true);
          } else {
            setIsDeleting(false);
            setCurrentTextIndex((currentTextIndex + 1) % texts.length);
            onTypingChange?.(false);
          }
        }
      },
      isDeleting ? 40 : 80
    );

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [displayText, isDeleting, currentTextIndex, texts, onTypingChange]);

  return (
    <span className={className}>
      <span className="inline-block bg-gradient-to-r from-orange-400 via-indigo-400 to-orange-300 bg-clip-text text-transparent">
        {displayText || '\u00A0'}
      </span>
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-block w-0.5 h-12 ml-1 bg-gradient-to-b from-blue-400 to-indigo-400"
        style={{ verticalAlign: 'middle' }}
      />
    </span>
  );
};

export const FloatingParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.random() * 10 - 5, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
