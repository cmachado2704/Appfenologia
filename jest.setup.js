/* eslint-env jest */

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('@env', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  OPENWEATHER_API_KEY: 'test-key',
}), { virtual: true });

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: 'MapView',
  Marker: 'Marker',
  Polygon: 'Polygon',
  Callout: 'Callout',
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
