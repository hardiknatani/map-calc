import { LngLat, MapboxGeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { IControl } from 'maplibre-gl';
interface InspectControlOptions {
    /** Log inspected features to console */
    console?: boolean;
}
export default class InspectControl implements IControl {
    console: boolean;
    popupNode: HTMLDivElement;
    lngLat: LngLat;
    isInspecting: boolean;
    button: HTMLButtonElement;
    mapContainer: HTMLElement;
    mapCanvas: HTMLCanvasElement;
    constructor(options?: InspectControlOptions);
    insert(): void;
    inspectingOn(): void;
    inspectingOff(): void;
    getFeatures(event: MapMouseEvent): MapboxGeoJSONFeature[];
    addPopup(features: MapboxGeoJSONFeature[]): void;
    removePopup(): void;
    updatePosition(): void;
    mapClickListener(event: MapMouseEvent): void;
    onAddControl(): void;
    onRemoveControl(): void;
    onAdd(): HTMLElement;
    onRemove(): void;
}
export {};
