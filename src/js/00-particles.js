// Generated from src/js/*.js by `pnpm compose`. Edit the ordered fragments.
// ══════════════════════════════════════════════════════════════
// PARTICLE CLASS
// ══════════════════════════════════════════════════════════════
let SPECTRAL_LIGHT = false; // theme-aware flag, updated by applyTheme
class Particle {
    constructor(x, y, size, speedX, speedY, hue) {
        this.x = x; this.y = y; this.size = size; this.baseSize = size;
        this.speedX = speedX; this.speedY = speedY;
        this.hue = hue; this.hueSpeed = 0.1 + Math.random() * 0.2;
        this.saturation = 50 + Math.random() * 30;
        this.lightness = 50 + Math.random() * 20;
        this.opacity = 0.3 + Math.random() * 0.4;
    }
    update(W, H, mouse, frameStep = 1) {
        this.hue = (this.hue + this.hueSpeed * frameStep) % 360;
        this.x += this.speedX * frameStep; this.y += this.speedY * frameStep;
        if (mouse.active) {
            const dx = this.x - mouse.x, dy = this.y - mouse.y;
            const distSq = dx*dx + dy*dy, maxDist = 150;
            if (distSq < maxDist*maxDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const force = (maxDist - dist) / maxDist;
                const impulse = force * 0.11 * frameStep / dist;
                this.speedX += dx * impulse;
                this.speedY += dy * impulse;
                this.size = this.baseSize + force * 2.5;
            } else { this.size += (this.baseSize - this.size) * Math.min(.16, .05 * frameStep); }
        } else { this.size += (this.baseSize - this.size) * Math.min(.1, .02 * frameStep); }
        const damping = Math.pow(.98, frameStep);
        this.speedX *= damping; this.speedY *= damping;
        const s = Math.sqrt(this.speedX*this.speedX + this.speedY*this.speedY);
        if (s < 0.05) { const a = Math.random()*Math.PI*2; this.speedX = Math.cos(a)*0.05; this.speedY = Math.sin(a)*0.05; }
        if (s > 1.2) { this.speedX = (this.speedX/s)*1.2; this.speedY = (this.speedY/s)*1.2; }
        if (this.x > W+20) this.x = -20; if (this.x < -20) this.x = W+20;
        if (this.y > H+20) this.y = -20; if (this.y < -20) this.y = H+20;
    }
    draw(ctx, lowPower = false) {
        // On light theme, render darker/more saturated dots so they stay visible
        const L = SPECTRAL_LIGHT ? Math.min(this.lightness, 46) : this.lightness;
        const S = SPECTRAL_LIGHT ? Math.min(this.saturation + 18, 92) : this.saturation;
        const color = `hsl(${this.hue},${S}%,${L}%)`;
        ctx.globalAlpha = SPECTRAL_LIGHT ? Math.min(this.opacity + 0.22, 0.85) : this.opacity;
        ctx.shadowBlur = lowPower ? 0 : (SPECTRAL_LIGHT ? 3 : 7); ctx.shadowColor = color; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
        if (!SPECTRAL_LIGHT && this.opacity > 0.25) {
            ctx.shadowBlur = lowPower ? 0 : 12; ctx.globalAlpha = this.opacity * 0.11;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size*3, 0, Math.PI*2); ctx.fill();
        }
    }
}
