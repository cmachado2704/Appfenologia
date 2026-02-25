declare module "react-native-maps" {
  import * as React from "react";

  export type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };

  export const Marker: React.ComponentType<any>;
  export const Callout: React.ComponentType<any>;

  const MapView: React.ComponentType<any>;
  export default MapView;
}
