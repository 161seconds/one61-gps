import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';

const origin = process.env.GPS_URL || 'http://localhost:5086';
const connections = [];
const request = (path, body) => fetch(`${origin}${path}`, {
  ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  signal: AbortSignal.timeout(5000)
});
async function viewer() {
  const connection = new HubConnectionBuilder().withUrl(`${origin}/hubs/tracking`, {
    transport: HttpTransportType.WebSockets, skipNegotiation: true
  }).configureLogging(LogLevel.None).build();
  connections.push(connection);
  await connection.start();
  return connection;
}
function receive(connection, event) {
  return new Promise((resolve, reject) => {
    const listener = value => { clearTimeout(timer); connection.off(event, listener); resolve(value); };
    const timer = setTimeout(() => { connection.off(event, listener); reject(new Error(`${event} timed out`)); }, 3000);
    connection.on(event, listener);
  });
}
async function publish(path, body, event) {
  const events = connections.map(connection => receive(connection, event));
  const response = await request(path, body);
  assert.equal(response.status, 200, `publish ${path}`);
  const result = await response.json();
  for (const received of await Promise.all(events)) assert.deepEqual(received, result, event);
  return result;
}

const app = readFileSync(new URL('../wwwroot/app.js', import.meta.url), 'utf8');
const iconMarkup = '<svg><use href="/icons.svg#sun"></use></svg>';
function frontend(saved = null, systemDark = true, savedLanguage = null) {
  const elements = new Map(), storage = new Map(saved ? [['gps-theme', saved]] : []);
  const clock = { now: 0 }, intervals = new Map(); let intervalId = 0;
  if (savedLanguage) storage.set('gps-language', savedLanguage);
  const document = {
    querySelectorAll(selector) {
      const nodes = [...elements.values(), ...Array.from(elements.values(), element => element.button)];
      if (selector === '[data-i18n]') return nodes.filter(element => Object.hasOwn(element.dataset, 'i18n'));
      return selector.startsWith('[data-i18n-') ? nodes.filter(element => Object.hasOwn(element, selector.slice(1, -1))) : [];
    },
    documentElement: { dataset: {} }, getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        value: id === 'demo-speed' ? '60' : '', dataset: {}, checked: id === 'follow-gps', disabled: id === 'recenter', innerHTML: iconMarkup,
        reportValidity() { const n = Number(this.value); return Number.isInteger(n) && n >= 1 && n <= 300; },
        set textContent(value) { this.text = value; this.innerHTML = ''; }, get textContent() { return this.text || ''; },
        button: { dataset: {}, innerHTML: iconMarkup, set textContent(value) { this.text = value; this.innerHTML = ''; }, setAttribute(name, value) { this[name] = value; }, getAttribute(name) { return this[name] ?? null; } },
        querySelector() { return this.button; }, addEventListener() { }, setAttribute(name, value) { this[name] = value; }, getAttribute(name) { return this[name] ?? null; }, classList: { toggle() { } }
      });
      return elements.get(id);
    }
  };
  for (const [id, message] of [['journey-title', 'Hành trình'], ['sharing', 'Chưa gửi vị trí.'], ['coordinates', 'Chưa có vị trí'], ['freshness', 'Chưa có GPS']]) {
    const element = document.getElementById(id); element.dataset.i18n = ''; element.textContent = message;
  }
  const link = document.getElementById('start-link'); link.setAttribute('data-i18n-placeholder', ''); link.setAttribute('placeholder', 'Link Google Maps');
  const layer = (points = []) => ({
    points, addTo() { return this; }, bindTooltip(value) { this.tooltip = value; return this; }, setTooltipContent(value) { this.tooltip = value; return this; },
    on(event, handler) { this[event] = handler; return this; }, setStyle(style) { this.style = style; return this; }, bringToFront() { this.front = true; return this; },
    getElement: () => null, setLatLng(value) { this.points = value; return this; }, setRadius() { return this; },
    setLatLngs(value) { this.points = value; return this; }, getLatLngs() { return this.points; }
  });
  const map = { on(event, handler) { this[event] = handler; return this; }, setView(points, zoom) { this.center = points; this.zoom = zoom; return this; }, panTo(points) { this.center = points; return this; }, getSize() { return { y: this.height || 400 }; }, fitBounds(points, options) { this.bounds = points; this.padding = options; return this; }, removeLayer(value) { value.removed = true; } };
  const hub = { state: 'Disconnected', start: () => new Promise(() => { }), on() { }, onreconnecting() { }, onreconnected() { }, onclose() { }, invoke: async () => ({ start: null, end: null, location: null, routeSequence: 0 }) };
  const context = createContext({
    document, history: { replaceState() { } }, location: { pathname: '/' },
    window: { matchMedia: () => ({ matches: systemDark }), addEventListener() { } },
    setInterval(callback) { intervals.set(++intervalId, callback); return intervalId; }, clearInterval: id => intervals.delete(id),
    performance: { now: () => clock.now }, navigator: { geolocation: { clearWatch() { }, watchPosition: () => 0 } },
    setTimeout: (callback, delay) => setTimeout(callback, delay === 1100 ? 0 : delay), clearTimeout, AbortController, URL,
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    L: { map: () => map, tileLayer: layer, polyline: layer, circleMarker: layer, circle: layer, marker: layer, divIcon: value => value,
      latLng: (lat, lng) => ({ lat, lng, distanceTo(other) { return Math.hypot(other.lat - lat, (other.lng - lng + 540) % 360 - 180) * 111195; } }) },
    signalR: { HubConnectionState: { Disconnected: 'Disconnected' }, HubConnectionBuilder: class { withUrl() { return this; } withAutomaticReconnect() { return this; } build() { return hub; } } }
  });
  runInContext(app, context);
  return { context, document, storage, hub, map, clock, intervals, theme: document.getElementById('theme') };
}
async function checkFrontend() {
  const ui = frontend();
  const changeLanguage = (view, value) => { const select = view.document.getElementById('language'); select.value = value; select.onchange(); };
  const localized = frontend(null, true, 'en');
  assert.equal(ui.document.documentElement.lang, 'vi', 'Vietnamese is the default');
  assert.equal(localized.document.documentElement.lang, 'en', 'saved language');
  assert.equal(localized.document.getElementById('journey-title').textContent, 'Journey');
  assert.equal(localized.document.getElementById('start-link').placeholder, 'Google Maps link');
  assert.equal(localized.theme.title, 'Light mode');
  runInContext("state('Mất kết nối'); setText('sharing', 'Đang gửi GPS từ điện thoại.'); error('Chỉ nhận link HTTPS Google Maps hợp lệ.'); watchId = 42; applyLocation({ latitude: 10, longitude: 106, accuracy: 5, sequence: 1, capturedAt: new Date().toISOString(), receivedAt: new Date().toISOString() });", localized.context);
  assert.equal(localized.document.getElementById('connection').textContent, 'Disconnected');
  assert.equal(localized.document.getElementById('error').textContent, 'Only valid HTTPS Google Maps links are accepted.');
  assert.match(localized.document.getElementById('received').textContent, /seconds ago/);
  assert.equal(runInContext('marker.tooltip', localized.context), 'Current GPS');
  const localizedCenter = JSON.stringify(localized.map.center), localizedTrail = runInContext('trail.getLatLngs().length', localized.context);
  changeLanguage(localized, 'vi');
  assert.equal(localized.document.getElementById('journey-title').textContent, 'Hành trình');
  assert.equal(localized.document.getElementById('start-link').placeholder, 'Link Google Maps');
  assert.equal(localized.document.getElementById('sharing').textContent, 'Đang gửi GPS từ điện thoại.');
  assert.equal(runInContext('marker.tooltip', localized.context), 'GPS hiện tại');
  assert.equal(runInContext('watchId', localized.context), 42, 'language does not stop GPS');
  assert.equal(runInContext('trail.getLatLngs().length', localized.context), localizedTrail, 'language preserves GPS trail');
  assert.equal(JSON.stringify(localized.map.center), localizedCenter, 'language preserves map center');
  changeLanguage(localized, 'en');
  assert.equal(localized.storage.get('gps-language'), 'en');
  assert.equal(frontend(null, true, localized.storage.get('gps-language')).document.documentElement.lang, 'en', 'language persists across reloads');
  changeLanguage(localized, 'fr');
  assert.equal(localized.document.documentElement.lang, 'en', 'unsupported selection is ignored');
  assert.equal(frontend(null, true, 'fr').document.documentElement.lang, 'vi', 'unsupported stored language falls back');
  localized.context.localStorage.setItem = () => { throw new Error('storage blocked'); };
  changeLanguage(localized, 'vi');
  assert.equal(localized.document.documentElement.lang, 'vi', 'language works with blocked storage');
  assert.equal(runInContext("language = 'en'; t('constructor')", localized.context), 'constructor', 'unknown messages do not read object prototypes');
  assert.equal(runInContext("t('{constructor}')", localized.context), '{constructor}', 'unknown placeholders remain intact');
  assert.equal(ui.document.documentElement.dataset.theme, 'dark', 'system theme');
  assert.equal(ui.theme['aria-pressed'], 'true');
  assert.equal(ui.theme.innerHTML, iconMarkup, 'initial theme keeps icon');
  assert.equal(ui.theme.title, 'Chế độ sáng');
  assert.equal(ui.theme['aria-label'], ui.theme.title);
  ui.theme.onclick();
  assert.equal(ui.document.documentElement.dataset.theme, 'light');
  assert.equal(ui.theme['aria-pressed'], 'false');
  assert.equal(ui.theme.innerHTML, iconMarkup, 'theme toggle keeps icon');
  assert.equal(ui.theme.title, 'Chế độ tối');
  assert.equal(ui.theme['aria-label'], ui.theme.title);
  assert.equal(ui.storage.get('gps-theme'), 'light');
  assert.equal(frontend(ui.storage.get('gps-theme')).document.documentElement.dataset.theme, 'light', 'restored theme');
  assert.equal(frontend(null, false).document.documentElement.dataset.theme, 'light', 'system light theme');
  for (const [height, bottom] of [[400, 144], [180, 48]]) {
    ui.map.height = height;
    runInContext('fitRoute([[10, 106], [11, 107]])', ui.context);
    assert.deepEqual(JSON.parse(JSON.stringify(ui.map.padding)), { paddingTopLeft: [24, 64], paddingBottomRight: [24, bottom], maxZoom: 16 }, 'route framing reserves overlays without exhausting short maps');
  }
  const point = { latitude: 10, longitude: 106, accuracy: 5, capturedAt: new Date().toISOString(), receivedAt: new Date().toISOString(), sequence: 1 };
  const recenter = ui.document.getElementById('recenter');
  assert.equal(recenter.disabled, true, 'recenter starts disabled without GPS');
  ui.document.getElementById('follow-gps').checked = false;
  const initialCenter = JSON.stringify(ui.map.center);
  recenter.onclick();
  assert.equal(JSON.stringify(ui.map.center), initialCenter, 'recenter without GPS leaves map unchanged');
  assert.equal(ui.document.getElementById('follow-gps').checked, false, 'recenter without GPS leaves follow unchanged');
  ui.document.getElementById('follow-gps').checked = true;
  ui.context.point = point;
  runInContext('applyLocation(point)', ui.context);
  assert.equal(recenter.disabled, false, 'GPS enables recenter');
  assert.deepEqual(Array.from(ui.map.center), [point.latitude, point.longitude], 'follow GPS centers first location');
  const follow = ui.document.getElementById('follow-gps');
  follow.checked = false; follow.onchange();
  runInContext('applyLocation({ ...point, latitude: 10.5, sequence: 2 })', ui.context);
  assert.deepEqual(Array.from(ui.map.center), [point.latitude, point.longitude], 'disabled follow preserves map center');
  follow.checked = true; follow.onchange();
  assert.deepEqual(Array.from(ui.map.center), [10.5, point.longitude], 'enabling follow centers latest GPS');
  runInContext('applyLocation({ ...point, latitude: 10.6, sequence: 3 })', ui.context);
  assert.deepEqual(Array.from(ui.map.center), [10.6, point.longitude], 'follow tracks later GPS');
  ui.map.dragstart();
  assert.equal(follow.checked, false, 'manual map drag disables GPS follow');
  runInContext('applyLocation({ ...point, latitude: 10.7, sequence: 4 })', ui.context);
  const zoom = ui.map.zoom;
  recenter.onclick();
  assert.deepEqual(Array.from(ui.map.center), [10.7, point.longitude], 'recenter uses latest GPS after dragging');
  assert.equal(follow.checked, true, 'recenter resumes follow');
  assert.equal(ui.map.zoom, zoom, 'recenter preserves zoom');
  runInContext('applyLocation({ ...point, latitude: 10.8, sequence: 5 })', ui.context);
  assert.deepEqual(Array.from(ui.map.center), [10.8, point.longitude], 'recenter follows later updates');
  const replacement = { ...point, latitude: 11 };
  ui.hub.invoke = async () => ({ start: null, end: null, location: replacement, routeSequence: 0 });
  await runInContext('sync()', ui.context);
  assert.equal(runInContext('marker.points[0]', ui.context), 11, 'equal sequence snapshot replaces old point');
  assert.equal(runInContext('trail.getLatLngs().length', ui.context), 1, 'snapshot resets trail');
  assert.equal(recenter.disabled, false, 'snapshot GPS keeps recenter enabled');
  ui.hub.invoke = async () => ({ start: null, end: null, location: null, routeSequence: 0 });
  await runInContext('sync()', ui.context);
  assert.equal(runInContext('latest === undefined && marker === undefined && circle === undefined && trail.getLatLngs().length === 0', ui.context), true, 'empty snapshot clears GPS');
  assert.equal(recenter.disabled, true, 'empty snapshot disables recenter');
  const newer = { ...point, latitude: 12, sequence: 2 };
  ui.context.newer = newer;
  ui.hub.invoke = async () => { runInContext("receive('location', newer)", ui.context); return { start: null, end: null, location: point, routeSequence: 0 }; };
  await runInContext('sync()', ui.context);
  assert.equal(runInContext('latest.sequence', ui.context), 2, 'buffered newer GPS survives snapshot');
  assert.equal(runInContext('marker.points[0]', ui.context), 12);
  const imported = frontend(), routes = [];
  const endpoints = [{ latitude: 10.7769, longitude: 106.7009 }, { latitude: 10.779, longitude: 106.705 }];
  imported.context.fetch = async (path, options) => {
    const body = JSON.parse(options.body);
    if (path === '/api/maps/resolve') return { ok: true, json: async () => endpoints[body.url.endsWith('start') ? 0 : 1] };
    assert.equal(path, '/api/route'); routes.push(body);
    return { ok: true, json: async () => ({ ...body, sequence: routes.length }) };
  };
  for (const endpoint of ['start', 'end']) {
    imported.document.getElementById(`${endpoint}-link`).value = `https://maps.app.goo.gl/${endpoint}`;
    await runInContext(`useMapLink('${endpoint}')`, imported.context);
    await new Promise(resolve => setImmediate(resolve));
    const button = imported.document.getElementById(`${endpoint}-link-form`).button;
    assert.equal(button.innerHTML, iconMarkup, 'successful import keeps icon');
    assert.equal(button['aria-busy'], 'false', 'successful import clears busy state');
  }
  assert.deepEqual(routes, [{ start: endpoints[0], end: endpoints[1] }], 'imported A/B autosave');
  assert.equal(runInContext('startMarker.points[0]', imported.context), endpoints[0].latitude);
  assert.equal(runInContext('endMarker.points[1]', imported.context), endpoints[1].longitude);
  assert.deepEqual(JSON.parse(JSON.stringify(imported.map.bounds)), endpoints.map(p => [p.latitude, p.longitude]), 'import frames both endpoints');
  const before = runInContext('JSON.stringify([startPoint, endPoint])', imported.context);
  imported.context.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: 'Invalid link' }) });
  await runInContext("useMapLink('start')", imported.context);
  assert.equal(imported.document.getElementById('start-link-form').button.innerHTML, iconMarkup, 'failed import keeps icon');
  assert.equal(imported.document.getElementById('start-link-form').button['aria-busy'], 'false', 'failed import clears busy state');
  assert.equal(runInContext('JSON.stringify([startPoint, endPoint])', imported.context), before, 'failed import preserves endpoints');
  assert.equal(routes.length, 1, 'failed import does not save route');
  let finishResolve;
  imported.context.fetch = () => new Promise(resolve => { finishResolve = resolve; });
  const resolving = runInContext("useMapLink('start')", imported.context);
  changeLanguage(imported, 'en');
  assert.equal(imported.document.getElementById('start-link-form').button.title, 'Reading link', 'pending import title follows language');
  assert.equal(imported.document.getElementById('start-link-form').button.innerHTML, iconMarkup, 'pending import keeps icon');
  assert.equal(imported.document.getElementById('start-link-form').button['aria-busy'], 'true', 'pending import exposes busy state');
  runInContext('startPoint = { latitude: 21, longitude: 105 }; drawRoute();', imported.context);
  finishResolve({ ok: true, json: async () => endpoints[0] });
  await resolving;
  assert.equal(imported.document.getElementById('start-link-form').button.title, 'Use link');
  assert.equal(runInContext('startPoint.latitude', imported.context), 21, 'late link does not overwrite newer point');
  assert.equal(imported.document.getElementById('start-link-form').button.disabled, false, 'resolve releases button');
  assert.equal(imported.document.getElementById('start-link-form').button.innerHTML, iconMarkup, 'late import keeps icon');
  assert.equal(imported.document.getElementById('start-link-form').button['aria-busy'], 'false', 'late import clears busy state');
  const directions = frontend(), requests = [], routing = directions.document.getElementById('routing');
  const road = () => JSON.parse(runInContext('JSON.stringify(roadRoute.getLatLngs())', directions.context));
  const flush = () => new Promise(resolve => setTimeout(resolve, 5));
  directions.context.fetch = (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }));
  const response = (coordinates = [[106.701, 10.777], [106.703, 10.778], [106.704, 10.779]]) => ({ ok: true, json: async () => ({ code: 'Ok', routes: [{ geometry: { type: 'LineString', coordinates }, distance: 1234 }] }) });
  runInContext('drawRoute()', directions.context);
  assert.equal(routing.disabled, true, 'routing needs both endpoints');
  directions.context.endpoints = endpoints;
  runInContext('[startPoint, endPoint] = endpoints; drawRoute()', directions.context);
  assert.equal(routing.disabled, false);
  assert.equal(requests.length, 0, 'routing defaults off');
  assert.deepEqual(road(), [], 'no straight endpoint line');
  routing.checked = true;
  routing.onchange(); await flush();
  assert.equal(requests.length, 1);
  const url = new URL(requests[0].url), query = JSON.parse(url.searchParams.get('json'));
  assert.equal(url.origin + url.pathname, 'https://valhalla1.openstreetmap.de/route');
  assert.deepEqual(query.locations, endpoints.map(point => ({ lat: point.latitude, lon: point.longitude, search_cutoff: 200 })));
  assert.equal(query.costing, 'auto');
  assert.deepEqual(query.costing_options.auto, { shortest: true });
  assert.equal(query.format, 'osrm');
  assert.equal(query.shape_format, 'geojson');
  assert.equal(query.alternates, 1, 'asks provider for one genuine alternative');
  runInContext('drawRoute()', directions.context);
  assert.equal(requests.length, 1, 'same endpoints do not duplicate requests');
  requests[0].resolve(response()); await flush();
  assert.deepEqual(road(), [[10.777, 106.701], [10.778, 106.703], [10.779, 106.704]], 'only provider geometry with coordinate order reversed');
  runInContext('drawRoute()', directions.context);
  assert.equal(requests.length, 1, 'completed route survives duplicate endpoint echo');
  const retry = directions.document.getElementById('directions-retry');
  retry.onclick(); await flush();
  assert.equal(requests.length, 2, 'retry fetches unchanged endpoints');
  assert.deepEqual(road(), [], 'retry clears old route');
  runInContext('endPoint = { latitude: 10.8, longitude: 106.8 }; drawRoute()', directions.context);
  await flush();
  assert.equal(requests[1].options.signal.aborted, true, 'endpoint edit aborts request');
  assert.equal(requests.length, 3);
  requests[1].resolve(response()); await flush();
  assert.deepEqual(road(), [], 'late old endpoint result cannot repaint');
  requests[2].resolve(response()); await flush();
  assert.equal(road().length, 3);
  retry.onclick(); await flush();
  routing.checked = false; routing.onchange();
  assert.equal(requests[3].options.signal.aborted, true, 'disabling routing aborts request');
  requests[3].resolve(response()); await flush();
  assert.deepEqual(road(), [], 'late result cannot repaint disabled routing');
  routing.checked = true; routing.onchange(); await flush();
  requests[4].resolve({ ok: false, status: 503 }); await flush();
  assert.deepEqual(road(), [], 'HTTP failure leaves no route');
  assert.equal(retry.hidden, false, 'HTTP failure offers retry');
  for (const result of [{ code: 'NoRoute', routes: [] }, { code: 'Ok', routes: [] },
  { code: 'Ok', routes: [{ geometry: { type: 'LineString', coordinates: [] }, distance: 0 }] },
  { code: 'Ok', routes: [{ geometry: { type: 'LineString', coordinates: [[106, 10], [181, 10]] }, distance: 10 }] },
  { code: 'Ok', routes: [{ geometry: { type: 'LineString', coordinates: [[106, 10], [107, 11]] }, distance: -1 }] }]) {
    retry.onclick(); await flush(); requests.at(-1).resolve({ ok: true, json: async () => result }); await flush();
    assert.deepEqual(road(), [], 'missing provider route leaves no geometry');
    assert.equal(retry.hidden, false, 'missing route offers retry');
  }
  retry.onclick(); await flush(); requests.at(-1).reject(new Error('network unavailable')); await flush();
  assert.deepEqual(road(), [], 'network failure leaves no route');
  assert.equal(retry.hidden, false, 'network failure offers retry');
  const alternate = () => JSON.parse(runInContext('JSON.stringify(alternativeRoute.getLatLngs())', directions.context));
  const shorter = { geometry: { type: 'LineString', coordinates: [[106.71, 10.77], [106.72, 10.78], [106.73, 10.79]] }, distance: 1000 };
  const longer = { geometry: { type: 'LineString', coordinates: [[106.74, 10.77], [106.75, 10.78], [106.76, 10.79]] }, distance: 1500 };
  const completeRoutes = async (routes, warnings = []) => {
    retry.onclick(); await flush();
    assert.deepEqual(road(), [], 'refresh clears primary');
    assert.deepEqual(alternate(), [], 'refresh clears alternative');
    requests.at(-1).resolve({ ok: true, json: async () => ({ code: 'Ok', routes, warnings }) }); await flush();
  };
  const crossBorder = { geometry: { type: 'LineString', coordinates: [[106.7009, 10.7769], [106.173, 11.081], [105.806, 11.267], [104.9282, 11.5564]] }, distance: 230000 };
  await completeRoutes([crossBorder], [{ code: 205 }]);
  assert.deepEqual(road(), crossBorder.geometry.coordinates.map(([lon, lat]) => [lat, lon]), 'long route retains provider geometry despite shortest-search warning');
  assert.equal(retry.hidden, true, 'warning does not reject valid long route');
  await completeRoutes([longer, shorter]);
  assert.deepEqual(road(), shorter.geometry.coordinates.map(([lon, lat]) => [lat, lon]), 'primary is shortest supplied route');
  assert.deepEqual(alternate(), longer.geometry.coordinates.map(([lon, lat]) => [lat, lon]), 'alternative uses genuine provider geometry');
  assert.equal(directions.document.getElementById('route-options').hidden, false);
  assert.equal(directions.document.getElementById('secondary-option').hidden, false);
  assert.equal(directions.document.getElementById('route-primary').checked, true);
  const requestCount = requests.length, routeBounds = JSON.stringify(directions.map.bounds);
  directions.document.getElementById('route-secondary').onchange();
  changeLanguage(directions, 'en');
  assert.equal(runInContext('selectedRoute', directions.context), 1, 'language preserves selected alternative');
  assert.equal(directions.document.getElementById('directions-status').textContent, '1.5 km · Route 2');
  assert.equal(directions.document.getElementById('secondary-distance').textContent, '1.5 km');
  assert.equal(requests.length, requestCount, 'language does not refetch routing');
  assert.equal(JSON.stringify(directions.map.bounds), routeBounds, 'language does not reframe route');
  changeLanguage(directions, 'vi');
  assert.equal(directions.document.getElementById('secondary-distance').textContent, '1,5 km');
  runInContext('selectRoadRoute(0)', directions.context);
  const primaryColor = runInContext('roadRoute.style.color', directions.context);
  const secondaryColor = runInContext('alternativeRoute.style.color', directions.context);
  assert.notEqual(primaryColor, secondaryColor, 'selected route visibly differs');
  directions.document.getElementById('route-secondary').onchange();
  assert.equal(runInContext('selectedRoute', directions.context), 1);
  assert.equal(runInContext('alternativeRoute.style.color', directions.context), primaryColor, 'radio highlights alternate');
  assert.equal(directions.document.getElementById('route-secondary').checked, true);
  runInContext('roadRoute.click()', directions.context);
  assert.equal(runInContext('selectedRoute', directions.context), 0, 'clicking route selects it');
  assert.equal(directions.document.getElementById('route-primary').checked, true);
  assert.equal(runInContext('roadRoute.style.color', directions.context), primaryColor);
  runInContext('selectRoadRoute(9)', directions.context);
  assert.equal(runInContext('selectedRoute', directions.context), 0, 'invalid selection ignored');
  await completeRoutes([shorter]);
  assert.deepEqual(alternate(), [], 'single route does not invent alternative');
  assert.equal(directions.document.getElementById('secondary-option').hidden, true);
  await completeRoutes([shorter, shorter]);
  assert.deepEqual(alternate(), [], 'duplicate geometry does not count as alternative');
  assert.equal(directions.document.getElementById('secondary-option').hidden, true);
  await completeRoutes([shorter, { ...longer, distance: -1 }]);
  assert.deepEqual(road(), [], 'invalid alternative rejects whole provider response');
  assert.deepEqual(alternate(), []);
  assert.equal(retry.hidden, false);
  directions.context.point = point;
  runInContext('applyLocation(point)', directions.context);
  const bounds = JSON.stringify(directions.map.bounds);
  await completeRoutes([shorter, longer]);
  assert.equal(JSON.stringify(directions.map.bounds), bounds, 'route response preserves fresh GPS follow');
  directions.document.getElementById('follow-gps').checked = false;
  await completeRoutes([longer, shorter]);
  assert.deepEqual(JSON.parse(JSON.stringify(directions.map.bounds)), [shorter, longer].flatMap(route => route.geometry.coordinates.map(([lon, lat]) => [lat, lon])), 'route frames both geometries with GPS follow disabled');
  retry.onclick(); await flush();
  requests.at(-1).resolve({ ok: true, json: async () => ({ code: 'DistanceExceeded', routes: [] }) }); await flush();
  assert.deepEqual(road(), [], 'provider distance limit clears primary');
  assert.deepEqual(alternate(), [], 'provider distance limit clears alternative');
  assert.equal(retry.hidden, false, 'provider distance limit offers retry');
}

async function checkDemo() {
  const ui = frontend(), sent = []; let fail = false;
  const run = source => runInContext(source, ui.context);
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));
  ui.context.testRoutes = [
    { geometry: { coordinates: [[0, 0], [0, 0], [.0001, 0], [.001, 0]] }, distance: 9999 },
    { geometry: { coordinates: [[0, 0], [0, .001]] }, distance: 111 }
  ];
  ui.context.fetch = async (path, options) => {
    assert.equal(path, '/api/location'); const point = JSON.parse(options.body); sent.push(point);
    return { ok: !fail, status: fail ? 503 : 200, json: async () => ({ ...point, receivedAt: new Date().toISOString(), sequence: sent.length }) };
  };
  assert.equal(ui.document.getElementById('demo-start').disabled, true, 'demo requires road geometry');
  run('syncing = false; roadRoutes = testRoutes; selectRoadRoute(0)');
  assert.ok(Math.abs(run('demoDistances.at(-1)') - 111.195) < .001, 'demo measures geometry, not provider summary');
  for (const value of ['', '0', '-1', '301', 'NaN', 'Infinity']) {
    ui.document.getElementById('demo-speed').value = value; run('startDemo()');
    assert.equal(run('demoTimer'), undefined, `invalid speed ${value}`);
  }
  ui.document.getElementById('demo-speed').value = '36';
  let cleared;
  ui.context.navigator.geolocation.clearWatch = id => { cleared = id; };
  run('watchId = 0; startDemo()'); await flush();
  assert.equal(cleared, 0, 'demo stops this device GPS');
  assert.equal(sent[0].longitude, 0, 'demo starts at route origin');
  assert.equal(ui.document.getElementById('demo-speed').disabled, true, 'pause before editing speed');
  ui.clock.now += 1000; await run('tickDemo()');
  assert.ok(Math.abs(sent.at(-1).longitude - 10 / 111195) < 1e-9, '36 km/h advances 10 metres per second');
  ui.document.getElementById('demo-pause').onclick();
  const count = sent.length;
  ui.clock.now += 20000; await run('tickDemo()');
  assert.equal(sent.length, count, 'pause stops publishing');
  ui.document.getElementById('demo-speed').value = '72'; run('startDemo()'); await flush();
  ui.clock.now += 1000; await run('tickDemo()');
  assert.ok(Math.abs(sent.at(-1).longitude - 30 / 111195) < 1e-9, 'resume uses new speed across uneven segments');
  const timer = run('demoTimer');
  ui.document.getElementById('language').value = 'en'; ui.document.getElementById('language').onchange();
  assert.equal(run('demoTimer'), timer, 'language switch preserves demo');
  assert.match(ui.document.getElementById('demo-status').textContent, /Car running/);
  fail = true; ui.clock.now += 10000; await run('tickDemo()');
  assert.equal(run('demoTimer'), timer, 'failed final upload retries');
  fail = false; ui.clock.now += 1000; await run('tickDemo()');
  assert.equal(run('demoTimer'), undefined, 'accepted endpoint stops demo');
  assert.ok(Math.abs(sent.at(-1).longitude - .001) < 1e-9, 'finish clamps to endpoint');
  assert.equal(ui.document.getElementById('demo-progress').value, 1);
  ui.document.getElementById('demo-reset').onclick(); await flush();
  assert.equal(sent.at(-1).longitude, 0, 'reset publishes origin');
  let resolveLate, pendingSignal;
  ui.context.fetch = (path, options) => { pendingSignal = options.signal; return new Promise(resolve => { resolveLate = resolve; }); };
  run('startDemo(); selectRoadRoute(1)');
  assert.equal(pendingSignal.aborted, true, 'switching route aborts demo upload');
  resolveLate({ ok: true, status: 200, json: async () => ({ latitude: 20, longitude: 20, sequence: 100 }) }); await flush();
  assert.equal(run('demoTimer'), undefined, 'route change stops demo');
  assert.equal(run('demoMetres'), 0, 'route change resets distance');
  assert.notEqual(run('latest?.latitude'), 20, 'late old-route response is ignored');
  run('resetDemo({ geometry: { coordinates: [[179.999, 0], [-179.999, 0]] } }); demoMetres = demoDistances.at(-1) / 2');
  assert.ok(Math.abs(Math.abs(run('demoPosition().longitude')) - 180) < 1e-9, 'dateline interpolation stays on route');
  run('resetDemo({ geometry: { coordinates: [[0, 0], [0, 0]] } }); startDemo()');
  assert.equal(ui.document.getElementById('demo-start').disabled, true, 'zero-length route cannot start');

  const live = frontend();
  live.context.route = ui.context.testRoutes[0];
  live.context.previous = (await (await request('/api/state')).json()).location;
  live.context.fetch = (path, options) => fetch(`${origin}${path}`, options);
  runInContext('syncing = false; latest = previous; resetDemo(route); demoSpeed = 36; demoTimer = setInterval(tickDemo, 1000)', live.context);
  for (const elapsed of [0, 1000]) {
    live.clock.now = elapsed;
    const events = connections.map(connection => receive(connection, 'LocationUpdated'));
    await runInContext('tickDemo()', live.context);
    const point = JSON.parse(runInContext('JSON.stringify(latest)', live.context));
    for (const received of await Promise.all(events)) assert.deepEqual(received, point, 'demo reaches both real SignalR viewers');
    assert.ok(Math.abs(point.longitude - elapsed / 1000 * 10 / 111195) < 1e-9, 'shared position follows configured speed');
  }
  runInContext('stop()', live.context);
}

try {
  await checkFrontend();
  for (const path of ['/api/health', '/', '/app.js', '/style.css', '/icons.svg', '/vendor/leaflet.js', '/vendor/signalr.min.js'])
    assert.equal((await request(path)).status, 200, path);
  for (const url of ['https://www.google.com/maps/place/Test/@1,2,17z/data=!3d10.7769!4d106.7009',
    'https://www.google.com/maps/place/Test/@1,2,17z/data=!3d10.7769!4d106.7009?entry=ttu',
    ...['q', 'query', 'll', 'center'].map(key => `https://www.google.com/maps?${key}=10.7769,106.7009`),
    'https://www.google.com/maps/@10.7769,106.7009,17z']) {
    const response = await request('/api/maps/resolve', { url });
    assert.equal(response.status, 200, url);
    assert.deepEqual(await response.json(), { latitude: 10.7769, longitude: 106.7009 });
  }
  for (const url of ['http://www.google.com/maps?q=1,2', 'https://example.com/maps?q=1,2',
    'https://www.google.com/maps?q=NaN,2', 'https://www.google.com/maps?q=91,2',
    'https://www.google.com/maps?q=1,181', 'https://www.google.com/maps/place/Test',
    'https://www.google.com/maps/place/Test/@1,2,17z', 'https://www.google.com/maps/dir/1,2/3,4',
    'https://user@www.google.com/maps?q=1,2', 'https://www.google.com:444/maps?q=1,2',
    'https://www.google.com/maps/search/?query=1,2&query_place_id=place-id'])
    assert.equal((await request('/api/maps/resolve', { url })).status, 400, url);
  const a = await viewer(), b = await viewer();
  const initial = await (await request('/api/state')).json();
  for (const connection of connections) assert.deepEqual(await connection.invoke('GetState'), initial);
  const route = { start: { latitude: 10.7769, longitude: 106.7009 }, end: { latitude: 10.779, longitude: 106.705 } };
  for (const invalid of [{}, { start: route.start }, { ...route, start: {} },
  { ...route, start: { latitude: 91, longitude: 0 } }, { ...route, end: { latitude: 0, longitude: -181 } },
  { ...route, end: { latitude: null, longitude: 0 } }])
    assert.equal((await request('/api/route', invalid)).status, 400, 'invalid route');
  const savedRoute = await publish('/api/route', route, 'RouteUpdated');
  assert.deepEqual(savedRoute, { ...route, sequence: initial.routeSequence + 1 });
  const captured = Math.max(Date.now(), initial.location ? Date.parse(initial.location.capturedAt) + 1 : 0);
  const point = { latitude: 10.777, longitude: 106.702, accuracy: 8, capturedAt: new Date(captured).toISOString() };
  for (const invalid of [{ latitude: 91 }, { longitude: -181 }, { latitude: null }, { accuracy: -1 },
  { accuracy: null }, { capturedAt: 'invalid' }, { capturedAt: new Date(Date.now() - 660000).toISOString() },
  { capturedAt: new Date(Date.now() + 60000).toISOString() }])
    assert.equal((await request('/api/location', { ...point, ...invalid })).status, 400, 'invalid GPS');
  for (const field of Object.keys(point)) {
    const missing = { ...point };
    delete missing[field];
    assert.equal((await request('/api/location', missing)).status, 400, `required ${field}`);
  }
  const first = await publish('/api/location', point, 'LocationUpdated');
  assert.deepEqual([first.latitude, first.longitude, first.accuracy], [point.latitude, point.longitude, point.accuracy]);
  assert.equal(Date.parse(first.capturedAt), Date.parse(point.capturedAt));
  assert.ok(Number.isFinite(Date.parse(first.receivedAt)));
  assert.equal(first.sequence, (initial.location?.sequence || 0) + 1);
  assert.equal((await request('/api/location', point)).status, 409, 'duplicate GPS');
  assert.equal((await request('/api/location', { ...point, capturedAt: new Date(captured - 1).toISOString() })).status, 409, 'older GPS');
  const changedRoute = await publish('/api/route', { ...route, end: route.start }, 'RouteUpdated');
  assert.equal(changedRoute.sequence, savedRoute.sequence + 1);
  assert.deepEqual((await (await request('/api/state')).json()).location, first, 'route preserves GPS');
  const next = await publish('/api/location', { ...point, latitude: 10.778, capturedAt: new Date(captured + 1).toISOString() }, 'LocationUpdated');
  assert.equal(next.sequence, first.sequence + 1);
  const expected = { start: changedRoute.start, end: changedRoute.end, location: next, routeSequence: changedRoute.sequence };
  assert.deepEqual(await (await request('/api/state')).json(), expected);
  for (const connection of [a, b]) assert.deepEqual(await connection.invoke('GetState'), expected);
  await a.stop();
  await a.start();
  assert.deepEqual(await a.invoke('GetState'), expected, 'reconnect snapshot');
  await checkDemo();
  console.log('PASS: shared demo car speed/pause/reset/finish, GPS recenter/follow, English/Vietnamese language, road routing geometry, long routes, cancellation/retry, Google Maps links, A/B import, theme, frontend reconnect, assets, route/GPS validation, two viewers.');
} finally {
  await Promise.all(connections.map(connection => connection.stop()));
}
