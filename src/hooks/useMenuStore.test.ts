import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMenuData } from './useMenuStore.ts';

test('preserves intentionally blank closedNote values instead of restoring the default', () => {
  const data = normalizeMenuData({
    categories: [],
    seasonal: { enabled: false, title: '', note: '', items: [] },
    bebidas: { enabled: false, title: '', note: '', items: [] },
    combos: [],
    coupons: [],
    settings: {
      name: 'El Gordo & La Flaca',
      tagline: 'Antojitos Mexicanos',
      whatsappNumber: '525635397099',
      whatsappDisplay: '56 3539 7099',
      messageTemplate: 'Hola',
      templateV2: true,
      contactMessage: 'Hola',
      theme: { background: '#FFFFFF', text: '#161616', primary: '#FFDE59', secondary: '#FF751F' },
      open: true,
      scheduleMode: 'automatic',
      schedule: {},
      closedNote: '',
      payments: [],
    },
  });

  assert.equal(data.settings.closedNote, '');
});
