import maplibregl, { GeoJSONSource, IControl, Map } from 'maplibre-gl';
export default class TileBoundariesControl implements IControl {

    _map: any;
    _btn: HTMLButtonElement;
    _container: HTMLDivElement;
    constructor() {
  
    }
  
    onAdd(map) {
      this._map = map;
      let _this = this;
  
      this._btn = document.createElement("button");
      this._btn.type = "button";
      this._btn["aria-label"] = "Show Tile Boundaries";
      this._btn.classList.add("mapboxgl-ctrl-icon");
      this._btn.classList.add("mapboxgl-tile-boundaries");
      this._btn.onclick = function () {
        _this.toggleTileBoundaries()
      };
  
      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
      this._container.appendChild(this._btn);
  
      return this._container;
    }
  
    onRemove() {
      (this._container as any).parentNode.removeChild(this._container);
      this._map = undefined;
    }
  
    toggleTileBoundaries() {
        this._map.showTileBoundaries=!this._map.showTileBoundaries

  
    }}