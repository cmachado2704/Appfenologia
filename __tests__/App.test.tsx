/**
 * @format
 */

import { clusterPoints } from '../src/modules/reportes/clusterUtils';

describe('clusterPoints', () => {
  it('keeps different procesos in separate clusters even at same coordinates', () => {
    const clusters = clusterPoints([
      { lat: -12.1, lng: -77.0, loteNombre: 'L1', proceso: 'fenologia', fecha: '2026-01-01' },
      { lat: -12.1, lng: -77.0, loteNombre: 'L1', proceso: 'conteo', fecha: '2026-01-01' },
    ]);

    expect(clusters).toHaveLength(2);
    expect(new Set(clusters.map((c) => c.registros[0]?.proceso))).toEqual(new Set(['fenologia', 'conteo']));
  });
});
