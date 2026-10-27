history.replaceState(null, '', location.pathname);
const $ = id => document.getElementById(id);
let language = 'vi';
try { const saved = localStorage.getItem('gps-language'); if (saved === 'en' || saved === 'vi') language = saved; } catch { }
const english = {
  'Điều phối hành trình': 'Journey planning', 'Ngôn ngữ': 'Language',
  'Điểm đến và GPS': 'Destinations and GPS', 'Hành trình': 'Journey',
  'Điểm đầu': 'Start', 'Điểm đến': 'Destination', 'Điểm cuối': 'Destination',
  'Chọn điểm đầu trên bản đồ': 'Pick start on map', 'Chọn điểm đến trên bản đồ': 'Pick destination on map',
  'Dùng link điểm đầu': 'Use start link', 'Dùng link điểm đến': 'Use destination link', 'Dùng link': 'Use link',
  'Link Google Maps': 'Google Maps link', 'Tọa độ điểm đầu': 'Start coordinates', 'Tọa độ điểm đến': 'Destination coordinates',
  'Chưa chọn': 'Not selected', 'Chưa có hai điểm.': 'Choose both endpoints.',
  'Tìm đường ô tô': 'Car routing', 'Thử tìm lại': 'Retry route', 'Chọn tuyến đường': 'Choose a route',
  'Tuyến 1': 'Route 1', 'Tuyến 2': 'Route 2', 'Vị trí trực tiếp': 'Live location',
  'Bật GPS': 'Start GPS', 'Dừng GPS': 'Stop GPS', 'Theo vị trí GPS': 'Follow GPS',
  'Chưa gửi vị trí.': 'Location sharing is off.', 'Kết nối lại': 'Reconnect',
  'Thông tin vị trí': 'Location details', 'Tọa độ hiện tại': 'Current coordinates',
  'Chưa có vị trí': 'No location yet', 'Độ chính xác': 'Accuracy', 'Cập nhật gần nhất': 'Last update',
  'Phiên dùng chung · Ai có link đều xem và gửi vị trí': 'Shared session · Anyone with the link can view and share locations',
  'Bản đồ hành trình': 'Journey map', 'Bản đồ điểm đầu, điểm đến và GPS hiện tại': 'Map of start, destination and current GPS',
  'Chưa có GPS': 'No GPS yet', 'Chú giải bản đồ': 'Map legend', 'Vị trí GPS': 'GPS location',
  'Tuyến đang chọn': 'Selected route', 'Tuyến còn lại': 'Other route',
  'Chế độ sáng': 'Light mode', 'Chế độ tối': 'Dark mode', 'GPS hiện tại': 'Current GPS',
  'Phóng to': 'Zoom in', 'Thu nhỏ': 'Zoom out', 'Về vị trí GPS hiện tại': 'Return to current GPS location',
  '{time} · {age} giây trước': '{time} · {age} seconds ago', '{time} · 1 giây trước': '{time} · 1 second ago',
  'GPS đã cũ': 'GPS out of date', 'GPS trực tiếp': 'Live GPS',
  '{distance} · Tuyến {route}{only}': '{distance} · Route {route}{only}',
  ' · Chỉ có một tuyến phù hợp': ' · Only one route available',
  'Chọn đủ điểm đầu và điểm cuối.': 'Choose both start and destination.',
  'Không tìm được tuyến ô tô. Chọn điểm gần đường hoặc thử lại.': 'No car route found. Choose points near a road or try again.',
  'Đang tìm đường ô tô…': 'Finding a car route…', 'Tìm đường quá lâu. Thử lại.': 'Routing timed out. Try again.',
  'Đã lưu hai điểm.': 'Endpoints saved.', 'Đã kết nối': 'Connected',
  'Đang kết nối': 'Connecting', 'Đang kết nối lại': 'Reconnecting', 'Mất kết nối': 'Disconnected',
  'Không tải được vị trí': 'Location unavailable', 'Kết nối thất bại': 'Connection failed',
  'Không tải được dữ liệu. Thử kết nối lại.': 'Could not load data. Try reconnecting.',
  'Không kết nối được máy chủ. Thử lại khi có mạng.': 'Could not connect to the server. Check your network and try again.',
  'Đã dừng gửi GPS.': 'GPS sharing stopped.',
  'Gửi GPS quá lâu. Vị trí tiếp theo sẽ thử lại.': 'GPS upload timed out. The next update will retry.',
  'Chưa gửi được GPS. Kiểm tra mạng hoặc máy chủ.': 'Could not share GPS. Check your network or server.',
  'GPS cần HTTPS (hoặc localhost) và trình duyệt hỗ trợ vị trí.': 'GPS requires HTTPS (or localhost) and a browser with location support.',
  'Đang chờ quyền vị trí / GPS…': 'Waiting for location permission / GPS…',
  'Đang gửi GPS từ điện thoại.': 'Sharing GPS from this device.',
  'Quyền vị trí bị từ chối. Cho phép trong cài đặt trình duyệt rồi bật lại GPS.': 'Location permission denied. Allow it in browser settings, then start GPS again.',
  'Không lấy được GPS. Kiểm tra dịch vụ vị trí và tín hiệu.': 'GPS unavailable. Check location services and signal.',
  'GPS hết thời gian chờ. Ra nơi thoáng rồi bật lại.': 'GPS timed out. Move to an open area and try again.',
  'Không lấy được vị trí.': 'Could not get your location.',
  'Không bật được GPS. Kiểm tra quyền vị trí.': 'Could not start GPS. Check location permission.',
  'Chạm bản đồ để chọn điểm đầu.': 'Click the map to choose the start.',
  'Chạm bản đồ để chọn điểm cuối.': 'Click the map to choose the destination.',
  'Đang lưu hai điểm…': 'Saving endpoints…', 'Hai điểm chưa được lưu.': 'Endpoints have not been saved.',
  'Chưa lưu được hai điểm. Chọn lại điểm để thử lại.': 'Could not save endpoints. Choose the points again to retry.',
  'Chọn thêm điểm còn lại.': 'Choose the other endpoint.', 'Đang đọc link': 'Reading link',
  'Không đọc được link Google Maps. Kiểm tra mạng hoặc chọn điểm trên bản đồ.': 'Could not read the Google Maps link. Check your network or pick a point on the map.',
  'Điểm đã thay đổi khi đọc link. Nhấn Dùng link lần nữa nếu muốn thay thế.': 'The point changed while reading the link. Use the link again to replace it.',
  'Đọc link quá lâu. Thử lại hoặc chọn điểm trên bản đồ.': 'Reading the link timed out. Try again or pick a point on the map.',
  'Chọn điểm trong phạm vi bản đồ thế giới.': 'Choose a point within the world map.',
  'Link Google Maps chuyển hướng quá nhiều lần.': 'The Google Maps link redirected too many times.',
  'Không mở được link Google Maps rút gọn. Hãy dán link đầy đủ có tọa độ.': 'Could not open the shortened Google Maps link. Paste a full link containing coordinates.',
  'Không kết nối được Google Maps. Hãy thử lại hoặc dán link đầy đủ.': 'Could not connect to Google Maps. Try again or paste the full link.',
  'Google Maps phản hồi quá lâu. Hãy thử lại hoặc dán link đầy đủ.': 'Google Maps timed out. Try again or paste the full link.',
  'Chỉ nhận link HTTPS Google Maps hợp lệ.': 'Only valid HTTPS Google Maps links are accepted.',
  'Tọa độ trong link Google Maps không hợp lệ.': 'The Google Maps link contains invalid coordinates.',
  'Link chưa có tọa độ rõ ràng. Trong Google Maps, chọn một điểm rồi sao chép link có tọa độ; hoặc chọn điểm trên bản đồ.': 'This link does not identify coordinates. Share a specific point from Google Maps or pick one on the map.'
};
function t(message, values = {}) {
  message = String(message);
  return (language === 'en' && Object.hasOwn(english, message) ? english[message] : message).replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? values[key] : match);
}
function setText(id, message, values = {}) {
  const element = $(id); element.dataset.i18n = message; element.i18nValues = values; element.textContent = t(message, values);
}
function formatDistance(metres) { return `${(metres / 1000).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', { maximumFractionDigits: 2 })} km`; }
function applyLanguage() {
  document.documentElement.lang = language; $('language').value = language;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    if (!element.dataset.i18n) element.dataset.i18n = element.textContent.trim();
    element.textContent = t(element.dataset.i18n, element.i18nValues);
  }
  for (const attribute of ['title', 'aria-label', 'placeholder']) for (const element of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
    const source = `data-i18n-${attribute}`, message = element.getAttribute(source) || element.getAttribute(attribute);
    element.setAttribute(source, message); element.setAttribute(attribute, t(message));
  }
  applyTheme();
  $('start-coordinates').value = coordinates(startPoint); $('end-coordinates').value = coordinates(endPoint);
  marker?.setTooltipContent(t('GPS hiện tại')); startMarker?.setTooltipContent(t('Điểm đầu')); endMarker?.setTooltipContent(t('Điểm cuối'));
  for (const [index, route] of roadRoutes.entries()) $(`${index === 0 ? 'primary' : 'secondary'}-distance`).textContent = formatDistance(route.distance);
  if (roadRoutes.length) selectRoadRoute(selectedRoute);
  for (const button of document.querySelectorAll('.leaflet-control-zoom a')) {
    button.title = t(button.classList.contains('leaflet-control-zoom-in') ? 'Phóng to' : 'Thu nhỏ'); button.setAttribute('aria-label', button.title);
  }
  updateAge();
}
let dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
try { const saved = localStorage.getItem('gps-theme'); if (saved) dark = saved === 'dark'; } catch { }
function applyTheme() {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('theme').title = t(dark ? 'Chế độ sáng' : 'Chế độ tối'); $('theme').setAttribute('aria-label', $('theme').title); $('theme').setAttribute('aria-pressed', String(dark));
}
$('theme').onclick = () => { dark = !dark; applyTheme(); try { localStorage.setItem('gps-theme', dark ? 'dark' : 'light'); } catch { } };
applyTheme();
const map = L.map('map').setView([10.7769, 106.7009], 13);
map.zoomControl?.setPosition('bottomright');
function fitRoute(points) { map.fitBounds(points, { paddingTopLeft: [24, 64], paddingBottomRight: [24, map.getSize().y < 240 ? 48 : 144], maxZoom: 16 }); }
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Routing: <a href="https://valhalla.github.io/valhalla/">Valhalla</a> / <a href="https://www.fossgis.de/">FOSSGIS</a>', maxZoom: 19 }).addTo(map);
const trail = L.polyline([], { color: '#17695e', weight: 3 }).addTo(map);
const roadRoute = L.polyline([], { color: '#c53c65', weight: 5, opacity: .9 }).addTo(map);
const alternativeRoute = L.polyline([], { color: '#718da0', weight: 4, opacity: .65 }).addTo(map);
const connection = new signalR.HubConnectionBuilder().withUrl('/hubs/tracking').withAutomaticReconnect().build();
let latest, marker, circle, startMarker, endMarker, startPoint, endPoint, selecting;
let routeSequence = -1, watchId, generation = 0, activeRequest, lastGpsSent = 0;
let connecting = false, syncing = true, buffered = [], routeSaving = false, routePending, deferredRoute;
let directionsRequest, directionsKey, roadRoutes = [], selectedRoute = 0;
function error(message = '') { setText('error', message); $('error').hidden = !message; }
function state(message, live = false) { setText('connection', message); $('connection').classList.toggle('live', live); }
function coordinates(point) { return point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : t('Chưa chọn'); }
function updateAge() {
  if (!latest) return;
  const age = Math.max(0, Math.floor((Date.now() - Date.parse(latest.receivedAt)) / 1000));
  const stale = age > 15 || Date.now() - Date.parse(latest.capturedAt) > 15000;
  setText('received', age === 1 ? '{time} · 1 giây trước' : '{time} · {age} giây trước', { time: new Date(latest.receivedAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN'), age });
  setText('freshness', stale ? 'GPS đã cũ' : 'GPS trực tiếp'); $('freshness').className = `badge ${stale ? 'stale' : 'live'}`;
}
function applyLocation(point) {
  if (!point || (latest && point.sequence <= latest.sequence)) return;
  latest = point; $('recenter').disabled = false; const latlng = [point.latitude, point.longitude];
  if (!marker) {
    marker = L.circleMarker(latlng, { radius: 8, color: '#fff', weight: 3, fillColor: '#2586c7', fillOpacity: 1 }).addTo(map).bindTooltip(t('GPS hiện tại'));
    circle = L.circle(latlng, { radius: point.accuracy, color: '#2586c7', weight: 1, fillOpacity: .1 }).addTo(map);
    if ($('follow-gps').checked) map.setView(latlng, 16);
  } else {
    marker.setLatLng(latlng); circle.setLatLng(latlng).setRadius(point.accuracy);
    if ($('follow-gps').checked) map.panTo(latlng, { animate: true });
  }
  // shortcut: only 200 samples stay in this tab; persist history when longer tracking is needed.
  trail.setLatLngs([...trail.getLatLngs(), L.latLng(...latlng)].slice(-200));
  setText('coordinates', '{coordinates}', { coordinates: coordinates(point) }); $('accuracy').textContent = `± ${point.accuracy.toFixed(1)} m`; updateAge();
}
function drawRoute() {
  for (const endpoint of ['start', 'end']) {
    const point = endpoint === 'start' ? startPoint : endPoint; let pin = endpoint === 'start' ? startMarker : endMarker;
    if (point) {
      const latlng = [point.latitude, point.longitude];
      if (pin) pin.setLatLng(latlng);
      else pin = L.marker(latlng, { icon: L.divIcon({ className: `endpoint-marker ${endpoint}`, html: `<span>${endpoint === 'start' ? 'A' : 'B'}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(map).bindTooltip(t(endpoint === 'start' ? 'Điểm đầu' : 'Điểm cuối'));
    } else if (pin) { map.removeLayer(pin); pin = undefined; }
    if (endpoint === 'start') startMarker = pin; else endMarker = pin;
    $(`${endpoint}-coordinates`).value = coordinates(point);
  }
  findDirections();
}
function selectRoadRoute(index) {
  if (!Number.isInteger(index) || index < 0 || index >= roadRoutes.length) return;
  selectedRoute = index;
  for (const [i, layer] of [roadRoute, alternativeRoute].entries()) {
    const selected = i === index;
    layer.setStyle({ color: selected ? '#c53c65' : '#718da0', weight: selected ? 6 : 4, opacity: selected ? .95 : .65 });
    $(`route-${i === 0 ? 'primary' : 'secondary'}`).checked = selected;
  }
  [roadRoute, alternativeRoute][index].bringToFront();
  marker?.bringToFront();
  setText('directions-status', '{distance} · Tuyến {route}{only}', { distance: formatDistance(roadRoutes[index].distance), route: index + 1, only: roadRoutes.length === 1 ? t(' · Chỉ có một tuyến phù hợp') : '' });
}
async function findDirections(force = false) {
  const enabled = $('routing').checked, key = JSON.stringify([enabled, startPoint, endPoint]);
  $('routing').disabled = !startPoint || !endPoint;
  if (!force && key === directionsKey) return;
  directionsKey = key; directionsRequest?.abort(); directionsRequest = undefined;
  roadRoutes = []; roadRoute.setLatLngs([]); alternativeRoute.setLatLngs([]); $('route-options').hidden = true;
  $('directions-retry').hidden = true; $('directions-status').hidden = !enabled;
  if (!enabled) return;
  if (!startPoint || !endPoint) { setText('directions-status', 'Chọn đủ điểm đầu và điểm cuối.'); return; }
  const request = new AbortController(); directionsRequest = request;
  let timeout, message = 'Không tìm được tuyến ô tô. Chọn điểm gần đường hoặc thử lại.';
  setText('directions-status', 'Đang tìm đường ô tô…');
  try {
    // FOSSGIS allows one request per second; debounce endpoint edits and shared updates.
    await new Promise(resolve => setTimeout(resolve, 1100));
    if (directionsRequest !== request) return;
    timeout = setTimeout(() => request.abort(), 15000);
    const query = {
      locations: [startPoint, endPoint].map(point => ({ lat: point.latitude, lon: point.longitude, search_cutoff: 200 })),
      costing: 'auto', costing_options: { auto: { shortest: true } },
      format: 'osrm', shape_format: 'geojson', alternates: 1
    };
    // shortcut: hierarchical search prioritizes distance without guaranteeing the global minimum; self-host for exact shortest routes.
    const response = await fetch(`https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify(query))}`, { signal: request.signal });
    const result = await response.json();
    if (directionsRequest !== request) return;
    const routes = Array.isArray(result.routes) ? result.routes.slice(0, 2) : [];
    if (!response.ok || result.code !== 'Ok' || !routes.length || !routes.every(route => {
      const points = route?.geometry?.coordinates;
      return route?.geometry?.type === 'LineString' && Array.isArray(points) && points.length >= 2 &&
        Number.isFinite(route.distance) && route.distance >= 0 &&
        points.every(point => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Math.abs(point[0]) <= 180 && Number.isFinite(point[1]) && Math.abs(point[1]) <= 90);
    }))
      throw new Error('Invalid road route');
    routes.sort((a, b) => a.distance - b.distance);
    if (routes.length === 2 && JSON.stringify(routes[0].geometry.coordinates) === JSON.stringify(routes[1].geometry.coordinates)) routes.pop();
    roadRoutes = routes;
    for (const [index, route] of routes.entries()) {
      [roadRoute, alternativeRoute][index].setLatLngs(route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]));
      $(`${index === 0 ? 'primary' : 'secondary'}-distance`).textContent = formatDistance(route.distance);
    }
    $('route-options').hidden = false; $('secondary-option').hidden = routes.length < 2;
    selectRoadRoute(0);
    if (!$('follow-gps').checked || !latest || Date.now() - Date.parse(latest.receivedAt) > 15000)
      fitRoute(routes.flatMap(route => route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude])));
  } catch {
    if (directionsRequest !== request) return;
    setText('directions-status', request.signal.aborted ? 'Tìm đường quá lâu. Thử lại.' : message);
    $('directions-retry').hidden = false;
  } finally { clearTimeout(timeout); if (directionsRequest === request) directionsRequest = undefined; }
}
function applyRoute(route) {
  if (routeSaving || routePending) { if (!deferredRoute || route.sequence > deferredRoute.sequence) deferredRoute = route; return; }
  if (route.sequence <= routeSequence) return; routeSequence = route.sequence;
  startPoint = route.start; endPoint = route.end; drawRoute(); setText('route-status', startPoint && endPoint ? 'Đã lưu hai điểm.' : 'Chưa có hai điểm.');
}
function receive(type, value) { if (syncing) buffered.push({ type, value }); else if (type === 'location') applyLocation(value); else applyRoute(value); }
connection.on('LocationUpdated', point => receive('location', point)); connection.on('RouteUpdated', route => receive('route', route));
async function sync() {
  syncing = true;
  try {
    const snapshot = await connection.invoke('GetState');
    latest = undefined; $('recenter').disabled = true; if (marker) map.removeLayer(marker); if (circle) map.removeLayer(circle); marker = circle = undefined; trail.setLatLngs([]);
    setText('coordinates', 'Chưa có vị trí'); $('accuracy').textContent = '—'; setText('received', '—'); setText('freshness', 'Chưa có GPS'); $('freshness').className = 'badge';
    routeSequence = -1; applyRoute({ start: snapshot.start, end: snapshot.end, sequence: snapshot.routeSequence }); applyLocation(snapshot.location);
    for (const event of buffered.sort((a, b) => a.value.sequence - b.value.sequence)) { if (event.type === 'location') applyLocation(event.value); else applyRoute(event.value); }
  } finally { syncing = false; buffered = []; }
}
async function connected() { await sync(); state('Đã kết nối', true); error(); $('retry').hidden = true; }
connection.onreconnecting(() => { syncing = true; buffered = []; state('Đang kết nối lại'); });
connection.onreconnected(() => connected().catch(() => { state('Không tải được vị trí'); error('Không tải được dữ liệu. Thử kết nối lại.'); $('retry').hidden = false; }));
connection.onclose(() => { state('Mất kết nối'); $('retry').hidden = false; });
async function connect() {
  if (connecting) return; connecting = true; syncing = true; buffered = []; $('retry').hidden = true; state('Đang kết nối');
  try { if (connection.state === signalR.HubConnectionState.Disconnected) await connection.start(); await connected(); }
  catch { syncing = false; state('Kết nối thất bại'); error('Không kết nối được máy chủ. Thử lại khi có mạng.'); $('retry').hidden = false; }
  finally { connecting = false; }
}
function stop() {
  generation++; activeRequest?.abort(); activeRequest = undefined; lastGpsSent = 0;
  if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
  watchId = undefined; $('gps').disabled = false; $('stop').disabled = true; setText('sharing', 'Đã dừng gửi GPS.');
}
async function publish(point, current) {
  if (current !== generation || activeRequest) return;
  const request = new AbortController(); activeRequest = request; const timeout = setTimeout(() => request.abort(), 10000);
  try {
    const response = await fetch('/api/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(point), signal: request.signal });
    if (current !== generation || response.status === 409) return;
    if (!response.ok) throw new Error();
    const result = await response.json(); if (current !== generation) return;
    receive('location', result); error();
  } catch (failure) { if (current === generation) error(failure.name === 'AbortError' ? 'Gửi GPS quá lâu. Vị trí tiếp theo sẽ thử lại.' : 'Chưa gửi được GPS. Kiểm tra mạng hoặc máy chủ.'); }
  finally { clearTimeout(timeout); if (activeRequest === request) activeRequest = undefined; }
}
function startGps() {
  if (!window.isSecureContext || !navigator.geolocation) { error('GPS cần HTTPS (hoặc localhost) và trình duyệt hỗ trợ vị trí.'); return; }
  stop(); error(); const current = generation; $('gps').disabled = true; $('stop').disabled = false; setText('sharing', 'Đang chờ quyền vị trí / GPS…');
  try {
    watchId = navigator.geolocation.watchPosition(position => {
      if (current !== generation || activeRequest || Date.now() - lastGpsSent < 1000) return;
      lastGpsSent = Date.now(); setText('sharing', 'Đang gửi GPS từ điện thoại.');
      publish({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, capturedAt: new Date(position.timestamp).toISOString() }, current);
    }, failure => {
      if (current !== generation) return;
      const messages = { 1: 'Quyền vị trí bị từ chối. Cho phép trong cài đặt trình duyệt rồi bật lại GPS.', 2: 'Không lấy được GPS. Kiểm tra dịch vụ vị trí và tín hiệu.', 3: 'GPS hết thời gian chờ. Ra nơi thoáng rồi bật lại.' };
      stop(); error(messages[failure.code] || 'Không lấy được vị trí.');
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  } catch { stop(); error('Không bật được GPS. Kiểm tra quyền vị trí.'); }
}
function choose(endpoint) {
  selecting = endpoint; $('choose-start').setAttribute('aria-pressed', String(endpoint === 'start')); $('choose-end').setAttribute('aria-pressed', String(endpoint === 'end'));
  setText('route-status', endpoint === 'start' ? 'Chạm bản đồ để chọn điểm đầu.' : 'Chạm bản đồ để chọn điểm cuối.');
}
async function saveRoute() {
  if (routeSaving) return; routeSaving = true;
  try {
    while (routePending) {
      const route = routePending; routePending = undefined; setText('route-status', 'Đang lưu hai điểm…');
      const request = new AbortController(); const timeout = setTimeout(() => request.abort(), 10000);
      try {
        const response = await fetch('/api/route', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(route), signal: request.signal });
        if (!response.ok) throw new Error();
        applyRoute(await response.json()); setText('route-status', 'Đã lưu hai điểm.'); error();
      } finally { clearTimeout(timeout); }
    }
  } catch { error('Chưa lưu được hai điểm. Chọn lại điểm để thử lại.'); setText('route-status', 'Hai điểm chưa được lưu.'); }
  finally { routeSaving = false; if (deferredRoute) { const route = deferredRoute; deferredRoute = undefined; applyRoute(route); } if (routePending) saveRoute(); }
}
function setEndpoint(endpoint, point) {
  if (endpoint === 'start') startPoint = point; else endPoint = point;
  selecting = undefined; $('choose-start').setAttribute('aria-pressed', 'false'); $('choose-end').setAttribute('aria-pressed', 'false'); drawRoute();
  error();
  if (startPoint && endPoint) { routePending = { start: startPoint, end: endPoint }; saveRoute(); } else setText('route-status', 'Chọn thêm điểm còn lại.');
}
async function useMapLink(endpoint) {
  const input = $(`${endpoint}-link`), button = $(`${endpoint}-link-form`).querySelector('button');
  if (button.disabled) return;
  const previous = JSON.stringify(endpoint === 'start' ? startPoint : endPoint);
  let message = 'Không đọc được link Google Maps. Kiểm tra mạng hoặc chọn điểm trên bản đồ.';
  button.disabled = input.disabled = true; button.setAttribute('aria-busy', 'true'); button.setAttribute('data-i18n-title', 'Đang đọc link'); button.title = t('Đang đọc link'); error();
  const request = new AbortController(), timeout = setTimeout(() => request.abort(), 12000);
  try {
    const response = await fetch('/api/maps/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: input.value.trim() }), signal: request.signal });
    const point = await response.json();
    if (!response.ok) { message = point.error || message; throw new Error(); }
    if (JSON.stringify(endpoint === 'start' ? startPoint : endPoint) !== previous) { error('Điểm đã thay đổi khi đọc link. Nhấn Dùng link lần nữa nếu muốn thay thế.'); return; }
    setEndpoint(endpoint, point);
    fitRoute([startPoint || point, endPoint || point].map(p => [p.latitude, p.longitude]));
  } catch { error(request.signal.aborted ? 'Đọc link quá lâu. Thử lại hoặc chọn điểm trên bản đồ.' : message); }
  finally { clearTimeout(timeout); button.disabled = input.disabled = false; button.setAttribute('aria-busy', 'false'); button.setAttribute('data-i18n-title', 'Dùng link'); button.title = t('Dùng link'); }
}
map.on('click', event => {
  if (!selecting) return;
  const point = { latitude: event.latlng.lat, longitude: event.latlng.lng };
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180) { error('Chọn điểm trong phạm vi bản đồ thế giới.'); return; }
  setEndpoint(selecting, point);
});
for (const endpoint of ['start', 'end']) $(`${endpoint}-link-form`).onsubmit = event => { event.preventDefault(); useMapLink(endpoint); };
$('choose-start').onclick = () => choose('start'); $('choose-end').onclick = () => choose('end'); $('gps').onclick = startGps; $('stop').onclick = stop; $('retry').onclick = connect;
$('routing').onchange = () => findDirections(); $('directions-retry').onclick = () => findDirections(true);
$('route-primary').onchange = () => selectRoadRoute(0); $('route-secondary').onchange = () => selectRoadRoute(1);
roadRoute.on('click', () => selectRoadRoute(0)); alternativeRoute.on('click', () => selectRoadRoute(1));
$('follow-gps').onchange = () => { if ($('follow-gps').checked && latest) map.panTo([latest.latitude, latest.longitude], { animate: true }); };
$('recenter').onclick = () => { if (!latest) return; $('follow-gps').checked = true; $('follow-gps').onchange(); };
map.on('dragstart', () => { $('follow-gps').checked = false; });
$('language').onchange = () => {
  const value = $('language').value; if (value !== 'en' && value !== 'vi') return;
  language = value; applyLanguage(); try { localStorage.setItem('gps-language', language); } catch { }
};
applyLanguage(); setInterval(updateAge, 1000); window.addEventListener('pagehide', stop); connect();
