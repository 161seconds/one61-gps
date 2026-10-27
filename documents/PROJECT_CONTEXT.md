# Context dự án GPS Realtime

Cập nhật: **27/10/2026**. Tài liệu mô tả mã nguồn hiện tại trong `D:\my-project\gps`; không xác nhận tình trạng server, tunnel hoặc dịch vụ bên ngoài đang chạy.

## 1. Mục đích và phạm vi

GPS Realtime là sandbox kiểm chứng việc chọn hai điểm A/B, tìm đường ô tô thực tế và chia sẻ vị trí GPS giữa các thiết bị cùng mở một URL. Tên package là `pegaxus-gps-sandbox`, nhưng repository này chưa triển khai nghiệp vụ Pegaxus.

Ứng dụng dùng **một phiên chung cho toàn bộ người truy cập**. Không có tài khoản, token, chuyến đi riêng, phân quyền hay cơ sở dữ liệu. Phạm vi hiện tại phục vụ thử nghiệm; không coi đây là hệ thống theo dõi vận tải đã sẵn sàng vận hành thực tế.

## 2. Công nghệ và cách tổ chức

| Thành phần | Công nghệ / vai trò |
| --- | --- |
| Web server và API | ASP.NET Core Minimal API, .NET 8, `net8.0` |
| Đồng bộ trực tiếp | ASP.NET Core SignalR; browser client `@microsoft/signalr` phiên bản `8.0.29` |
| Frontend | HTML, CSS, JavaScript thuần; không có React, Vite hay bước bundle |
| Bản đồ | Leaflet `1.9.4`, tile OpenStreetMap |
| Tìm đường | Trình duyệt gọi trực tiếp Valhalla công cộng do FOSSGIS cung cấp |
| Dữ liệu | Singleton `GpsTracker` lưu trong RAM, dùng `lock` khi đọc/ghi trạng thái |
| Công cụ Node.js | Cài/copy thư viện frontend, chạy kiểm tra; README yêu cầu Node.js 22 |

**ASP.NET Core phục vụ cả frontend trong `wwwroot` và API trên cùng origin.** Không cần chạy thêm một frontend server. Backend không có NuGet dependency khai báo riêng ngoài shared framework của .NET.

### Bản đồ mã nguồn

| File | Trách nhiệm |
| --- | --- |
| [Program.cs](../Program.cs) | Port mặc định, HTTP headers, giới hạn request, DI, static files, API, `TrackingHub` |
| [GpsTracker.cs](../GpsTracker.cs) | Trạng thái dùng chung, validation, sequence, broadcast và các record dữ liệu |
| [GoogleMapsLink.cs](../GoogleMapsLink.cs) | Kiểm tra URL Google Maps, mở short link, trích xuất tọa độ |
| [GpsDemo.csproj](../GpsDemo.csproj) | Target .NET 8, nullable và implicit usings |
| [wwwroot/index.html](../wwwroot/index.html) | Giao diện A/B, chọn tuyến, GPS, ngôn ngữ và theme |
| [wwwroot/app.js](../wwwroot/app.js) | Leaflet, GPS, HTTP, SignalR, reconnect, tìm đường, dịch giao diện |
| [wwwroot/style.css](../wwwroot/style.css) | Bố cục desktop/mobile, theme, trạng thái và accessibility |
| [wwwroot/icons.svg](../wwwroot/icons.svg) | SVG sprite dùng chung cho giao diện |
| [scripts/vendor.mjs](../scripts/vendor.mjs) | Copy Leaflet, SignalR và license vào `wwwroot/vendor` sau khi cài npm |
| [scripts/check.mjs](../scripts/check.mjs) | Kiểm tra bằng Node.js assert/VM, HTTP và hai SignalR client thật |
| [package.json](../package.json) | Dependency và các lệnh `postinstall`, `start`, `check` |
| [README.md](../README.md) | Hướng dẫn sử dụng, chạy local, tunnel và giới hạn |

`bin`, `obj`, `node_modules`, `wwwroot/vendor`, `artifacts` nằm trong `.gitignore`. Không sửa trực tiếp bản thư viện đã copy trong `wwwroot/vendor`.

## 3. Trạng thái và luồng hoạt động

### Phân biệt dữ liệu dùng chung và dữ liệu từng tab

| Dữ liệu | Nơi giữ | Đồng bộ giữa thiết bị |
| --- | --- | --- |
| Điểm đầu, điểm cuối | RAM server: `start`, `end` | Có, sau khi lưu đủ hai điểm |
| GPS mới nhất | RAM server: `latest` | Có |
| `routeSequence` và sequence GPS | RAM server, hai bộ đếm độc lập | Có, trong snapshot/event tương ứng |
| Geometry tuyến ô tô, tuyến đang chọn, bật/tắt tìm đường | Bộ nhớ từng tab | Không |
| Vệt GPS | Bộ nhớ từng tab, tối đa 200 mẫu | Không lưu lịch sử trên server |
| Theo GPS, vị trí/zoom bản đồ | Từng tab | Không |
| Ngôn ngữ và theme | `localStorage`: `gps-language`, `gps-theme` | Lưu trong trình duyệt, không đồng bộ qua server |

Khởi động lại server xóa A/B, GPS và đặt lại các bộ đếm. Tab mới chỉ nhận GPS mới nhất, không tải lại hành trình trước đó. Nút dừng GPS chỉ ngừng gửi từ thiết bị hiện tại; không xóa vị trí mới nhất trên server.

### Chọn A/B và tìm đường

1. Chọn điểm trên bản đồ hoặc nhập link Google Maps vào ô tương ứng.
2. Điểm đơn lẻ được giữ cục bộ. Khi có đủ A/B, frontend gửi `POST /api/route`.
3. Server lưu hai điểm, tăng `routeSequence`, broadcast `RouteUpdated` cho mọi client.
4. Tab bật **Tìm đường ô tô** gọi Valhalla để lấy geometry. `POST /api/route` chỉ lưu A/B, không tính đường đi.
5. Hiển thị tối đa hai tuyến thật, sắp theo khoảng cách; chọn qua radio hoặc click đường trên bản đồ. Tuyến đang chọn màu hồng, tuyến còn lại xanh xám.

Frontend tuần tự hóa việc lưu A/B, giữ thay đổi mới đang chờ và tránh để phản hồi nhập link chậm ghi đè một điểm vừa thay đổi.

### Gửi và xem GPS

1. Người dùng bật GPS trong secure context và cấp quyền vị trí.
2. `watchPosition` yêu cầu `enableHighAccuracy: true`, `maximumAge: 0`, timeout 15 giây.
3. Frontend gửi tối đa một mẫu/giây và không gửi chồng request; payload tới `POST /api/location`.
4. Server kiểm tra dữ liệu, thêm `receivedAt` và `sequence`, lưu mẫu mới nhất rồi broadcast `LocationUpdated`.
5. Các tab cập nhật marker, vòng độ chính xác và vệt GPS. Mẫu trùng/cũ bị bỏ qua theo sequence.

Request gửi GPS có timeout 10 giây. Frontend bỏ qua HTTP `409`; lỗi mạng được hiển thị và mẫu tiếp theo có thể thử lại. Dừng GPS hủy request đang gửi, dọn `watchPosition`; `pagehide` cũng gọi dừng.

**Theo vị trí GPS** bật mặc định. Kéo bản đồ sẽ tắt theo dõi; nút về GPS bật lại theo dõi và giữ zoom hiện tại. GPS bị đánh dấu cũ khi thời điểm chụp hoặc thời điểm nhận đã quá 15 giây. Vị trí GPS không bị kéo vào tuyến và không tự tìm lại đường khi đi lệch tuyến.

### Kết nối và reconnect

Frontend đăng ký hai event, kết nối hub rồi gọi `GetState` để lấy snapshot. Event đến trong lúc đồng bộ được buffer và xử lý sau snapshot.

Sau reconnect, frontend xóa marker/vệt cũ, đặt lại sequence cục bộ rồi áp dụng snapshot có thẩm quyền từ server. Cách này cần được giữ để xử lý cả trường hợp server restart và sequence quay về giá trị thấp. SignalR dùng automatic reconnect; giao diện có nút thử kết nối lại khi cần.

## 4. HTTP API và SignalR

JSON dùng tên thuộc tính camelCase. Thành công trả trực tiếp dữ liệu, không bọc trong `data`.

### Kiểu dữ liệu

| Kiểu | Thuộc tính JSON |
| --- | --- |
| `GeoPoint` | `latitude: number`, `longitude: number` |
| `RouteInput` | `start: GeoPoint`, `end: GeoPoint` |
| `RouteState` | `start: GeoPoint`, `end: GeoPoint`, `sequence: number` |
| `LocationInput` | `latitude: number`, `longitude: number`, `accuracy: number`, `capturedAt: string` |
| `LocationPoint` | Các field của `LocationInput`, thêm `receivedAt: string`, `sequence: number` |
| `GpsState` | `start: GeoPoint \| null`, `end: GeoPoint \| null`, `location: LocationPoint \| null`, `routeSequence: number` |
| `MapsLinkInput` | `url: string` |

`accuracy` tính bằng mét. `capturedAt` và `receivedAt` là thời gian `DateTimeOffset` biểu diễn bằng JSON; frontend gửi `capturedAt` dưới dạng ISO 8601 UTC. Hai sequence GPS và A/B không dùng thay thế nhau.

### Endpoint

| Method / đường dẫn | Đầu vào | Kết quả HTTP 200 |
| --- | --- | --- |
| `GET /api/health` | Không | `{"status":"ok"}` |
| `GET /api/state` | Không | `GpsState` hiện tại |
| `POST /api/route` | `RouteInput` | `RouteState`; phát `RouteUpdated` |
| `POST /api/location` | `LocationInput` | `LocationPoint`; phát `LocationUpdated` |
| `POST /api/maps/resolve` | `MapsLinkInput` | `GeoPoint`; chưa tự lưu vào A/B |

Snapshot khi server chưa có dữ liệu:

```json
{"start":null,"end":null,"location":null,"routeSequence":0}
```

Ví dụ body lưu A/B:

```json
{
  "start": { "latitude": 10.7769, "longitude": 106.7009 },
  "end": { "latitude": 10.779, "longitude": 106.705 }
}
```

Hub nằm tại **`/hubs/tracking`**. Method `GetState` trả `GpsState`; event `RouteUpdated` mang `RouteState`, `LocationUpdated` mang `LocationPoint`. Việc ghi dữ liệu đi qua HTTP, hub hiện chỉ có method đọc snapshot.

### Validation và lỗi

- Tọa độ phải hữu hạn: latitude trong `[-90, 90]`, longitude trong `[-180, 180]`.
- Request A/B cần đủ hai điểm; request GPS cần đủ các field của `LocationInput`.
- `accuracy` phải hữu hạn và không âm.
- `capturedAt` không được cũ quá 10 phút hoặc vượt giờ server quá 30 giây.
- Mẫu có `capturedAt` bằng hoặc nhỏ hơn mẫu mới nhất bị trả `409`; dữ liệu không hợp lệ trả `400`.
- Kestrel giới hạn request body ở **2048 byte**. Middleware chuyển `BadHttpRequestException` thành JSON `{"error":"..."}` với HTTP status tương ứng; không coi đây là bộ xử lý chung cho mọi exception.
- Response API có `Cache-Control: no-store`; server đặt `Referrer-Policy: strict-origin-when-cross-origin` và `X-Content-Type-Options: nosniff`.

## 5. Tích hợp dịch vụ bên ngoài

### Valhalla / OpenStreetMap

Tile: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.

Routing: `https://valhalla1.openstreetmap.de/route`, gọi từ browser bằng GET với query `json` đã encode:

| Tham số | Giá trị hiện tại |
| --- | --- |
| `locations` | A/B theo dạng `{ lat, lon, search_cutoff: 200 }` |
| `costing` | `auto` |
| `costing_options.auto.shortest` | `true` |
| `format` / `shape_format` | `osrm` / `geojson` |
| `alternates` | `1`, yêu cầu thêm một tuyến thay thế |

Các ràng buộc cần giữ:

- Debounce 1100 ms mỗi tab; request có timeout 15 giây, hủy request cũ và bỏ phản hồi lỗi thời khi đổi A/B hoặc tắt tìm đường.
- Chỉ nhận response HTTP thành công, `code === 'Ok'`, geometry `LineString` có ít nhất hai tọa độ hợp lệ và distance hữu hạn, không âm.
- GeoJSON dùng thứ tự **`[longitude, latitude]`**; Leaflet dùng **`[latitude, longitude]`**. Khoảng cách provider tính bằng mét, giao diện hiển thị km.
- Chỉ xét tối đa hai tuyến, sắp theo distance; geometry trùng nhau không tính là tuyến thay thế. Tuyến không hợp lệ trong số tuyến được xét làm response bị từ chối.
- Lỗi provider, lỗi mạng hoặc geometry không hợp lệ phải xóa đường cũ và cho thử lại. Không vẽ đường thẳng thay thế hay bịa tuyến thứ hai.
- Kết quả tìm đường không được kéo bản đồ khỏi GPS mới khi đang bật theo dõi.

`shortest: true` ưu tiên khoảng cách, **không bảo đảm tuyến ngắn nhất tuyệt đối** vì vẫn dùng hierarchical search. Mã hiện tại không gửi `disable_hierarchy_pruning`; warning `205` không làm loại một tuyến dài vốn hợp lệ. Lỗi thực sự như `DistanceExceeded` vẫn bị từ chối. Đây là hành vi hiện tại cần giữ khi đối chiếu với mô tả cũ.

Đường dài hoặc xuyên biên giới chỉ khả dụng khi dữ liệu và mạng đường của provider cho phép. Search cutoff 200 m tìm đường gần A/B; không vẽ đoạn nối giả từ điểm đã chọn tới đường.

### Google Maps

Resolver nhận link HTTPS, port 443, không có user info; giới hạn chuỗi URL 2000 ký tự. Ô nhập frontend giới hạn 1500 ký tự.

Host cho phép: `maps.app.goo.gl`, `goo.gl`, `google.com`, `www.google.com`, `maps.google.com`, `google.com.vn`, `www.google.com.vn`, `maps.google.com.vn`. Các host Google chính phải dùng đường dẫn `/maps`; `goo.gl` phải dùng `/maps/`.

Resolver ưu tiên một cặp `!3d...!4d...`, sau đó các query `q`, `query`, `ll`, `center` chứa cặp tọa độ. Có thể đọc `@lat,lng` ở đường dẫn khi link không chỉ định địa điểm mơ hồ. Link `/dir/`, nhiều cặp tọa độ địa điểm, tên địa điểm hoặc place ID không được dùng thay cho một điểm rõ ràng.

Chỉ short link mới cần HTTP ra Google; URL đầy đủ được parse trực tiếp. Short link cho phép tối đa 5 redirect, kiểm tra lại URL mỗi bước, timeout tổng 10 giây. Lỗi mạng/timeout/redirect trả `502`; link không hợp lệ hoặc không đủ tọa độ trả `400`. Đây không phải dịch vụ tìm địa chỉ theo tên hay Google Directions API.

## 6. Chạy local và dùng điện thoại

Yêu cầu: .NET 8 SDK, Node.js 22, npm; Internet để tải dependency, tile và gọi dịch vụ bản đồ.

Từ thư mục gốc:

```powershell
npm ci
dotnet run --project GpsDemo.csproj
```

Mở **`http://localhost:5085`**. `npm ci` chạy `postinstall` để tạo `wwwroot/vendor`; `npm start` là cách gọi khác của lệnh `dotnet run` trên. `--urls` có thể thay port mặc định.

Để thử GPS trên điện thoại cần HTTPS; HTTP qua IP LAN không đủ. Nếu đã có `cloudflared` tại đường dẫn bên dưới:

```powershell
./artifacts/cloudflared.exe tunnel --no-autoupdate --url http://localhost:5085 --protocol http2
```

Mở cùng URL HTTPS vừa được tạo trên máy tính và điện thoại; chỉ bật gửi GPS trên một thiết bị để tránh tranh vị trí. File `cloudflared.exe` không phải dependency được repository tự cài.

Quick Tunnel chỉ chuyển tiếp tới máy local. Máy, server, tunnel và trang GPS phải tiếp tục chạy; URL có thể đổi ở lần mở tunnel sau. Trình duyệt có thể ngừng cập nhật khi khóa màn hình hoặc đưa trang xuống nền. Không có URL public cố định được khai báo trong mã nguồn.

## 7. Kiểm tra hiện có

`npm run check` chạy [scripts/check.mjs](../scripts/check.mjs). Script **ghi A/B và GPS lên server đích**, nên dùng server riêng thay vì phiên đang chia sẻ thực tế.

Terminal 1:

```powershell
dotnet run --project GpsDemo.csproj -- --urls http://localhost:5086
```

Terminal 2, tại thư mục gốc:

```powershell
$env:GPS_URL = 'http://localhost:5086'
npm run check
Remove-Item Env:GPS_URL
```

Nếu không đặt `GPS_URL`, script mặc định gọi `http://localhost:5085`. Hai terminal phải chạy cùng mã nguồn cần kiểm tra.

Phạm vi kiểm tra đã có trong script:

- Frontend trong Node.js VM với DOM/Leaflet giả lập: theme, Việt/Anh, giữ icon và trạng thái khi đổi ngôn ngữ, theo GPS, recenter, reconnect snapshot và nhập link.
- Routing bằng response giả lập: geometry, tuyến thay thế, đường dài/warning `205`, validation, hủy request, bỏ phản hồi cũ, retry và không vẽ đường giả.
- HTTP tới server thật: health, static assets, link Google Maps đầy đủ, validation A/B/GPS, timestamp, field bắt buộc và duplicate `409`.
- Hai SignalR client qua WebSocket thật: broadcast cùng dữ liệu, snapshot và snapshot sau kết nối lại.

Script không thay thế kiểm tra trình duyệt thật, GPS thiết bị thật, độ chính xác bản đồ, short-link Google đang hoạt động hay tính sẵn sàng/CORS của Valhalla. Việc bổ sung tài liệu này không đồng nghĩa các kiểm tra runtime đã được chạy lại.

## 8. Giới hạn và lưu ý khi phát triển tiếp

- **Quyền truy cập:** chưa có authentication, authorization hay tách người gửi/người xem. Ai truy cập được server đều có thể xem GPS và thay đổi dữ liệu dùng chung.
- **Lưu trữ và triển khai:** dữ liệu chỉ ở RAM một process; restart mất dữ liệu, nhiều instance không có trạng thái/broadcast dùng chung. Vệt 200 mẫu chỉ là dữ liệu cục bộ trong tab.
- **Dịch vụ ngoài:** A/B được gửi tới FOSSGIS; tile tải từ OpenStreetMap; short link cần Google. Giới hạn request tìm đường nằm ở từng tab, không phải quota toàn hệ thống. Dịch vụ công cộng không bảo đảm uptime.
- **Nghiệp vụ vận tải:** chưa có waypoint bắt buộc, kiểm tra cửa khẩu, giấy phép, kích thước/tải trọng xe hoặc hạn chế vận tải hàng hóa. Tuyến ô tô hiển thị không xác nhận đủ điều kiện vận chuyển.
- **Tính năng chưa có:** tìm địa chỉ theo tên, GPS giả lập, chỉ dẫn từng chặng, tự tìm lại đường khi lệch tuyến, lịch sử bền vững và tích hợp API nghiệp vụ Pegaxus.
- **Giao diện:** mặc định tiếng Việt; lưu lựa chọn Việt/Anh, sáng/tối tại browser. Theme tối dùng CSS filter riêng cho tile, giữ màu marker/tuyến. Tên đường/địa điểm giữ nguyên theo dữ liệu OpenStreetMap.

Khi sửa tính năng, giữ các contract HTTP/SignalR, validation tại đầu vào, snapshot khi reconnect, phân biệt thứ tự tọa độ và cơ chế chống phản hồi cũ. Giữ label/ARIA, trạng thái bàn phím, attribution OpenStreetMap/FOSSGIS và license thư viện. Nếu thay asset frontend, kiểm tra query phiên bản CSS/JS đang khai báo trong `index.html`.

Đọc file chịu trách nhiệm trong bảng mã nguồn trước khi sửa; cập nhật kiểm tra liên quan trong `scripts/check.mjs`. Chỉ thêm phiên riêng, xác thực, persistence, waypoint hoặc hạ tầng routing khi phạm vi mới thực sự yêu cầu.
