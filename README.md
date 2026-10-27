# GPS Realtime

A shared map for choosing start and destination points, finding real road routes, and following live GPS updates across devices. Built with .NET 8, SignalR, Leaflet, and plain JavaScript.

## Run Locally

Requirements: .NET 8 SDK and Node.js 22.

```powershell
npm ci
dotnet run --project GpsDemo.csproj
```

Open `http://localhost:5085`. `npm ci` copies the browser dependencies into `wwwroot/vendor`.

## Use the Map

1. Choose **English** or **Tiếng Việt** from the header menu. Vietnamese is the default; the choice is saved on this browser.
2. Use the crosshair buttons to pick the start and destination on the map. Both endpoints synchronize with other connected devices.
3. Enable **Car routing** to find road routes. Choose **Route 1 / Route 2**, or click a route on the map. The selected route is pink; the other route is blue-gray.
4. Open the same URL on your phone and computer. On your phone, select **Start GPS** and allow location access.
5. Move to see GPS updates on both devices. Use **Stop GPS** to stop sharing.

The interface language changes immediately without restarting GPS or clearing the route. Street and place names remain as provided by OpenStreetMap.

### Google Maps Links

Paste a link into either endpoint field and use its arrow button. Supported links include coordinates in place URLs, `q` / `query` / `ll` / `center` parameters, and shortened `maps.app.goo.gl` or `goo.gl/maps` links. Imported points are fitted into the map view.

Links containing only a place name or ID, or multi-stop directions, are not supported. Share a specific point with coordinates instead, or choose it directly on the map.

### Routing and GPS

Valhalla prioritizes distance on the OpenStreetMap road network, respecting mapped one-way streets and car restrictions. It returns up to two routes, ordered by distance. Long and cross-border routes work where connected roads exist; the absolute shortest route is not guaranteed.

Routing snaps endpoints to nearby roads within 200 m. It does not draw invented connectors or substitute straight lines when routing fails. Some journeys have only one valid route; no alternative is fabricated. Changing an endpoint recalculates the route. Routing mode and route selection are local to each tab.

**Follow GPS** is enabled by default. Disable it or drag the map to explore; the crosshair button beside the zoom controls returns to the latest shared GPS location and resumes following without changing the zoom. It is disabled until a location is available. A completed route request does not interrupt fresh GPS following. GPS positions are not snapped to the selected route, and leaving the route does not trigger automatic rerouting.

The theme button switches between light and dark mode, including the map. The first visit follows the system theme; later visits use the saved choice. Dark map tiles use a CSS color filter, leaving routes and GPS markers unchanged.

## Phone Access

GPS requires HTTPS, except on `localhost`. Plain HTTP over a LAN IP is not sufficient. With Cloudflare's `cloudflared` executable available at `artifacts/cloudflared.exe`, run:

```powershell
./artifacts/cloudflared.exe tunnel --no-autoupdate --url http://localhost:5085 --protocol http2
```

Open the generated HTTPS URL on both devices. Keep the server, tunnel, and GPS page running. Browsers may pause location updates when the page is backgrounded or the screen is locked. A temporary tunnel is not a hosted deployment; its URL may change.

## Checks

The checks write endpoint and GPS data. Run a separate test server to avoid overwriting an active shared session:

```powershell
dotnet run --project GpsDemo.csproj -- --urls http://localhost:5086
```

In another terminal:

```powershell
$env:GPS_URL = 'http://localhost:5086'
npm run check
```

Checks cover frontend language/theme preferences, route geometry and alternatives using mocked provider responses, cancellation/retry, GPS following, Google Maps imports, input validation, reconnect snapshots, and broadcasts to two real SignalR clients. They do not validate physical GPS or live routing-provider availability.

## Privacy and Limits

- One shared session, without accounts, tokens, trips, or expiration. Anyone with the URL can view and publish locations. Enable GPS on only one device during a test.
- Endpoints and the latest GPS location are stored in memory. Restarting the server clears them. Each tab keeps at most 200 GPS trail samples; there is no persistent history.
- [FOSSGIS public routing](https://www.fossgis.de/arbeitsgruppen/osm-server/nutzungsbedingungen/) receives both endpoint coordinates. Requests are debounced to at most one per second per tab; the service has no uptime guarantee and map data may be incomplete or outdated.
- `shortest: true` uses hierarchical search for long routes. Warning `205` does not reject an otherwise valid route; actual errors, including provider distance limits, still fail. Use a suitably configured self-hosted Valhalla instance for high traffic or exhaustive shortest-path searches.
- These are car routes, not freight clearance. Truck dimensions, weight, transport permissions, border procedures, and mandatory checkpoints are not checked. The demo has only A/B; the main project must supply required crossings as waypoints and validate shipping constraints separately.
- No GPS simulation, address search, turn-by-turn navigation, or Pegaxus business workflows.
- OpenStreetMap attribution and `strict-origin-when-cross-origin` are retained. Tiles are not proxied or bulk-downloaded. A Cloudflare tunnel passes traffic through Cloudflare and does not replace production authentication or storage.
