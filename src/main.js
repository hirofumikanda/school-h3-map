import "./style.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { addProtocol, Map, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Protocol } from "pmtiles";

setWorkerUrl(maplibreWorkerUrl);

const protocol = new Protocol();
addProtocol("pmtiles", protocol.tile);

const schoolKinds = [
  { label: "小学校", countProperty: "elementary_school_count", color: "#2563eb" },
  { label: "中学校", countProperty: "junior_high_school_count", color: "#16a34a" },
  { label: "高等学校", countProperty: "high_school_count", color: "#dc2626" },
  { label: "高等専門学校", countProperty: "technical_college_count", color: "#9333ea" },
  { label: "短期大学", filterLabel: "短大", countProperty: "junior_college_count", color: "#ea580c" },
  { label: "大学", countProperty: "university_count", color: "#0891b2" },
  { label: "幼稚園", countProperty: "kindergarten_count", color: "#db2777" },
  { label: "その他", color: "#6b7280" },
];

const schoolCountBreaks = {
  school_count: {
    2: [53, 152, 855, 2695, 11077], 3: [10, 66, 329, 748, 1877],
    4: [8, 29, 67, 175, 478], 5: [3, 6, 13, 34, 121],
    6: [1, 2, 4, 10, 36], 7: [1, 2, 2, 4, 11], 8: [1, 1, 1, 2, 4],
  },
  elementary_school_count: {
    2: [23, 60, 283, 903, 3585], 3: [5, 28, 136, 274, 632],
    4: [4, 13, 26, 58, 143], 5: [1, 3, 5, 12, 38],
    6: [1, 1, 2, 4, 10], 7: [0, 1, 1, 1, 3], 8: [0, 0, 1, 1, 1],
  },
  junior_high_school_count: {
    2: [15, 34, 156, 487, 1766], 3: [3, 17, 62, 132, 324],
    4: [2, 7, 15, 26, 76], 5: [1, 1, 3, 6, 19],
    6: [0, 1, 1, 2, 6], 7: [0, 0, 1, 1, 2], 8: [0, 0, 0, 1, 1],
  },
  high_school_count: {
    2: [2, 13, 81, 255, 914], 3: [1, 5, 31, 69, 154],
    4: [1, 2, 6, 15, 37], 5: [0, 0, 1, 3, 11],
    6: [0, 0, 0, 1, 4], 7: [0, 0, 0, 1, 1], 8: [0, 0, 0, 0, 1],
  },
  technical_college_count: {
    2: [0, 0, 2, 4, 10], 3: [0, 0, 0, 1, 3],
    4: [0, 0, 0, 0, 0], 5: [0, 0, 0, 0, 0],
    6: [0, 0, 0, 0, 0], 7: [0, 0, 0, 0, 0], 8: [0, 0, 0, 0, 0],
  },
  junior_college_count: {
    2: [0, 1, 3, 15, 62], 3: [0, 0, 1, 3, 13],
    4: [0, 0, 0, 1, 4], 5: [0, 0, 0, 0, 1],
    6: [0, 0, 0, 0, 0], 7: [0, 0, 0, 0, 0], 8: [0, 0, 0, 0, 0],
  },
  university_count: {
    2: [0, 1, 9, 48, 250], 3: [0, 0, 4, 10, 37],
    4: [0, 0, 0, 2, 10], 5: [0, 0, 0, 0, 3],
    6: [0, 0, 0, 0, 1], 7: [0, 0, 0, 0, 1], 8: [0, 0, 0, 0, 0],
  },
  kindergarten_count: {
    2: [4, 24, 127, 358, 1751], 3: [1, 7, 29, 93, 278],
    4: [0, 2, 7, 22, 79], 5: [0, 0, 1, 5, 19],
    6: [0, 0, 0, 2, 7], 7: [0, 0, 0, 1, 2], 8: [0, 0, 0, 1, 1],
  },
};

const h3FillColors = ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#f03b20", "#bd0026"];
const buildH3FillColor = (countProperty) => [
  "case",
  ...Object.entries(schoolCountBreaks[countProperty]).flatMap(([resolution, breaks]) => {
    const stops = new globalThis.Map();
    breaks.forEach((value, index) => {
      if (value > 0) {
        stops.set(value, h3FillColors[index + 1]);
      }
    });
    const stopEntries = stops.size
      ? Array.from(stops).flat()
      : [1, h3FillColors[0]];

    return [
      ["==", ["get", "resolution"], Number(resolution)],
      ["step", ["get", countProperty], h3FillColors[0], ...stopEntries]
    ];
  }),
  "#cccccc"
];

const map = new Map({
  container: "map",
  style: {
    version: 8,

    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors"
      },
      school: {
        type: "vector",
        url: `pmtiles://${import.meta.env.BASE_URL}school.pmtiles`,
        minzoom: 0,
        maxzoom: 13,
        attribution: "<a href='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P29-2023.html' target='_blank'>国土数値情報 学校データ（2023年度）</a>"
      }
    },

    layers: [
      {
        id: "osm-basemap",
        type: "raster",
        source: "osm",
        paint: {
          "raster-opacity": 0.5
        }
      },
      {
        "id": "school-h3-fill",
        "type": "fill",
        "source": "school",
        "source-layer": "school_h3",
        "maxzoom": 15,

        "paint": {
          "fill-color": buildH3FillColor("school_count"),

          "fill-opacity": 0.5
        }
      },
      {
        "id": "school-point",
        "type": "circle",
        "source": "school",
        "source-layer": "school",
        "minzoom": 13,
        "paint": {
          "circle-radius": 6,
          "circle-color": [
            "match",
            ["get", "kind"],
            ...schoolKinds.flatMap(({ label, color }) => [label, color]),
            "#6b7280"
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13, 1.5,
            15, 1.5,
            17, 1.5
          ],
          "circle-stroke-opacity": 0.9
        }
      },
      {
        "id": "school-name-label",
        "type": "symbol",
        "source": "school",
        "source-layer": "school",
        "minzoom": 14,
        "layout": {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-radial-offset": 1.0,
          "text-variable-anchor": ["top", "left"],
          "text-optional": true,
          "text-justify": "auto",
        },
        "paint": {
          "text-color": "#1f2937",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5
        }
      },
      {
        "id": "school-h3-label",
        "type": "symbol",
        "source": "school",
        "source-layer": "school_h3_label",
        "minzoom": 4,
        "layout": {
          "text-field": ["to-string", ["get", "school_count"]],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4, 8,
            5, 6,
            8, 10,
            12, 12,
            15, 13
          ],
          "text-font": [
            "Noto Sans Regular"
          ],
          "text-allow-overlap": false,
          "text-ignore-placement": false
        },

        "paint": {
          "text-color": "#333333",
          "text-halo-color": "rgba(255,255,255,0.9)",
          "text-halo-width": 1.5
        }
      }
    ]
  },

  center: [138, 37],
  zoom: 5,
  hash: true
});

map.addControl(new NavigationControl(), "top-right");

const schoolFilterControl = {
  container: null,
  onAdd() {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl school-filter";

    const label = document.createElement("label");
    label.className = "school-filter__label";
    label.htmlFor = "school-kind-filter";
    label.textContent = "表示する学校";

    const select = document.createElement("select");
    select.id = "school-kind-filter";
    select.className = "school-filter__select";
    select.add(new Option("すべて", ""));
    for (const kind of schoolKinds.filter(({ label }) => label !== "その他")) {
      select.add(new Option(kind.filterLabel ?? kind.label, kind.label));
    }

    select.addEventListener("change", () => {
      const selectedKind = schoolKinds.find(({ label }) => label === select.value);
      const filter = selectedKind
        ? ["==", ["get", "kind"], selectedKind.label]
        : null;
      map.setFilter("school-point", filter);
      map.setFilter("school-name-label", filter);
      map.setPaintProperty(
        "school-h3-fill",
        "fill-color",
        buildH3FillColor(selectedKind?.countProperty ?? "school_count")
      );
      map.setLayoutProperty("school-h3-label", "text-field", [
        "to-string",
        ["get", selectedKind?.countProperty ?? "school_count"]
      ]);
    });

    container.append(label, select);
    this.container = container;
    return container;
  },
  onRemove() {
    this.container?.remove();
    this.container = null;
  }
};

map.addControl(schoolFilterControl, "top-left");

const schoolLegendControl = {
  container: null,
  onAdd() {
    const container = document.createElement("section");
    container.className = "maplibregl-ctrl school-legend";
    container.setAttribute("role", "group");
    container.setAttribute("aria-label", "学校種別の凡例");

    const title = document.createElement("h2");
    title.className = "school-legend__title";
    title.textContent = "学校種別";

    const list = document.createElement("ul");
    list.className = "school-legend__list";
    for (const kind of schoolKinds) {
      const item = document.createElement("li");
      item.className = "school-legend__item";

      const swatch = document.createElement("span");
      swatch.className = "school-legend__swatch";
      swatch.style.backgroundColor = kind.color;

      const label = document.createElement("span");
      label.textContent = kind.label;

      item.append(swatch, label);
      list.append(item);
    }

    container.append(title, list);
    this.container = container;
    return container;
  },
  onRemove() {
    this.container?.remove();
    this.container = null;
  }
};

map.addControl(schoolLegendControl, "bottom-right");
const attributionControl = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
if (attributionControl?.parentElement && schoolLegendControl.container) {
  attributionControl.parentElement.insertBefore(schoolLegendControl.container, attributionControl);
}

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const showFeatureProperties = (event) => {
  const properties = event.features?.[0]?.properties ?? {};
  const content = Object.entries(properties)
    .map(([key, value]) => `<strong>${escapeHtml(key)}</strong>: ${escapeHtml(value)}`)
    .join("<br>");

  new Popup()
    .setLngLat(event.lngLat)
    .setHTML(content || "プロパティなし")
    .addTo(map);
};

map.on("click", "school-point", showFeatureProperties);

map.on("mouseenter", "school-h3-fill", () => {
  map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "school-h3-fill", () => {
  map.getCanvas().style.cursor = "";
});

map.on("mouseenter", "school-point", () => {
  map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "school-point", () => {
  map.getCanvas().style.cursor = "";
});