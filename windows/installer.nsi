!include "MUI2.nsh"

Name "Nor - MEXC Trader"
OutFile "..\Nor_Setup.exe"
InstallDir "$PROGRAMFILES64\Nor"
InstallDirRegKey HKLM "Software\Nor" "Install_Dir"
RequestExecutionLevel admin

!define MUI_ABORTWARNING
!define MUI_ICON "runner\resources\app_icon.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\Nor.exe"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Nor (required)"
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  File /r "..\build\windows\x64\runner\Release\*.*"
  
  WriteRegStr HKLM "Software\Nor" "Install_Dir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nor" "DisplayName" "Nor - MEXC Trader"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nor" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nor" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nor" "NoRepair" 1
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  CreateDirectory "$SMPROGRAMS\Nor"
  CreateShortcut "$SMPROGRAMS\Nor\Nor.lnk" "$INSTDIR\Nor.exe"
  CreateShortcut "$SMPROGRAMS\Nor\Uninstall.lnk" "$INSTDIR\uninstall.exe"
  CreateShortcut "$DESKTOP\Nor.lnk" "$INSTDIR\Nor.exe"
SectionEnd

Section "Uninstall"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nor"
  DeleteRegKey HKLM "Software\Nor"

  RMDir /r "$INSTDIR"
  Delete "$SMPROGRAMS\Nor\Nor.lnk"
  Delete "$SMPROGRAMS\Nor\Uninstall.lnk"
  RMDir "$SMPROGRAMS\Nor"
  Delete "$DESKTOP\Nor.lnk"
SectionEnd
