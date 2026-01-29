/**
 * Google Maps MCP App
 *
 * Displays a Google Map.
 * Receives initial location from the renderMap tool.
 */
import { App } from "@modelcontextprotocol/ext-apps";

// TypeScript declaration for Google Maps loaded from CDN
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let google: any;

// {"lat": 47, "lng": -122, "zoom": 10}
const API_KEY = "AIzaSyBoir8vOhIGQFii_zmPAhoNMHcwAz_BbfY";
/**
 * Dynamically load Google Maps JavaScript API
 */
async function loadGoogleMaps(): Promise<void> {
  if (typeof google !== "undefined" && google.maps) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=beta&libraries=maps,marker,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps API"));
    document.head.appendChild(script);
  });
}

const log = {
  info: console.log.bind(console, "[APP]"),
  warn: console.warn.bind(console, "[APP]"),
  error: console.error.bind(console, "[APP]"),
};

// Map instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resolveMap: (map: any) => void;
let map: Promise<any> = new Promise((resolve) => {
  resolveMap = resolve;
});

// Create App instance
const app = new App(
  { name: "Google Maps", version: "1.0.0" },
  { tools: { listChanged: true } },
  { autoResize: false },
);

function hideLoading(): void {
  const loadingEl = document.getElementById("loading");
  if (loadingEl) {
    loadingEl.style.display = "none";
  }
}

/**
 * Initialize Map
 */
async function initMap(): Promise<void> {
  log.info("Initializing map...");
  try {
    const mapEl = document.getElementById("map");
    if (!mapEl) throw new Error("Map container not found");

    const { Map } = await google.maps.importLibrary("maps");

    const mapInstance = new Map(mapEl, {
      center: { lat: 37.7749, lng: -122.4194 }, // Default to SF
      zoom: 12,
      mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
    });

    log.info("Map initialized");
    resolveMap(mapInstance);
    hideLoading();
  } catch (error) {
    log.error("Failed to initialize map:", error);
  }
}

// Handle tool input (renderMap)
app.ontoolinput = async (params) => {
  log.info("Received tool input:", params);
  const args = params.arguments as
    | {
        lat?: number;
        lng?: number;
        zoom?: number;
      }
    | undefined;

  if (!args) {
    return;
  }
  const mapInstance = await map;

  if (mapInstance) {
    if (typeof args.lat === "number" && typeof args.lng === "number") {
      log.info(`Panning to ${args.lat}, ${args.lng}`);
      mapInstance.setCenter({ lat: args.lat, lng: args.lng });
    }
    if (typeof args.zoom === "number") {
      log.info(`Setting zoom to ${args.zoom}`);
      mapInstance.setZoom(args.zoom);
    }
  }
};

app.connect().then(async () => {
  log.info("Connected to host");
  try {
    await loadGoogleMaps();
    await initMap();
  } catch (e) {
    log.error("Startup error:", e);
  }
});
