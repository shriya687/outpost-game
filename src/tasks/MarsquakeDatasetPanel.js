

const API_URL =
    'https://service.iris.edu/irisws/mars-event/1/query?version=14&format=text';

export default class MarsquakeDatasetPanel {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.container = null;
        this.controller = new AbortController();
        this.destroyed = false;

        this.x = options.x ?? 170;
        this.y = options.y ?? 205;
        this.width = options.width ?? 460;
        this.height = options.height ?? 238;

        // Link the parent popup's abort signal
        this.externalSignal = options.signal;

        this.abortHandler = () => this.destroy();

        if (this.externalSignal) {
            if (this.externalSignal.aborted) {
                this.controller.abort();
            } else {
                this.externalSignal.addEventListener(
                    'abort',
                    this.abortHandler,
                    { once: true }
                );
            }
        }
    }

    async show() {
        if (this.destroyed || this.controller.signal.aborted) {
            return;
        }

        if (this.container) {
            this.container.destroy();
        }

        // Dashboard uses a 500 x 300 logical coordinate system.
        // Scale it to fit the slide's 460 x 238 content area.
        const scale = Math.min(
            this.width / 500,
            this.height / 300
        );

        this.container = this.scene.add.container(
            this.x + this.width / 2 - 250 * scale,
            this.y + this.height / 2 - 150 * scale
        );

        this.container.setScale(scale);
        this.container.setDepth(145);

        this.drawLoading();

        try {
            const response = await fetch(API_URL, {
                signal: this.controller.signal
            });

            if (!response.ok) {
                throw new Error(
                    `API error: ${response.status}`
                );
            }

            const rawData = await response.text();

            if (this.destroyed || this.controller.signal.aborted) {
                return;
            }

            const events = this.parseCatalogue(rawData);

            if (!events.length) {
                throw new Error(
                    'No Marsquake records returned.'
                );
            }

            if (!this.container || !this.container.active) {
                return;
            }

            this.container.removeAll(true);
            this.drawDashboard(events);

        } catch (error) {
            if (
                this.destroyed ||
                this.controller.signal.aborted ||
                error.name === 'AbortError'
            ) {
                return;
            }

            console.error(
                'Marsquake dataset error:',
                error
            );

            if (!this.container || !this.container.active) {
                return;
            }

            this.container.removeAll(true);

            this.addText(
                250, 110,
                'SEISMIC DATA UNAVAILABLE',
                '#dc2626', 15
            );

            this.addText(
                250, 145,
                'Could not connect to the InSight catalogue.',
                '#334155', 10
            );

            this.addText(
                250, 175,
                'Check your internet connection.',
                '#64748b', 10
            );
        }
    }

    parseCatalogue(raw) {
        const lines = raw
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));

        if (lines.length < 2) return [];

        const headers = lines[0]
            .split('|')
            .map(header => header.trim());

        return lines.slice(1)
            .map(line => {
                const values = line
                    .split('|')
                    .map(value => value.trim());

                const event = {};

                headers.forEach((header, index) => {
                    event[header] = values[index] || '';
                });

                return {
                    id: event.ContributorID || event.EventID,
                    date: event.Time,
                    magnitude: parseFloat(event.Magnitude),
                    magnitudeType: event.MagType,
                    type: event.EventType,
                    location: event.EventLocationName,
                    latitude: event.Latitude,
                    longitude: event.Longitude
                };
            })
            .filter(event => event.id);
    }

    drawLoading() {
        this.addText(
            250, 125,
            'CONNECTING TO INSIGHT DATA...',
            '#92400e', 12
        );

        this.addText(
            250, 155,
            'FETCHING SEISMIC RECORDS',
            '#64748b', 10
        );
    }

    addText(x, y, text, color = '#292524', size = 11) {
        const object = this.scene.add.text(
            x, y, text,
            {
                fontFamily: 'monospace',
                fontSize: `${size}px`,
                color,
                fontStyle: 'bold',
                wordWrap: { width: 440 },
                align: 'center'
            }
        ).setOrigin(0.5);

        this.container.add(object);

        return object;
    }

    addRect(x, y, width, height, color) {
        const rect = this.scene.add.rectangle(
            x, y, width, height, color
        );

        this.container.add(rect);

        return rect;
    }

    drawDashboard(events) {
        const sorted = [...events].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        const latest = sorted[sorted.length - 1];

        const measured = events.filter(
            event => Number.isFinite(event.magnitude)
        );

        const strongest = measured.reduce(
            (max, event) =>
                !max || event.magnitude > max.magnitude
                    ? event
                    : max,
            null
        );

        const types = {};

        events.forEach(event => {
            const type = this.normalizeType(event.type);
            types[type] = (types[type] || 0) + 1;
        });

        this.addText(
            250, 18,
            'INSIGHT SEISMIC DATA ARCHIVE',
            '#78350f', 17
        );

        this.addText(
            250, 43,
            `TOTAL RECORDED EVENTS: ${events.length}`,
            '#166534', 12
        );

        // Strongest event
        this.addRect(125, 100, 210, 85, 0xfef3c7);

        this.addText(
            125, 72,
            'STRONGEST RECORDED EVENT',
            '#92400e', 10
        );

        this.addText(
            125, 100,
            strongest
                ? `${strongest.id} | M ${strongest.magnitude}`
                : 'Magnitude unavailable',
            '#292524', 12
        );

        this.addText(
            125, 127,
            strongest
                ? (strongest.date || '').slice(0, 10)
                : '',
            '#64748b', 10
        );

        // Latest event
        this.addRect(375, 100, 210, 85, 0xfef3c7);

        this.addText(
            375, 72,
            'LAST CATALOGUED EVENT',
            '#92400e', 10
        );

        this.addText(
            375, 100,
            latest.id,
            '#292524', 12
        );

        this.addText(
            375, 127,
            (latest.date || '').slice(0, 10),
            '#64748b', 10
        );

        // Event distribution
        this.addText(
            250, 177,
            'SEISMIC EVENT CLASSIFICATION',
            '#78350f', 12
        );

        const categories = [
            'LF', 'HF', 'BB', 'VF', 'SF', '2.4HZ'
        ];

        const maxCount = Math.max(
            1,
            ...categories.map(type => types[type] || 0)
        );

        categories.forEach((type, index) => {
            const y = 200 + index * 9;

            const count = types[type] || 0;
            const barWidth = (count / maxCount) * 180;

            this.addText(48, y, type, '#292524', 9);

            const bar = this.scene.add.rectangle(
                165 + barWidth / 2,
                y,
                barWidth,
                6,
                0x16a34a
            );

            this.container.add(bar);

            this.addText(
                280, y,
                `${count}`,
                '#292524', 9
            );
        });

        this.addText(
            250, 258,
            'SOURCE: IRIS / INSIGHT MARSQUAKE SERVICE',
            '#64748b', 8
        );

        this.addText(
            250, 273,
            'CATALOGUE V14 | 2019-2022',
            '#64748b', 8
        );
    }

    normalizeType(type) {
        const value = (type || '')
            .trim()
            .toUpperCase();

        if (
            value === 'VF' ||
            value.includes('VERY_HIGH_FREQUENCY')
        ) return 'VF';

        if (
            value === 'SF' ||
            value.includes('SUPER_HIGH_FREQUENCY')
        ) return 'SF';

        if (
            value === 'LF' ||
            value.includes('LOW_FREQUENCY')
        ) return 'LF';

        if (
            value === 'HF' ||
            value.includes('HIGH_FREQUENCY')
        ) return 'HF';

        if (
            value === 'BB' ||
            value.includes('BROADBAND')
        ) return 'BB';

        if (value.includes('2.4')) return '2.4HZ';

        return value;
    }

    destroy() {
        if (this.destroyed) return;

        this.destroyed = true;

        this.controller.abort();

        if (this.externalSignal) {
            this.externalSignal.removeEventListener(
                'abort',
                this.abortHandler
            );
        }

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}

// Named export required by CommandTerminal.js
export function createMarsquakeDashboard(scene, options = {}) {
    const panel = new MarsquakeDatasetPanel(
        scene,
        options
    );

    // Start fetching without blocking slide navigation
    panel.show();

    // Return instance for cleanup
    return panel;
}
