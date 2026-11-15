
import Papa from 'papaparse';

export async function loadMoxieData() {
    try {
        const response = await fetch('/data/moxie_derived.csv');

        if (!response.ok) {
            throw new Error('NASA dataset could not be loaded');
        }

        const csv = await response.text();

        const result = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            comments: '#'
        });

        const rows = result.data;

        // Find the actual oxygen production column.
        const columns = Object.keys(rows[0] || {});

        const oxygenColumn = columns.find(key =>
            /F.*O2.*G.*HR/i.test(key)
        );

        if (!oxygenColumn) {
            throw new Error(
                'Oxygen production column not found. Check CSV headers.'
            );
        }

        const validRows = rows.filter(row =>
            Number.isFinite(Number(row[oxygenColumn]))
        );

        const rates = validRows.map(row =>
            Number(row[oxygenColumn])
        );

        return {
            source: 'NASA PDS MOXIE',
            samples: validRows.length,
            averageRate:
                rates.reduce((a, b) => a + b, 0) / rates.length,
            peakRate: Math.max(...rates),
            rates
        };

    } catch (error) {
        console.error('MOXIE data error:', error);
        return null;
    }
}
