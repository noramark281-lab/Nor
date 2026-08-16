; NSIS Installer Script for MEXC Trading Bot
; Usage: makensis installer.nsi

!include "MUI2.nsh"

; Installer attributes
Name "MEXC Spot Auto-Trading Bot"
OutFile "MEXCTradingBot-Installer.exe"
InstallDir "$PROGRAMFILES\MEXC Trading Bot"
InstallDirRegKey HKCU "Software\MEXCTradingBot" ""

; Request admin privileges
RequestExecutionLevel admin

; MUI Configuration
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; Version Information
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "MEXC Trading Bot"
VIAddVersionKey "ProductVersion" "1.0.0"
VIAddVersionKey "CompanyName" "MEXC Trading Bot Project"
VIAddVersionKey "FileVersion" "1.0.0"
VIAddVersionKey "FileDescription" "MEXC Spot Auto-Trading Bot"
VIAddVersionKey "LegalCopyright" "2024"

; Installation section
Section "Install"
    SetOutPath "$INSTDIR"
    
    ; Copy executable
    File "dist\MEXCTradingBot.exe"
    
    ; Copy config template
    File "config.json.example"
    
    ; Create start menu shortcut
    CreateDirectory "$SMPROGRAMS\MEXC Trading Bot"
    CreateShortCut "$SMPROGRAMS\MEXC Trading Bot\MEXC Trading Bot.lnk" "$INSTDIR\MEXCTradingBot.exe"
    CreateShortCut "$SMPROGRAMS\MEXC Trading Bot\Uninstall.lnk" "$INSTDIR\uninstall.exe"
    
    ; Create desktop shortcut
    CreateShortCut "$DESKTOP\MEXC Trading Bot.lnk" "$INSTDIR\MEXCTradingBot.exe"
    
    ; Write registry
    WriteRegStr HKCU "Software\MEXCTradingBot" "" "$INSTDIR"
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

; Uninstaller section
Section "Uninstall"
    Delete "$INSTDIR\MEXCTradingBot.exe"
    Delete "$INSTDIR\config.json.example"
    Delete "$INSTDIR\uninstall.exe"
    RMDir "$INSTDIR"
    
    Delete "$SMPROGRAMS\MEXC Trading Bot\MEXC Trading Bot.lnk"
    Delete "$SMPROGRAMS\MEXC Trading Bot\Uninstall.lnk"
    RMDir "$SMPROGRAMS\MEXC Trading Bot"
    
    Delete "$DESKTOP\MEXC Trading Bot.lnk"
    
    DeleteRegKey HKCU "Software\MEXCTradingBot"
SectionEnd
