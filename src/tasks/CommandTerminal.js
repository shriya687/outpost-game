import {
    createMarsquakeDashboard
} from './MarsquakeDatasetPanel.js';
export default class CommandTerminal {

    constructor(scene, onClose) {
        this.scene = scene;
        this.onClose = onClose;

        this.objects = [];
        this.detailObjects = [];
        this.closed = false;
        this.inDetailView = false;
        this.marsquakeDashboard = null;
        this.marsquakeAbortController = null;
        this.dashboardRequestId = 0;

        this.create();
    }

    addObject(object) {
        object.setDepth(120);
        this.objects.push(object);
        return object;
    }

    addDetailObject(object) {
        object.setDepth(135);
        this.detailObjects.push(object);
        return object;
    }

    cleanupMarsquakeDashboard() {
    // Invalidate any previous asynchronous dashboard operation
    this.dashboardRequestId++;

    // Abort an unfinished catalogue request
    if (this.marsquakeAbortController) {
        this.marsquakeAbortController.abort();
        this.marsquakeAbortController = null;
    }

    // Destroy the previous dashboard
    if (this.marsquakeDashboard) {
        if (typeof this.marsquakeDashboard === 'function') {
            this.marsquakeDashboard();
        } else if (
            typeof this.marsquakeDashboard.destroy === 'function'
        ) {
            this.marsquakeDashboard.destroy();
        }

        this.marsquakeDashboard = null;
    }
}

    create() {
        // 1. Dark backdrop overlay
        this.addObject(
            this.scene.add.rectangle(400, 300, 800, 600, 0x050811, 0.92)
                .setInteractive()
        );

        // 2. Retro Computer Monitor Outer Frame & Stand
        this.addObject(
            this.scene.add.rectangle(400, 290, 740, 460, 0x1e293b)
                .setStrokeStyle(6, 0x64748b)
        );
        this.addObject(
            this.scene.add.rectangle(400, 285, 704, 410, 0x1a110d)
                .setStrokeStyle(3, 0x38bdf8)
        );
        this.addObject(
            this.scene.add.circle(725, 505, 5, 0x22c55e)
        );
        this.addObject(
            this.scene.add.rectangle(400, 535, 110, 30, 0x334155)
                .setStrokeStyle(3, 0x64748b)
        );
        this.addObject(
            this.scene.add.rectangle(400, 554, 210, 14, 0x475569)
                .setStrokeStyle(2, 0x94a3b8)
        );

        // 3. Terminal Header Bar
        this.addObject(
            this.scene.add.text(400, 102, 'ARES-4 CENTRAL DATABASE // MARS ARCHIVES', {
                fontSize: '18px',
                fontFamily: 'monospace',
                color: '#38bdf8',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );

        // Close Button [X]
        const closeBtn = this.addObject(
            this.scene.add.text(728, 102, '[X]', {
                fontSize: '17px',
                fontFamily: 'monospace',
                color: '#ef4444',
                fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        );
        closeBtn.on('pointerdown', () => this.destroy());

        // 4. Three Archive Cards with Full Multi-Slide NASA Briefings
        const cards = [
            {
                x: 185,
                title: 'Mars Atmosphere',
                type: 'co2',
                summary: 'MARS AIR: 95% CO2, <1% O2. Click to open full NASA atmospheric & climate archive.',
                slides: [
                    {
                        subtitle: 'Composition & Thin Pressure',
                        headline: '100X THINNER THAN EARTH',
                        neilNote: 'At 0.6% of Earth’s pressure, stepping outside without a pressurized suit is fatal in seconds!',
                        body: 'Mars’ atmosphere is over 100 times thinner than Earth’s and is primarily composed of carbon dioxide (95%), nitrogen (2.85%), and argon gases (2%). Surface pressure is about 610 pascals (0.088 psi), which is roughly 0.6% of Earth’s value.',
                        art: 'atmo_gas'
                    },
                    {
                        subtitle: 'Temperature & Rusty Skies',
                        headline: 'FREEZING & RUSTY TAN SKIES',
                        neilNote: 'Keep our thermal heater ready at night—average temperatures sit around -59 °C (-74 °F)!',
                        body: 'Mars is much colder than Earth, with an average temperature of -59 °C (-74 °F). Oxidized dust particles kicked up from the Martian surface fill the atmosphere, turning Mars skies a rusty tan color, according to NASA.',
                        art: 'atmo_dust'
                    },
                    {
                        subtitle: 'Subsurface Ice & Weather',
                        headline: 'ICE, DUST STORMS & SNOW',
                        neilNote: 'Liquid water boils away in thin air—that’s why we mine subsurface water-ice in craters!',
                        body: 'Water exists on Mars, but the atmosphere is too thin for it to last long on the surface as liquid. Instead, water is found below polar regions as water-ice and seasonal briny flows. Despite thin air, Mars exhibits dynamic climate, dust storms, and even snow.',
                        art: 'atmo_ice'
                    }
                ]
            },
            {
                x: 400,
                title: 'Radiation & EVA',
                type: 'radiation',
                summary: 'SOLAR RADIATION: Click to inspect NASA Curiosity RAD spacewalk safety data.',
                slides: [
                    {
                        subtitle: 'No Magnetic Shield',
                        headline: 'COSMIC RAYS & SOLAR FLARES',
                        neilNote: 'Always check the Airlock radiation monitor before heading out for crystal mining!',
                        body: 'Unlike Earth, Mars lacks a global magnetic field and thick atmosphere to deflect space radiation. NASA’s Curiosity rover measured an average surface dose of ~0.64 millisieverts per day from Galactic Cosmic Rays.',
                        art: 'rad_waves'
                    },
                    {
                        subtitle: 'EVA Suit Limits',
                        headline: 'WATCH YOUR SUIT DOSIMETER',
                        neilNote: 'If solar flares push radiation into the Red Zone, get back inside the Airlock immediately!',
                        body: 'Sudden solar particle events can rapidly spike radiation levels on the Martian surface. Thin EVA suits provide limited shielding—return to the shielded outpost before your suit dose hits 100%.',
                        art: 'rad_suit'
                    }
                ]
            },
            {
                x: 615,
                title: 'Marsquakes',
                type: 'quake',
                summary: 'MARSQUAKES: 1,319 seismic events recorded by NASA InSight. Click to inspect full SEIS archive.',
                slides: [
                    {
                        subtitle: 'Faults & Meteorite Impacts',
                        headline: 'WHAT ARE MARSQUAKES?',
                        neilNote: 'Shifting faults and sudden meteorite impacts can both send tremors across the Martian surface!',
                        body: 'Marsquakes are seismic events that cause the Martian ground to shake. They can result from geological activity, such as faults shifting, and from meteorite impacts.',
                        art: 'quake_fault'
                    },
                    {
                        subtitle: 'NASA InSight & SEIS Instrument',
                        headline: '1,319 MARSQUAKES RECORDED',
                        neilNote: 'InSight’s SEIS instrument was sensitive enough to detect vibrations smaller than a hydrogen atom!',
                        body: "NASA's InSight lander used a highly sensitive instrument called the Seismic Experiment for Interior Structure (SEIS) to measure ground vibrations.\n\n• InSight recorded 1,319 marsquakes during its mission.",
                        art: 'quake_wave',
                        dataset: true
                        },
                    
                    {
                        subtitle: '2021 Impact & Deep Interior',
                        headline: 'CRUST, MANTLE & CORE',
                        neilNote: 'Seismic waves let scientists map Mars’ interior—and remind us to inspect base pipes after quakes!',
                        body: '• Scientists identified a magnitude 4 event in 2021 associated with a large meteoroid impact.\n\n• Seismic waves helped scientists investigate the Martian crust, mantle and core.',
                        art: 'quake_base'
                    }
                ]
            }

        ];

        cards.forEach((card) => {
            this.createInfoCard(card);
        });

        // 5. Bottom Detail Readout Box inside the Monitor Screen
        this.addObject(
            this.scene.add.rectangle(400, 444, 650, 64, 0x0f172a, 0.95)
                .setStrokeStyle(2, 0x9a3412)
        );

        this.detailText = this.addObject(
            this.scene.add.text(400, 444, 'Click any archive card above to open detailed NASA Mars data. Press ESC to exit.', {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#fef08a',
                align: 'center',
                wordWrap: { width: 620 },
                lineSpacing: 5
            }).setOrigin(0.5)
        );

        // Escape key listener (closes detail popup first, or closes terminal)
        this.handleEscape = (event) => {
            if (event.key === 'Escape' || event.code === 'Escape') {
                event.preventDefault();
                if (this.inDetailView) {
                    this.closeDetailPopup();
                } else {
                    this.destroy();
                }
            }
        };
        window.addEventListener('keydown', this.handleEscape);
    }

    createInfoCard(card) {
        const y = 265;

        const outerBox = this.addObject(
            this.scene.add.rectangle(card.x, y, 185, 235, 0x291811)
                .setStrokeStyle(2, 0xb4532a)
                .setInteractive({ useHandCursor: true })
        );

        this.addObject(
            this.scene.add.rectangle(card.x, y - 22, 154, 154, 0xfef3c7)
                .setStrokeStyle(2, 0x78350f)
        );

        const g = this.addObject(this.scene.add.graphics());
        this.drawCardThumbnail(g, card.x, y - 22, card.type);

        const label = this.addObject(
            this.scene.add.text(card.x, y + 84, card.title, {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );

        outerBox.on('pointerover', () => {
            outerBox.setStrokeStyle(3, 0x38bdf8);
            label.setColor('#38bdf8');
            this.detailText.setText(card.summary);
        });

        outerBox.on('pointerout', () => {
            outerBox.setStrokeStyle(2, 0xb4532a);
            label.setColor('#ffffff');
        });

        // Clicking opens the detailed multi-slide popup window!
        outerBox.on('pointerdown', () => {
            this.openDetailPopup(card);
        });
    }

    // =========================================================================
    // DETAILED SLIDE VIEWER POPUP (Matches your 2nd & 3rd reference screenshots!)
    // =========================================================================
    openDetailPopup(card) {
        this.closeDetailPopup();
        this.inDetailView = true;
        let currentSlide = 0;
        // 1. Full Monitor Espresso-Brown Overlay Panel
        this.addDetailObject(
            this.scene.add.rectangle(400, 285, 704, 410, 0x24130b, 0.99)
                .setStrokeStyle(3, 0x9a3412)
                .setInteractive() // Blocks clicks to the 3 cards underneath
        );
        // 2. Top-Right "X" Close Button (Returns to 3-card database view)
        const closeDetailBtn = this.addDetailObject(
            this.scene.add.text(728, 102, 'X', {
                fontSize: '18px',
                fontFamily: 'monospace',
                color: '#cbd5e1',
                fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        );
        closeDetailBtn.on('pointerover', () => closeDetailBtn.setColor('#ef4444'));
        closeDetailBtn.on('pointerout', () => closeDetailBtn.setColor('#cbd5e1'));
        closeDetailBtn.on('pointerdown', () => this.closeDetailPopup());
        // 3. Top-Center Topic Title & Subtitle
        this.addDetailObject(
            this.scene.add.text(445, 112, card.title, {
                fontSize: '17px',
                fontFamily: 'monospace',
                color: '#f59e0b',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );
        const subtitleText = this.addDetailObject(
            this.scene.add.text(445, 148, '', {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#fef3c7',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );
        // 4. Top-Left Green-Bordered Dialogue Box ("NEIL")
        this.addDetailObject(
            this.scene.add.rectangle(195, 144, 265, 92, 0x0d1322, 0.98)
                .setStrokeStyle(2, 0x22c55e)
        );
        this.addDetailObject(
            this.scene.add.rectangle(104, 112, 62, 18, 0x22c55e)
        );
        this.addDetailObject(
            this.scene.add.text(104, 112, 'NEIL', {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#090d16',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );
        const neilDialogueText = this.addDetailObject(
            this.scene.add.text(74, 128, '', {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#ffffff',
                wordWrap: { width: 245 },
                lineSpacing: 4
            })
        );
        // 5. Top-Right Neil Astronaut Portrait with Gentle Bob
        const neilSprite = this.addDetailObject(
            this.scene.add.image(665, 145, 'astronaut').setScale(0.18)
        );
        this.detailBobTween = this.scene.tweens.add({
            targets: neilSprite,
            y: 140,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // 6. Center Large Cream/Parchment Information Card
        this.addDetailObject(
            this.scene.add.rectangle(400, 315, 460, 238, 0xfef3c7)
                .setStrokeStyle(3, 0xb4532a)
        );
        // Bold Pixel Headline inside Parchment Card
        const cardHeadline = this.addDetailObject(
            this.scene.add.text(400, 218, '', {
                fontSize: '18px',
                fontFamily: 'monospace',
                color: '#291811',
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5)
        );
        // Pixel Illustration Area inside Parchment Card
        const slideGraphics = this.addDetailObject(this.scene.add.graphics());
        // Detailed NASA Paragraph Text inside Parchment Card
        const cardBodyText = this.addDetailObject(
            this.scene.add.text(400, 355, '', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#1e1b18',
                align: 'center',
                wordWrap: { width: 425 },
                lineSpacing: 4
            }).setOrigin(0.5)
        );
        // Slide Counter (e.g., "1 / 3")
        const pageCounter = this.addDetailObject(
            this.scene.add.text(400, 460, '', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#94a3b8'
            }).setOrigin(0.5)
        );
        // 7. Bottom-Left "<- Back" & Bottom-Right "Next ->" Buttons
        const backBtn = this.addDetailObject(
            this.scene.add.rectangle(115, 458, 92, 28, 0x291811)
                .setStrokeStyle(2, 0x78350f)
                .setInteractive({ useHandCursor: true })
        );
        const backLabel = this.addDetailObject(
            this.scene.add.text(115, 458, '<- Back', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#e2e8f0',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );
        const nextBtn = this.addDetailObject(
            this.scene.add.rectangle(685, 458, 92, 28, 0x291811)
                .setStrokeStyle(2, 0x78350f)
                .setInteractive({ useHandCursor: true })
        );
        const nextLabel = this.addDetailObject(
            this.scene.add.text(685, 458, 'Next ->', {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#e2e8f0',
                fontStyle: 'bold'
            }).setOrigin(0.5)
        );
        // Render Slide Helper
        const renderSlide = (idx) => {
    const slide = card.slides[idx];

    // Remove any dashboard from the previous slide
    this.cleanupMarsquakeDashboard();

    // Update slide information
    subtitleText.setText(slide.subtitle);
    neilDialogueText.setText(slide.neilNote);

    pageCounter.setText(
        `Slide ${idx + 1} of ${card.slides.length}`
    );

    // Clear previous illustration
    slideGraphics.clear();

    if (slide.dataset === true) {

        // Hide ordinary content on the dataset slide
        cardHeadline.setVisible(false);
        cardBodyText.setVisible(false);
        slideGraphics.setVisible(false);

        // Create a new request controller
        const controller = new AbortController();

        this.marsquakeAbortController = controller;

        const requestId = ++this.dashboardRequestId;

        try {
            const dashboard = createMarsquakeDashboard(
                this.scene,
                {
                    x: 170,
                    y: 205,
                    width: 460,
                    height: 238,
                    signal: controller.signal
                }
            );

            this.marsquakeDashboard = dashboard;

} catch (error) {
    console.error(
        'Unable to create Marsquake dashboard:',
        error
    );
}
    } else {

        // Restore normal slide content
        cardHeadline.setVisible(true);
        cardBodyText.setVisible(true);
        slideGraphics.setVisible(true);

        cardHeadline.setText(slide.headline);
        cardBodyText.setText(slide.body);

        this.drawSlideArt(
            slideGraphics,
            400,
            268,
            slide.art
        );
    }

    // Update navigation controls
    backLabel.setAlpha(idx > 0 ? 1 : 0.4);

    nextLabel.setText(
        idx < card.slides.length - 1
            ? 'Next ->'
            : 'Done ✓'
    );
};
        backBtn.on('pointerdown', () => {
            if (currentSlide > 0) {
                currentSlide--;
                renderSlide(currentSlide);
            }
        });
        nextBtn.on('pointerdown', () => {
            if (currentSlide < card.slides.length - 1) {
                currentSlide++;
                renderSlide(currentSlide);
            } else {
                this.closeDetailPopup();
            }
        });
        renderSlide(0);
    }

    closeDetailPopup() {
    this.inDetailView = false;

    // Cancel pending requests and remove dashboard
    this.cleanupMarsquakeDashboard();

    // Stop astronaut animation
    if (this.detailBobTween) {
        this.detailBobTween.stop();
        this.detailBobTween = null;
    }

    // Destroy popup objects
    this.detailObjects.forEach(obj => {
        if (obj && obj.destroy) {
            obj.destroy();
        }
    });

    this.detailObjects = [];
}

    // Draws compact pixel art inside the parchment slide card
    drawSlideArt(g, cx, cy, artType) {
        if (artType === 'atmo_gas') {
            // CO2 / N2 / Ar bar comparison
            g.fillStyle(0x78350f, 1);
            g.fillRect(cx - 90, cy + 16, 180, 6);
            // 95% CO2 tall bar
            g.fillStyle(0x64748b, 1);
            g.fillRect(cx - 65, cy - 22, 42, 38);
            // 2.85% N2 tiny bar
            g.fillStyle(0x38bdf8, 1);
            g.fillRect(cx - 5, cy + 8, 32, 8);
            // 2% Ar tiny bar
            g.fillStyle(0xa855f7, 1);
            g.fillRect(cx + 45, cy + 10, 32, 6);
        } else if (artType === 'atmo_dust') {
            // Rusty Mars horizon + swirling dust clouds
            g.fillStyle(0xb45309, 1);
            g.fillRect(cx - 95, cy + 8, 190, 14);
            g.fillStyle(0xd97706, 1);
            g.fillRoundedRect(cx - 75, cy - 18, 65, 14, 7);
            g.fillRoundedRect(cx + 5, cy - 10, 75, 14, 7);
            g.fillStyle(0x38bdf8, 1);
            g.fillRect(cx - 88, cy - 22, 10, 26); // Thermometer
        } else if (artType === 'atmo_ice') {
            // Subsurface water-ice crystals & snowflakes
            g.fillStyle(0x78350f, 1);
            g.fillRect(cx - 95, cy + 4, 190, 18);
            g.fillStyle(0x0ea5e9, 1);
            g.fillTriangle(cx - 35, cy + 16, cx - 22, cy - 12, cx - 10, cy + 16);
            g.fillTriangle(cx + 15, cy + 16, cx + 28, cy - 16, cx + 42, cy + 16);
        } else if (artType === 'rad_waves') {
            g.fillStyle(0xdc2626, 1);
            g.fillCircle(cx, cy, 18);
            g.lineStyle(3, 0xd97706, 1);
            g.strokeCircle(cx, cy, 26);
            g.strokeCircle(cx, cy, 34);
        } else if (artType === 'rad_suit') {
            g.fillStyle(0x22c55e, 1);
            g.fillRect(cx - 75, cy - 8, 45, 18);
            g.fillStyle(0xeab308, 1);
            g.fillRect(cx - 22, cy - 8, 45, 18);
            g.fillStyle(0xef4444, 1);
            g.fillRect(cx + 31, cy - 8, 45, 18);
        } else if (artType === 'ai_loop') {
            g.lineStyle(3, 0x16a34a, 1);
            g.strokeCircle(cx - 45, cy, 16);
            g.lineStyle(3, 0x0284c7, 1);
            g.strokeCircle(cx, cy, 16);
            g.lineStyle(3, 0xd97706, 1);
            g.strokeCircle(cx + 45, cy, 16);
        } else if (artType === 'ai_keys') {
            g.fillStyle(0x1e293b, 1);
            g.fillRoundedRect(cx - 50, cy - 16, 36, 32, 6);
            g.fillRoundedRect(cx + 14, cy - 16, 36, 32, 6);
        }
    }

    drawCardThumbnail(g, cx, cy, type) {
        if (type === 'co2') {
            g.fillStyle(0x78350f, 1);
            g.fillRect(cx - 55, cy + 42, 110, 12);
            const plantX = [cx - 34, cx, cx + 34];
            plantX.forEach((px, idx) => {
                const h = 24 + idx * 12;
                g.fillStyle(0x16a34a, 1);
                g.fillRect(px - 3, cy + 42 - h, 6, h);
                g.fillRect(px - 12, cy + 34 - h, 9, 6);
                g.fillRect(px + 3, cy + 30 - h, 9, 6);
            });
            g.fillStyle(0x9ca3af, 1);
            g.fillCircle(cx - 8, cy - 28, 22);
            this.addObject(
                this.scene.add.text(cx - 8, cy - 28, 'CO2', {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: '#1f2937',
                    fontStyle: 'bold'
                }).setOrigin(0.5)
            );
        } else if (type === 'radiation') {
            g.fillStyle(0xdc2626, 1);
            g.fillCircle(cx, cy + 12, 34);
            g.fillStyle(0x991b1b, 1);
            g.fillCircle(cx - 10, cy + 6, 8);
            g.fillCircle(cx + 12, cy + 20, 6);
            g.lineStyle(4, 0xd97706, 1);
            g.strokeCircle(cx, cy + 12, 46);
            g.lineStyle(3, 0xf59e0b, 1);
            g.strokeCircle(cx, cy + 12, 58);
            this.addObject(
                this.scene.add.text(cx, cy - 54, 'SOLAR RAD', {
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#b45309',
                    fontStyle: 'bold'
                }).setOrigin(0.5)
            );
        } else if (type === 'quake') {
            g.lineStyle(3, 0x7c2d12, 1);
            g.strokeCircle(cx, cy, 66);
            g.strokeCircle(cx, cy, 74);

            g.fillStyle(0xc2410c, 1);
            g.fillCircle(cx, cy, 48);
            g.lineStyle(3, 0x7c2d12, 1);
            g.strokeCircle(cx, cy, 48);

            g.fillStyle(0xf97316, 1);
            g.fillEllipse(cx - 10, cy - 20, 42, 16);
            g.fillStyle(0x7c2d12, 1);
            g.fillCircle(cx - 20, cy + 8, 7);
            g.fillCircle(cx + 18, cy + 20, 5);

            g.lineStyle(4, 0xfef3c7, 1);
            g.lineBetween(cx - 8, cy - 38, cx + 4, cy - 14);
            g.lineBetween(cx + 4, cy - 14, cx - 6, cy + 2);
            g.lineBetween(cx - 6, cy + 2, cx + 9, cy + 24);
        } else if (type === 'ai') {
            g.fillStyle(0x1e293b, 1);
            g.fillRect(cx - 42, cy - 42, 84, 68);
            g.fillStyle(0xffffff, 1);
            g.fillRect(cx - 36, cy - 36, 72, 50);
            g.fillStyle(0x1e293b, 1);
            g.fillRect(cx - 10, cy + 26, 20, 14);
            g.fillRect(cx - 26, cy + 40, 52, 8);
            this.addObject(
                this.scene.add.text(cx, cy - 11, 'ARES\nAI', {
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    color: '#0f172a',
                    fontStyle: 'bold',
                    align: 'center'
                }).setOrigin(0.5)
            );
        }
    }

    destroy() {
        if (this.closed) return;
        this.closed = true;
        this.closeDetailPopup();
        window.removeEventListener('keydown', this.handleEscape);
        this.objects.forEach(obj => {
            if (obj && obj.destroy) obj.destroy();
        });
        this.objects = [];
        if (this.onClose) this.onClose();
    }
}
