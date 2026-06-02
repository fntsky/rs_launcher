@echo off
setlocal enabledelayedexpansion

set "PROFILE=%~1"
if "%PROFILE%"=="" set "PROFILE=debug"
if /i "%PROFILE%"=="release" (
    set "CARGO_ARGS=--release"
    set "CARGO_PROFILE=release"
) else (
    set "CARGO_ARGS="
    set "CARGO_PROFILE=debug"
)

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo [BUILD] Compiling workspace plugins (%CARGO_PROFILE%)...
cargo build -p hello_plugin %CARGO_ARGS%
if errorlevel 1 (
    echo [BUILD] ERROR: Plugin compilation failed
    exit /b 1
)

set "PLUGINS_DIR=%PROJECT_DIR%\plugins"
set "WORKSPACE_TARGET=%PROJECT_DIR%\target\%CARGO_PROFILE%"

rem Copy each plugin's DLL back to its source directory
for /d %%D in ("%PLUGINS_DIR%\*") do (
    if exist "%%D\plugin.json" (
        set "plugin_dir=%%D"
        set "plugin_name=%%~nxD"

        rem Read dll field from plugin.json
        set "dll_name="
        for /f "tokens=2 delims=:, " %%A in ('findstr /i "\"dll\"" "%%D\plugin.json"') do (
            set "dll_name=%%~A"
        )

        if defined dll_name (
            set "src_dll=%WORKSPACE_TARGET%\!dll_name!"
            if exist "!src_dll!" (
                copy /y "!src_dll!" "%%D\!dll_name!" >nul
                echo [BUILD] Copied: !dll_name!
            ) else (
                echo [BUILD] WARNING: DLL not found: !src_dll!
            )
        )
    )
)

rem Deploy plugins to target directory
set "output_plugins=%WORKSPACE_TARGET%\plugins"
if not exist "%output_plugins%" mkdir "%output_plugins%"

for /d %%D in ("%PLUGINS_DIR%\*") do (
    if exist "%%D\plugin.json" (
        set "plugin_name=%%~nxD"
        set "dst_dir=%output_plugins%\!plugin_name!"
        if not exist "!dst_dir!" mkdir "!dst_dir!"

        rem Read dll field
        set "dll_name="
        for /f "tokens=2 delims=:, " %%A in ('findstr /i "\"dll\"" "%%D\plugin.json"') do (
            set "dll_name=%%~A"
        )

        rem Copy DLL
        if defined dll_name if exist "%%D\!dll_name!" (
            copy /y "%%D\!dll_name!" "!dst_dir!\" >nul
        )

        rem Copy plugin.json
        copy /y "%%D\plugin.json" "!dst_dir!\" >nul

        rem Copy renderer directory
        if exist "%%D\renderer" (
            if not exist "!dst_dir!\renderer" mkdir "!dst_dir!\renderer"
            xcopy /y /q "%%D\renderer\*" "!dst_dir!\renderer\" >nul 2>nul
        )

        echo [BUILD] Deployed: !plugin_name!
    )
)

echo [BUILD] Done
