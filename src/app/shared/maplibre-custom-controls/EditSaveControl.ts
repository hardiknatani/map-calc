import maplibregl, { GeoJSONSource, IControl, Map } from 'maplibre-gl';
export default class SaveEditsControl implements IControl {

    _map: any;
    _saveBtn: HTMLButtonElement;
    _cancelBtn:HTMLButtonElement
    _container: HTMLDivElement;
    constructor() {
  
    }
  
    onAdd(map) {
      this._map = map;
      let _this = this;

      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl save-edits-ctrl";

        let _innerContainer = document.createElement('div');
        let h3 = document.createElement('h4');
        h3.innerText='Current Edits';
        h3.style.margin='0px';
        
        let div = document.createElement('div');
        div.classList.add('save-options-group')
      
  
      this._saveBtn = document.createElement("button");
      this._saveBtn.type = "button";
      this._saveBtn["aria-label"] = "Show Tile Boundaries";
      this._saveBtn.classList.add("mapboxgl-ctrl-icon");
      this._saveBtn.classList.add("mapboxgl-save-edits");
      this._saveBtn.innerHTML='Save';

      this._saveBtn.onclick = function () {
        _this.onSaveEdits()
      };

      this._cancelBtn = document.createElement("button");
      this._cancelBtn.type = "button";
      this._cancelBtn["aria-label"] = "Show Tile Boundaries";
      this._cancelBtn.classList.add("mapboxgl-ctrl-icon");
      this._cancelBtn.classList.add("mapboxgl-cancel-edits");
      this._cancelBtn.innerText='Cancel'
      this._cancelBtn.onclick = function () {
        // _this.toggleTileBoundaries()
      };
  
      div.append(this._saveBtn,this._cancelBtn)
      this._container.append(h3,div)

      return this._container;
    }
  
    onRemove() {
      (this._container as any).parentNode.removeChild(this._container);
      this._map = undefined;
    }
  
    onSaveEdits() {
        // this._map.showTileBoundaries=!this._map.showTileBoundaries
        let draw = this._map._controls[1];
        console.log(draw.getAll());
        let feature = draw.getAll().features[0];
        switch (feature.geometry.type) {
            case 'Polygon':
              feature['properties']['id']=(Math.floor(Math.random() * 900000 + 100000));
              let polygonData:any =( this._map.getSource('polygon-draw-source') as GeoJSONSource)._data;
              polygonData.features.push(feature);
              (this._map.getSource('polygon-draw-source') as GeoJSONSource).setData(polygonData);
              break;
  
            case "LineString":
              feature['properties']['id']=(Math.floor(Math.random() * 900000 + 100000));
              let lineData:any =( this._map.getSource('line-draw-source') as GeoJSONSource)._data;
              lineData.features.push(feature);
              (this._map.getSource('line-draw-source') as GeoJSONSource).setData(lineData);
            break;
  
            case "Point":
              feature['properties']['id']=(Math.floor(Math.random() * 900000 + 100000));
              let pointData:any =( this._map.getSource('point-draw-source') as GeoJSONSource)._data;
              pointData.features.push(feature);
              console.log(pointData);
              (this._map.getSource('point-draw-source') as GeoJSONSource).setData(pointData);
  
  
            break;
  
            default:
  
          }

                  draw.deleteAll()

  
    }}