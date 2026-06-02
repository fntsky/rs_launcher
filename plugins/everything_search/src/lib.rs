use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::os::windows::ffi::OsStrExt;
use std::sync::Mutex;
use std::collections::HashMap;
use once_cell::sync::Lazy;

pub struct EverythingPlugin;

static ICON_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));

fn extract_file_icon(path: &str) -> String {
    use windows_sys::Win32::UI::Shell::{SHGetFileInfoW, SHGFI_ICON, SHGFI_SMALLICON, SHFILEINFOW};
    use windows_sys::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo};
    use windows_sys::Win32::Graphics::Gdi::{GetObjectW, BITMAP};

    // Extract extension for cache key
    let cache_key = std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("_folder_")
        .to_lowercase();
    // Check cache first
    if let Ok(cache) = ICON_CACHE.lock() {
        if let Some(cached) = cache.get(&cache_key) {
            return cached.clone();
        }
    }

    let wide_path: Vec<u16> = std::ffi::OsStr::new(path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let mut shfi: SHFILEINFOW = unsafe { std::mem::zeroed() };

    let ret = unsafe {
        SHGetFileInfoW(
            wide_path.as_ptr(),
            0,
            &mut shfi as *mut _ as *mut _,
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_SMALLICON,
        )
    };

    if ret == 0 || shfi.hIcon == std::ptr::null_mut() {
        return String::new();
    }

    // Get actual icon bitmap size
    let mut icon_info = unsafe { std::mem::zeroed() };
    let mut width = 16;
    let mut height = 16;
    if unsafe { GetIconInfo(shfi.hIcon, &mut icon_info) } != 0 {
        let mut bmp: BITMAP = unsafe { std::mem::zeroed() };
        unsafe { GetObjectW(icon_info.hbmColor, std::mem::size_of::<BITMAP>() as i32, &mut bmp as *mut _ as *mut _); }
        width = bmp.bmWidth;
        height = bmp.bmHeight;
        unsafe {
            windows_sys::Win32::Graphics::Gdi::DeleteObject(icon_info.hbmColor);
            windows_sys::Win32::Graphics::Gdi::DeleteObject(icon_info.hbmMask);
        }
    }

    let result = icon_to_png(shfi.hIcon, width, height);
    unsafe { DestroyIcon(shfi.hIcon); }

    // Store in cache by extension
    if let Ok(mut cache) = ICON_CACHE.lock() {
        cache.insert(cache_key, result.clone());
    }

    result
}

fn icon_to_png(hicon: *mut core::ffi::c_void, width: i32, height: i32) -> String {
    use windows_sys::Win32::Graphics::Gdi::{
        CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, SelectObject,
        GetObjectW, BITMAP, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetIconInfo, ICONINFO};

    let mut icon_info: ICONINFO = unsafe { std::mem::zeroed() };
    if unsafe { GetIconInfo(hicon, &mut icon_info) } == 0 {
        eprintln!("[ICON] GetIconInfo failed");
        return String::new();
    }

    if icon_info.hbmColor == std::ptr::null_mut() {
        eprintln!("[ICON] hbmColor is null");
        unsafe { DeleteObject(icon_info.hbmMask); }
        return String::new();
    }

    // Get actual bitmap dimensions
    let mut bmp: BITMAP = unsafe { std::mem::zeroed() };
    let bmp_size = unsafe { GetObjectW(icon_info.hbmColor, std::mem::size_of::<BITMAP>() as i32, &mut bmp as *mut _ as *mut _) };
    eprintln!("[ICON] GetObjectW returned {}, bitmap: {}x{}x{}", bmp_size, bmp.bmWidth, bmp.bmHeight, bmp.bmBitsPixel);

    let dc = unsafe { CreateCompatibleDC(std::ptr::null_mut()) };
    if dc == std::ptr::null_mut() {
        eprintln!("[ICON] CreateCompatibleDC failed");
        unsafe { DeleteObject(icon_info.hbmColor); DeleteObject(icon_info.hbmMask); }
        return String::new();
    }

    // Select the color bitmap into the DC
    let old_bitmap = unsafe { SelectObject(dc, icon_info.hbmColor) };
    if old_bitmap == std::ptr::null_mut() {
        eprintln!("[ICON] SelectObject failed");
        unsafe { DeleteDC(dc); DeleteObject(icon_info.hbmColor); DeleteObject(icon_info.hbmMask); }
        return String::new();
    }

    // Setup BITMAPINFOHEADER for GetDIBits
    let mut bmi_data: [u8; 64] = [0u8; 64];
    let bmi = bmi_data.as_mut_ptr() as *mut BITMAPINFOHEADER;
    unsafe {
        (*bmi).biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
        (*bmi).biWidth = width;
        (*bmi).biHeight = -height; // top-down
        (*bmi).biPlanes = 1;
        (*bmi).biBitCount = 32;
        (*bmi).biCompression = BI_RGB;
    }

    let mut pixels: Vec<u8> = vec![0u8; (width * height * 4) as usize];
    let scan_lines = unsafe {
        GetDIBits(
            dc,
            icon_info.hbmColor,
            0,
            height as u32,
            pixels.as_mut_ptr() as *mut _,
            bmi as *mut _,
            DIB_RGB_COLORS,
        )
    };

    eprintln!("[ICON] GetDIBits returned {} scan lines", scan_lines);

    // Cleanup
    unsafe {
        SelectObject(dc, old_bitmap);
        DeleteDC(dc);
        DeleteObject(icon_info.hbmColor);
        DeleteObject(icon_info.hbmMask);
    }

    if scan_lines == 0 {
        eprintln!("[ICON] GetDIBits returned 0 scan lines");
        return String::new();
    }

    // BGRA -> RGBA
    for chunk in pixels.chunks_exact_mut(4) {
        let b = chunk[0];
        let r = chunk[2];
        chunk[0] = r;
        chunk[2] = b;
    }

    // Encode as PNG using `image` crate
    let img = image::RgbaImage::from_raw(width as u32, height as u32, pixels);
    let Some(img) = img else {
        eprintln!("[ICON] RgbaImage::from_raw failed");
        return String::new();
    };

    let mut png_buf = Vec::new();
    if img.write_to(&mut std::io::Cursor::new(&mut png_buf), image::ImageFormat::Png).is_err() {
        eprintln!("[ICON] PNG encode failed");
        return String::new();
    }

    format!("data:image/png;base64,{}", base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &png_buf))
}

fn encode_rgba_as_png(rgba: &[u8], width: u32, height: u32) -> String {
    // Use a minimal PNG encoder: we'll just encode raw RGBA as PNG
    // For 16x16 icons, the data is small enough that no compression is fine
    let mut png_data = Vec::new();

    // PNG signature
    png_data.extend_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    let ihdr_data = {
        let mut d = Vec::new();
        d.extend_from_slice(&width.to_be_bytes());
        d.extend_from_slice(&height.to_be_bytes());
        d.push(8); // bit depth
        d.push(6); // color type: RGBA
        d.push(0); // compression
        d.push(0); // filter
        d.push(0); // interlace
        d
    };
    write_png_chunk(&mut png_data, b"IHDR", &ihdr_data);

    // IDAT chunk - raw image data with filter byte 0 per row
    let mut raw_data = Vec::with_capacity((width as usize * 4 + 1) * height as usize);
    for row in 0..height as usize {
        raw_data.push(0); // filter: None
        let start = row * width as usize * 4;
        let end = start + width as usize * 4;
        raw_data.extend_from_slice(&rgba[start..end]);
    }

    // Compress with deflate (store mode for simplicity)
    let mut deflate_data = Vec::new();
    deflate_data.push(0x78); // CMF: deflate, window 7
    deflate_data.push(0x01); // FLG: no dict, level 0
    deflate_data.extend_from_slice(&raw_data);
    let adler = adler32(&raw_data);
    deflate_data.extend_from_slice(&adler.to_be_bytes());

    write_png_chunk(&mut png_data, b"IDAT", &deflate_data);

    // IEND chunk
    write_png_chunk(&mut png_data, b"IEND", &[]);

    format!("data:image/png;base64,{}", base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &png_data))
}

fn write_png_chunk(out: &mut Vec<u8>, chunk_type: &[u8; 4], data: &[u8]) {
    out.extend_from_slice(&(data.len() as u32).to_be_bytes());
    out.extend_from_slice(chunk_type);
    out.extend_from_slice(data);
    let mut crc_data = Vec::with_capacity(4 + data.len());
    crc_data.extend_from_slice(chunk_type);
    crc_data.extend_from_slice(data);
    let crc = crc32(&crc_data);
    out.extend_from_slice(&crc.to_be_bytes());
}

fn crc32(data: &[u8]) -> u32 {
    let mut table = [0u32; 256];
    for i in 0..256 {
        let mut c = i as u32;
        for _ in 0..8 {
            c = if c & 1 != 0 { 0xEDB88320 ^ (c >> 1) } else { c >> 1 };
        }
        table[i] = c;
    }
    let mut crc = 0xFFFFFFFFu32;
    for &b in data {
        crc = table[((crc ^ b as u32) & 0xFF) as usize] ^ (crc >> 8);
    }
    crc ^ 0xFFFFFFFF
}

fn adler32(data: &[u8]) -> u32 {
    let mut a: u32 = 1;
    let mut b: u32 = 0;
    for &byte in data {
        a = (a + byte as u32) % 65521;
        b = (b + a) % 65521;
    }
    (b << 16) | a
}

fn search_everything(query: &str) -> String {
    if query.is_empty() {
        return r#"{"results":[],"error":null}"#.to_string();
    }

    use everything_ipc::wm::{EverythingClient, RequestFlags, Sort};

    let everything = match EverythingClient::new() {
        Ok(e) => e,
        Err(_) => return r#"{"results":[],"error":"Everything 服务未运行，请先启动 Everything"}"#.to_string(),
    };

    let list = everything
        .query_wait(query)
        .request_flags(RequestFlags::FileName | RequestFlags::Path | RequestFlags::Size | RequestFlags::Attributes)
        .sort(Sort::NameAscending)
        .max_results(100)
        .call();

    match list {
        Err(e) => {
            let msg = format!("搜索失败: {}", e);
            return format!(r#"{{"results":[],"error":"{}"}}"#, msg.replace('"', "\\\""));
        }
        Ok(list) => {
            let mut results = Vec::new();

            for item in list.iter() {
                let filename = item.get_string(RequestFlags::FileName).unwrap_or_default();
                let path = item.get_string(RequestFlags::Path).unwrap_or_default();
                let full_path = if path.is_empty() {
                    filename.clone()
                } else {
                    format!("{}\\{}", path, filename)
                };

                let size_val = item.get_size(RequestFlags::Size).unwrap_or(0);

                // Check if folder via attributes (FILE_ATTRIBUTE_DIRECTORY = 0x10)
                let attrs = item.get_u32(RequestFlags::Attributes).unwrap_or(0);
                let is_folder = (attrs & 0x10) != 0;

                                let icon = extract_file_icon(&full_path);

                let size_str = if is_folder {
                    String::new()
                } else {
                    format_size(size_val)
                };

                results.push(serde_json::json!({
                    "title": filename,
                    "subtitle": full_path,
                    "is_folder": is_folder,
                    "size": size_str,
                    "icon": icon,
                }));
            }

            serde_json::json!({
                "results": results,
                "error": null,
            })
            .to_string()
        }
    }
}

fn format_size(bytes: u64) -> String {
    if bytes >= 1073741824 {
        format!("{:.1} GB", bytes as f64 / 1073741824.0)
    } else if bytes >= 1048576 {
        format!("{:.1} MB", bytes as f64 / 1048576.0)
    } else if bytes >= 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{} B", bytes)
    }
}

// ============================================================
// C ABI Exports
// ============================================================

#[no_mangle]
pub extern "C" fn plugin_create() -> *mut EverythingPlugin {
    Box::into_raw(Box::new(EverythingPlugin))
}

#[no_mangle]
pub extern "C" fn plugin_destroy(p: *mut EverythingPlugin) {
    if !p.is_null() {
        unsafe {
            drop(Box::from_raw(p));
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_id(_p: *mut EverythingPlugin) -> *const c_char {
    b"everything_search\0".as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_name(_p: *mut EverythingPlugin) -> *const c_char {
    "Everything 文件搜索\0".as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_query(_p: *mut EverythingPlugin, q: *const c_char) -> *const c_char {
    let query = unsafe { CStr::from_ptr(q).to_str().unwrap_or("") };

    let results = if query.is_empty() {
        // Return entry point result for empty query
        r#"[{"plugin_id":"everything_search","title":"Everything 文件搜索","subtitle":"搜索文件和文件夹","relevance":0.3,"icon_path":"🔍","action":"open_renderer","template":"default"}]"#
    } else {
        let q_lower = query.to_lowercase();
        if q_lower.contains("ev") || q_lower.contains("文件") || q_lower.contains("搜索") || q_lower.contains("file") || q_lower.contains("search") {
            r#"[{"plugin_id":"everything_search","title":"Everything 文件搜索","subtitle":"搜索文件和文件夹","relevance":0.5,"icon_path":"🔍","action":"open_renderer","template":"default"}]"#
        } else {
            "[]"
        }
    };

    CString::new(results).unwrap().into_raw() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_free_results(s: *const c_char) {
    if !s.is_null() {
        unsafe {
            let _ = CString::from_raw(s as *mut _);
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_invoke(
    _p: *mut EverythingPlugin,
    command: *const c_char,
    args: *const c_char,
) -> *const c_char {
    let cmd = unsafe { CStr::from_ptr(command).to_str().unwrap_or("") };
    let args_str = unsafe { CStr::from_ptr(args).to_str().unwrap_or("{}") };

    let result = match cmd {
        "search" => {
            let query = serde_json::from_str::<serde_json::Value>(args_str)
                .ok()
                .and_then(|v| v["query"].as_str().map(|s| s.to_string()))
                .unwrap_or_default();
            search_everything(&query)
        }
        _ => r#"{"error":"unknown command"}"#.to_string(),
    };

    CString::new(result).unwrap().into_raw() as *const c_char
}