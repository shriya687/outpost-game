
const API_URL =
    'https://service.iris.edu/irisws/mars-event/1/query?version=14&format=text';

export default class MarsquakeDatasetPanel {

    constructor(scene) {
        this.scene = scene;
        this.container = null;
    }

    async show() {
        const scene = this.scene;

        // Remove previous panel if it exists
        if (this.container) {
            this.container.destroy();
        }

        this.container = scene.add.container(160, 140);
        this.drawLoading();

        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const rawData = await response.text();
            const events = this.parseCatalogue(rawData);

            if (!events.length) {
                throw new Error('No Marsquake records returned.');
            }

            this.container.removeAll(true);
            this.drawDashboard(events);

        } catch (error) {
            console.error('Marsquake dataset error:', error);

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
        const lines = raw.trim().split(/\r?\n/);

        if (lines.length < 2) return [];

        const headers = lines[0].split('|');

        return lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split('|');
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
            'CONNECTING TO NASA INSIGHT DATA...',
            '#92400e', 12
        );

        this.addText(
            250, 155,
            'FETCHING SEISMIC RECORDS',
            '#64748b', 10
        );
    }

    addText(x, y, text, color = '#292524', size = 11) {
        const object = this.scene.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: `${size}px`,
            color,
            fontStyle: 'bold',
            wordWrap: { width: 440 },
            align: 'center'
        }).setOrigin(0.5);

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

        // Sort events chronologically
        const sorted = [...events].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        const latest = sorted[sorted.length - 1];

        // Find strongest event with an available magnitude
        const measured = events.filter(
            e => Number.isFinite(e.magnitude)
        );

        const strongest = measured.reduce(
            (max, event) =>
                !max || event.magnitude > max.magnitude
                    ? event
                    : max,
            null
        );

        // Count event classifications
        const types = {};

        events.forEach(event => {
            const type = this.normalizeType(event.type);
            types[type] = (types[type] || 0) + 1;
        });

        // HEADER
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

        // STRONGEST EVENT
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
                ? strongest.date.slice(0, 10)
                : '',
            '#64748b', 10
        );

        // LATEST EVENT
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
            latest.date.slice(0, 10),
            '#64748b', 10
        );

        // EVENT DISTRIBUTION
        this.addText(
            250, 177,
            'SEISMIC EVENT CLASSIFICATION',
            '#78350f', 12
        );

        const categories = [
            'LF', 'HF', 'BB', 'VF', 'SF', '2.4HZ'
        ];

        const total = events.length;
        const maxCount = Math.max(
            1,
            ...categories.map(type => types[type] || 0)
        );

        categories.forEach((type, index) => {

            const y = 200 + index * 9;

            const count = types[type] || 0;
            const barWidth = (count / maxCount) * 180;

            this.addText(
                48, y,
                type,
                '#292524', 9
            );

            const bar = this.scene.add.rectangle(
                165 + barWidth / 2,
                y,
                barWidth,
                6,
                0x16a34a
            );

            bar.setOrigin(0.5);
            this.container.add(bar);

            this.addText(
                280, y,
                `${count}`,
                '#292524', 9
            );
        });

        // DATA SOURCE
        this.addText(
            250, 258,
            'SOURCE: IRIS / INSIGHT MARSQUAKE SERVICE',
            '#64748b', 8
        );

        this.addText(
            250, 273,
            'CATALOGUE V14 | 2019–2022',
            '#64748b', 8
        );
    }

    normalizeType(type) {
        const value = (type || '').toUpperCase();

        if (value.includes('LOW_FREQUENCY')) return 'LF';
        if (value.includes('HIGH_FREQUENCY')) return 'HF';
        if (value.includes('BROADBAND')) return 'BB';
        if (value.includes('VERY_HIGH_FREQUENCY')) return 'VF';
        if (value.includes('SUPER_HIGH_FREQUENCY')) return 'SF';
        if (value.includes('2.4')) return '2.4HZ';

        return value;
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}
