import popupTemplate from './popupTemplate';
export default class InspectControl  {
    constructor(options) {
        this.console = options === null || options === void 0 ? void 0 : options.console;
        this.popupNode = null;
        this.lngLat = null;
        this.isInspecting = false;
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.node = document.createElement('div');
        this.node.classList.add('mapboxgl-ctrl');
        this.node.classList.add('mapboxgl-ctrl-group');
        this.node.classList.add('mapbox-control');
        this.inspectIConSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#505050">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M20 19.59V8l-6-6H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c.45 0 .85-.15 1.19-.4l-4.43-4.43c-.8.52-1.74.83-2.76.83-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5c0 1.02-.31 1.96-.83 2.75L20 19.59zM9 13c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3z"/>
        </svg>
        `;
        this.inspectIcon= (new DOMParser().parseFromString(this.inspectIConSvg, 'image/svg+xml')).firstChild
    }
    insert() {
        this.addClassName('mapbox-control-inspect');
        this.button.appendChild(this.inspectIcon);
        this.button.addEventListener('click',() => {
            if (this.isInspecting) {
                this.inspectingOff();
            }
            else {
                this.inspectingOn();
            }
        });
        this.addButton(this.button);
        this.mapClickListener = this.mapClickListener.bind(this);
        this.updatePosition = this.updatePosition.bind(this);
    }
    inspectingOn() {
        this.isInspecting = true;
        this.button.classList.add('-active');
        this.map.on('click', this.mapClickListener);
        this.map.on('move', this.updatePosition);
        this.map.getCanvas().style.cursor = 'pointer';
    }
    inspectingOff() {
        this.isInspecting = false;
        this.button.classList.remove('-active');
        this.map.off('click', this.mapClickListener);
        this.map.off('move', this.updatePosition);
        this.map.getCanvas().style.cursor = '';
        this.removePopup();
    }
    getFeatures(event) {
        const selectThreshold = 0;
        const queryBox = [
            [event.point.x - selectThreshold, event.point.y + selectThreshold],
            [event.point.x + selectThreshold, event.point.y - selectThreshold], // top right (NE)
        ];
        return this.map.queryRenderedFeatures(queryBox).filter(feature=>feature.source!="maptiler_planet");
    }
    addPopup(features) {
        this.popupNode = popupTemplate(features);
        this.mapContainer.appendChild(this.popupNode);
        this.updatePosition();
        if (this.console) {
            console.log(features);
        }
    }
    removePopup() {
        if (!this.popupNode)
            return;
        this.mapContainer.removeChild(this.popupNode);
        this.popupNode = null;
    }
    updatePosition() {
        if (!this.lngLat)
            return;
        const canvasRect = this.mapCanvas.getBoundingClientRect();
        const pos = this.map.project(this.lngLat);
        this.popupNode.style.left = `${pos.x - canvasRect.left}px`;
        this.popupNode.style.top = `${pos.y}px`;
    }
    mapClickListener(event) {
        this.lngLat = event.lngLat;
        const features = this.getFeatures(event);
        this.removePopup();
        this.addPopup(features);
    }
    onAddControl() {
        this.mapContainer = this.map.getContainer();
        this.mapCanvas = this.map.getCanvas();
        this.insert();
    }
    onRemoveControl() {
        this.inspectingOff();
    }

    addButton(button) {
        this.node.appendChild(button);
    }
    addClassName(className) {
        this.node.classList.add(className);
    }
    removeClassName(className) {
        this.node.classList.remove(className);
    }
    onAdd(map) {
        this.map = map;
        this.onAddControl();
        return this.node;
    }
    onRemove() {
        this.onRemoveControl();
        this.node.parentNode.removeChild(this.node);
        this.map = undefined;
    }

}
