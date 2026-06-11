use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use percent_encoding::{utf8_percent_encode, AsciiSet, CONTROLS};

static ICON_MEM_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));

fn cache_dir() -> PathBuf {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            return exe_dir.join(".icons_cache");
        }
    }
    PathBuf::from(".icons_cache")
}

fn cache_key(exe_path: &str) -> String {
    format!("app_{:016x}", seahash::hash(exe_path.as_bytes()))
}

fn cache_path(key: &str) -> PathBuf {
    cache_dir().join(format!("{}.png", key))
}

const URL_ENCODE_SET: &AsciiSet = &CONTROLS
    .add(b' ')
    .add(b'"')
    .add(b'#')
    .add(b'<')
    .add(b'>')
    .add(b'?')
    .add(b'`')
    .add(b'{')
    .add(b'}')
    .add(b':')
    .add(b';')
    .add(b'=')
    .add(b'@')
    .add(b'[')
    .add(b']')
    .add(b'^')
    .add(b'|')
    .add(b'%');

fn path_to_asset_url(path: &Path) -> String {
    let s = path.to_string_lossy().replace('\\', "/");
    let encoded = utf8_percent_encode(&s, URL_ENCODE_SET).to_string();
    format!("rs-asset://localhost/{}", encoded)
}

fn read_disk_cache(key: &str) -> Option<String> {
    let path = cache_path(key);
    if path.exists() {
        Some(path_to_asset_url(&path))
    } else {
        None
    }
}

fn write_disk_cache(key: &str, png_bytes: &[u8]) {
    let dir = cache_dir();
    if std::fs::create_dir_all(&dir).is_err() {
        return;
    }
    let path = dir.join(format!("{}.png", key));
    let _ = std::fs::write(&path, png_bytes);
}

pub fn extract_icon_to_png(exe_path: &str) -> String {
    if exe_path.is_empty() || !exe_path.to_lowercase().ends_with(".exe") {
        return String::new();
    }

    if !Path::new(exe_path).exists() {
        return String::new();
    }

    let key = cache_key(exe_path);

    if let Ok(cache) = ICON_MEM_CACHE.lock() {
        if let Some(cached) = cache.get(&key) {
            return cached.clone();
        }
    }

    if let Some(cached) = read_disk_cache(&key) {
        if let Ok(mut cache) = ICON_MEM_CACHE.lock() {
            cache.insert(key, cached.clone());
        }
        return cached;
    }

    unsafe {
        let hr = windows_sys::Win32::System::Com::CoInitializeEx(
            std::ptr::null(),
            windows_sys::Win32::System::Com::COINIT_APARTMENTTHREADED as u32,
        );

        let result = extract_icon_to_png_inner(exe_path, &key);

        if hr == 0 {
            windows_sys::Win32::System::Com::CoUninitialize();
        }

        result
    }
}

unsafe fn extract_icon_to_png_inner(exe_path: &str, key: &str) -> String {
    use windows_sys::Win32::UI::Shell::ExtractIconW;
    use windows_sys::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, ICONINFO};
    use windows_sys::Win32::Graphics::Gdi::{GetDIBits, SelectObject, DeleteObject, DeleteDC, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, GetObjectW, BITMAP};
    use windows_sys::Win32::Foundation::HWND;

    let wide_path: Vec<u16> = OsStr::new(exe_path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let hicon = ExtractIconW(
        HWND::default(),
        wide_path.as_ptr(),
        0,
    );

    if hicon.is_null() || hicon as isize <= 1 {
        return String::new();
    }

    let mut icon_info: ICONINFO = std::mem::zeroed();
    if GetIconInfo(hicon, &mut icon_info) == 0 {
        DestroyIcon(hicon);
        return String::new();
    }

    let hbm_color = icon_info.hbmColor;
    let hbm_mask = icon_info.hbmMask;

    if hbm_color.is_null() {
        if !hbm_mask.is_null() {
            DeleteObject(hbm_mask as _);
        }
        DestroyIcon(hicon);
        return String::new();
    }

    let mut bm: BITMAP = std::mem::zeroed();
    let bm_size = GetObjectW(
        hbm_color as _,
        std::mem::size_of::<BITMAP>() as i32,
        &mut bm as *mut _ as *mut _,
    );

    if bm_size == 0 {
        DeleteObject(hbm_color as _);
        if !hbm_mask.is_null() {
            DeleteObject(hbm_mask as _);
        }
        DestroyIcon(hicon);
        return String::new();
    }

    let width = bm.bmWidth;
    let height = bm.bmHeight;

    let hdc = windows_sys::Win32::Graphics::Gdi::CreateCompatibleDC(std::ptr::null_mut());
    if hdc.is_null() {
        DeleteObject(hbm_color as _);
        if !hbm_mask.is_null() {
            DeleteObject(hbm_mask as _);
        }
        DestroyIcon(hicon);
        return String::new();
    }

    let old_bmp = SelectObject(hdc, hbm_color as _);

    let mut bmi: BITMAPINFO = std::mem::zeroed();
    bmi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
    bmi.bmiHeader.biWidth = width;
    bmi.bmiHeader.biHeight = -height;
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 32;
    bmi.bmiHeader.biCompression = BI_RGB;

    let row_size = (width * 4) as usize;
    let buf_size = row_size * height as usize;
    let mut pixels: Vec<u8> = vec![0u8; buf_size];

    let result = GetDIBits(
        hdc,
        hbm_color,
        0,
        height as u32,
        pixels.as_mut_ptr() as *mut _,
        &mut bmi,
        DIB_RGB_COLORS,
    );

    SelectObject(hdc, old_bmp);
    DeleteDC(hdc);
    DeleteObject(hbm_color as _);
    if !hbm_mask.is_null() {
        DeleteObject(hbm_mask as _);
    }
    DestroyIcon(hicon);

    if result == 0 {
        return String::new();
    }

    for chunk in pixels.chunks_exact_mut(4) {
        chunk.swap(0, 2);
    }

    let png_bytes = match encode_png(&pixels, width as u32, height as u32) {
        Some(bytes) => bytes,
        None => return String::new(),
    };

    let cache_path = cache_path(key);
    write_disk_cache(key, &png_bytes);

    let url = path_to_asset_url(&cache_path);
    if let Ok(mut cache) = ICON_MEM_CACHE.lock() {
        cache.insert(key.to_string(), url.clone());
    }

    url
}

fn encode_png(pixels: &[u8], width: u32, height: u32) -> Option<Vec<u8>> {
    let mut png_buf = Vec::new();
    {
        let mut encoder = png::Encoder::new(std::io::Cursor::new(&mut png_buf), width, height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = encoder.write_header().ok()?;
        writer.write_image_data(pixels).ok()?;
    }
    Some(png_buf)
}
