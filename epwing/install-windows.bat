@echo off
setlocal
if exist "manifest\manifest-windows.json" (
    reg add "HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\eplkup" /t REG_SZ /d "%cd%\manifest\manifest-windows.json"
    reg add "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\eplkup" /t REG_SZ /d "%cd%\manifest\manifest-windows-chrome.json"
)
