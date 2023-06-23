var Direction;
(function (Direction) {
    Direction["Next"] = "next";
    Direction["Prev"] = "prev";
})(Direction || (Direction = {}));
function getData(feature) {
    var _a;
    const layerData = [
        'layer',
        { key: 'id', value: feature.layer.id },
        { key: 'type', value: feature.layer.type },
        { key: 'source', value: feature.layer.source },
        { key: 'source-layer', value: (_a = feature.layer['source-layer']) !== null && _a !== void 0 ? _a : '—' },
    ];
    const featureData = ['properties'];
    if (feature.id) {
        featureData.push({ key: '$id', value: feature.id });
    }
    Object.entries(feature.properties).forEach(([key, value]) => {
        featureData.push({ key, value });
    });
    if (featureData.length === 1) {
        featureData.pop(); // remove title if there are no properties
    }
    return [...layerData, ...featureData];
}
export default function popupTemplate(features) {

    let iconRightSvg=`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#505050">
        <path d="M10 17l5-5-5-5v10z"/>
        <path fill="none" d="M0 24V0h24v24H0z"/>
    </svg>
    `;

    let iconRight=(new DOMParser().parseFromString(iconRightSvg, 'image/svg+xml')).firstChild


    let iconLeftSvg=`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#505050">
        <path d="M14 7l-5 5 5 5V7z"/>
        <path fill="none" d="M24 0v24H0V0h24z"/>
    </svg>
    `;

    let iconLeft=(new DOMParser().parseFromString(iconLeftSvg, 'image/svg+xml')).firstChild

    let current = 0;
    const root = document.createElement('div');
    root.classList.add('mapbox-control-inspect-popup');
    const content = document.createElement('div');
    content.classList.add('mapbox-control-inspect-content');
    const templatePrev = () => {
        const button = document.createElement('div');
        button.setAttribute('type', 'button');
        button.classList.add('mapbox-control-inspect-prev');
        button.appendChild(iconLeft);
        button.addEventListener('click', () => goTo(Direction.Prev));
        return button;
    };
    const templateNext = () => {
        const button = document.createElement('div');
        button.setAttribute('type', 'button');
        button.classList.add('mapbox-control-inspect-next');
        button.appendChild((iconRight));
        button.addEventListener('click', () => goTo(Direction.Next));
        return button;
    };
    const templateTitle = () => {
        const title = document.createElement('div');
        title.classList.add('mapbox-control-inspect-current');
        title.textContent = `${current + 1} / ${features.length}`;
        return title;
    };
    const templateHeader = () => {
        const header = document.createElement('div');
        header.classList.add('mapbox-control-inspect-header');
        header.appendChild(templatePrev());
        header.appendChild(templateTitle());
        header.appendChild(templateNext());
        return header;
    };
    const templateFeature = (feature) => {
        const table = document.createElement('table');
        table.classList.add('mapbox-control-inspect-grid');
        const data = getData(feature);
        data.forEach((record) => {
            const row = document.createElement('tr');
            if (typeof record === 'string') {
                const caption = document.createElement('th');
                caption.classList.add('mapbox-control-inspect-caption');
                caption.colSpan = 2;
                caption.textContent = record;
                row.appendChild(caption);
                table.append(row);
                return;
            }
            const key = document.createElement('th');
            const value = document.createElement('td');
            key.classList.add('mapbox-control-inspect-key');
            value.classList.add('mapbox-control-inspect-value');
            key.textContent = record.key;
            value.textContent = String(record.value);
            row.appendChild(key);
            row.appendChild(value);
            table.append(row);
        });
        return table;
    };
    function goTo(dir) {
        if (dir === Direction.Prev) {
            current = current !== 0 ? current - 1 : features.length - 1;
        }
        else if (dir === Direction.Next) {
            current = current !== features.length - 1 ? current + 1 : 0;
        }
        content.innerHTML = '';
        content.appendChild(templateHeader());
        content.appendChild(templateFeature(features[current]));
    }
    root.appendChild(content);
    if (!features.length) {
        content.textContent = 'No features';
    }
    else {
        if (features.length > 1) {
            content.appendChild(templateHeader());
        }
        content.appendChild(templateFeature(features[current]));
    }
    return root;
}
//# sourceMappingURL=popupTemplate.js.map