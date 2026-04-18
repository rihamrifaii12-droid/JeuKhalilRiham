export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.ctx = BABYLON.Engine.audioEngine?.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        this.isInitialized = false;

        // Paramètres Moteur S58 (depuis le fichier HTML)
        this.MAX_RPM = 7600;
        this.curRpm = 700;
        this.curLoad = 0.2;
        this.curExh = 0.4;
        this.oscs = [];
    }

    _makeDistCurve(k) {
        const N = 512, c = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const x = i * 2 / N - 1;
            c[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
        }
        return c;
    }

    _rpmFund(rpm) { return (rpm / 60) * 1.5; }

    _targetVol() {
        if (!this.isInitialized) return 0;
        const base = 0.15 + (this.curRpm / this.MAX_RPM) * 0.55;
        const vol = Math.min(0.9, base * (0.65 + this.curLoad * 0.5) * (0.7 + this.curExh * 0.6));
        // Volume réduit à 10% de sa force brute d'origine
        return vol * 0.10;
    }

    init() {
        if (this.isInitialized) return;
        
        if (BABYLON.Engine.audioEngine) BABYLON.Engine.audioEngine.unlock();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

        // --- CONSTRUCTION DU GRAPHE AUDIO S58 ---
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0;

        this.preGain = this.ctx.createGain();
        this.preGain.gain.value = 1;

        this.distNode = this.ctx.createWaveShaper();
        this.distNode.curve = this._makeDistCurve(120);
        this.distNode.oversample = '4x';

        this.hp = this.ctx.createBiquadFilter();
        this.hp.type = 'highpass';
        this.hp.frequency.value = 60;
        this.hp.Q.value = 0.7;

        this.lp = this.ctx.createBiquadFilter();
        this.lp.type = 'lowpass';
        this.lp.frequency.value = 3200;
        this.lp.Q.value = 0.5;

        this.mid = this.ctx.createBiquadFilter();
        this.mid.type = 'peaking';
        this.mid.frequency.value = 580;
        this.mid.gain.value = 10;
        this.mid.Q.value = 1.1;

        this.comp = this.ctx.createDynamicsCompressor();
        this.comp.threshold.value = -14;
        this.comp.knee.value = 8;
        this.comp.ratio.value = 5;
        this.comp.attack.value = 0.002;
        this.comp.release.value = 0.12;

        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -1;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.05;

        this.masterGain.connect(this.preGain);
        this.preGain.connect(this.distNode);
        this.distNode.connect(this.hp);
        this.hp.connect(this.mid);
        this.mid.connect(this.lp);
        this.lp.connect(this.comp);
        this.comp.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);

        const fund = this._rpmFund(this.curRpm);
        const hDefs = [
            { m: 0.5,  t: 'sawtooth', g: 0.85 }, 
            { m: 1,    t: 'sawtooth', g: 1.00 }, 
            { m: 1.5,  t: 'square',   g: 0.60 }, 
            { m: 2,    t: 'sawtooth', g: 0.70 }, 
            { m: 2.5,  t: 'sawtooth', g: 0.35 },
            { m: 3,    t: 'square',   g: 0.45 },
            { m: 4,    t: 'sawtooth', g: 0.28 },
            { m: 5,    t: 'sawtooth', g: 0.16 },
            { m: 6,    t: 'square',   g: 0.12 },
            { m: 8,    t: 'sawtooth', g: 0.07 },
            { m: 0.33, t: 'sawtooth', g: 0.50 }, 
            { m: 0.25, t: 'sawtooth', g: 0.30 },
        ];

        this.oscs = hDefs.map(({ m, t, g }) => {
            const o  = this.ctx.createOscillator();
            const og = this.ctx.createGain();
            o.type = t;
            o.frequency.value = fund * m;
            og.gain.value = g * 0.07;
            o.connect(og);
            og.connect(this.masterGain);
            o.start();
            return { o, og, m };
        });

        this.noiseOsc  = this.ctx.createOscillator();
        this.noiseGain = this.ctx.createGain();
        this.noiseOsc.type = 'sawtooth';
        this.noiseOsc.frequency.value = fund * 2.1;
        this.noiseGain.gain.value = 0.04;
        this.noiseOsc.connect(this.noiseGain);
        this.noiseGain.connect(this.masterGain);
        this.noiseOsc.start();

        this.isInitialized = true;
        this.masterGain.gain.setTargetAtTime(this._targetVol(), this.ctx.currentTime, 0.5);
    }

    updateEngine(velocity, isBoost, isShockwave) {
        if (!this.isInitialized) return;

        let v = Math.abs(velocity);
        const now  = this.ctx.currentTime;

        // Vitesse max en jeu ~ 350 -> 600 boost -> 1000+ Shockwave
        // On mappe la vitesse sur l'amplitude normale des tours minutes
        let targetRpm = 700 + (v / 400) * (this.MAX_RPM - 700);

        if (isBoost) targetRpm += 1500;
        if (isShockwave) targetRpm += 2500;
        
        targetRpm = Math.min(this.MAX_RPM, targetRpm);

        // Simulation de la charge et de l'échappement comme dans ton slider (0 à 100%)
        this.curLoad = 0.2 + Math.min(v / 300, 1.0) * 0.8;
        this.curExh = 0.4 + Math.min(v / 300, 1.0) * 0.6;
        
        if (isBoost || isShockwave) { 
            this.curLoad = 1.0; 
            this.curExh = 1.0; 
        }

        // Algorithme d'interpolation de ton HTML (StartLoop)
        const diff = targetRpm - this.curRpm;
        this.curRpm += diff > 0 ? Math.min(diff, 80) : Math.max(diff, -55);
        this.curRpm = Math.max(700, Math.min(this.MAX_RPM, this.curRpm));

        const fund = this._rpmFund(this.curRpm);
        const tc   = 0.07; // Ta constante de temps originelle

        // Application sur les oscillateurs (Identique à ton code)
        this.oscs.forEach(({ o, m }) => o.frequency.setTargetAtTime(fund * m, now, tc));
        this.noiseOsc.frequency.setTargetAtTime(fund * 2.1, now, tc);

        this.distNode.curve = this._makeDistCurve(80 + this.curLoad * 180);
        this.hp.frequency.setTargetAtTime(55 + this.curExh * 30, now, 0.1);
        this.lp.frequency.setTargetAtTime(2000 + this.curRpm * 0.18 + this.curExh * 1400, now, 0.1);
        this.mid.frequency.setTargetAtTime(400 + this.curRpm * 0.065 + this.curExh * 200, now, 0.1);
        this.mid.gain.setTargetAtTime(6 + this.curLoad * 10 + this.curExh * 6, now, 0.1);
        
        // Target volume originel (sans baisses de volume bizarres)
        this.masterGain.gain.setTargetAtTime(this._targetVol(), now, 0.1);
    }

    playBoostSound() {
        this._playSweep(200, 800, 0.3, 'sine', 0.1);
    }

    playShockwaveSound() {
        this._playSweep(100, 1500, 0.5, 'square', 0.3);
        this.playCrashSound(0.5);
    }

    playCrashSound(volume = 0.2) {
        if (!this.isInitialized) return;
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5);
        const gainObj = this.ctx.createGain();
        gainObj.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainObj.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        noise.connect(filter);
        filter.connect(gainObj);
        gainObj.connect(this.ctx.destination);
        noise.start();
    }

    playTakedownSound() {
        this.playCrashSound(0.6);
        this._playSweep(800, 200, 0.4, 'sawtooth', 0.4);
    }

    _playSweep(startFreq, endFreq, duration, type = 'sine', volume = 0.1) {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}
