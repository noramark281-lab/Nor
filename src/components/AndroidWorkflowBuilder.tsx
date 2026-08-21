import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Smartphone,
  ShieldCheck,
  Cpu,
  Key,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const AndroidWorkflowBuilder: React.FC = () => {
  const [packageName, setPackageName] = useState('com.mexc.mariabot');
  const [javaVersion, setJavaVersion] = useState<'17' | '21'>('17');
  const [gradleVersion, setGradleVersion] = useState('8.7');
  const [targetDevice, setTargetDevice] = useState('LT_9904 (Android 15)');
  const [keyAlias, setKeyAlias] = useState('release');
  const [copied, setCopied] = useState(false);

  const generateWorkflowYaml = () => {
    return `name: Build Signed Android 15 Release APK (LT_9904)

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Sign APK for ${targetDevice}
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4

      - name: ☕ Setup Java ${javaVersion} (Temurin)
        uses: actions/setup-java@v4
        with:
          java-version: '${javaVersion}'
          distribution: 'temurin'
          cache: 'gradle'

      - name: 🐘 Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '${gradleVersion}'

      - name: 🛠️ Ensure Gradle Wrapper Executable
        run: |
          gradle wrapper --gradle-version ${gradleVersion} --distribution-type all
          chmod +x ./gradlew

      - name: 🔑 Decode & Prepare Release Keystore
        env:
          KEYSTORE_BASE64: \${{ secrets.KEYSTORE_BASE64 }}
          KEYSTORE_PASS: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS_SECRET: \${{ secrets.KEY_ALIAS }}
        run: |
          mkdir -p app
          if [ -n "$KEYSTORE_BASE64" ]; then
            echo "$KEYSTORE_BASE64" | base64 --decode > app/release.keystore
            echo "storeFile=release.keystore" > key.properties
            echo "storePassword=$KEYSTORE_PASS" >> key.properties
            echo "keyAlias=\${KEY_ALIAS_SECRET:-${keyAlias}}" >> key.properties
            echo "keyPassword=$KEYSTORE_PASS" >> key.properties
          else
            echo "Generating fallback self-signed keystore for LT_9904 build..."
            keytool -genkeypair -v \\
              -keystore app/release.keystore \\
              -storepass androidci \\
              -keypass androidci \\
              -alias ${keyAlias} \\
              -keyalg RSA -keysize 2048 -validity 10000 \\
              -dname "CN=LT9904,O=ZizoBot,C=US"
            echo "storeFile=release.keystore" > key.properties
            echo "storePassword=androidci" >> key.properties
            echo "keyAlias=${keyAlias}" >> key.properties
            echo "keyPassword=androidci" >> key.properties
          fi

      - name: 🚀 Build Signed Release APK
        env:
          MEXC_API_KEY: \${{ secrets.MEXC_API_KEY }}
          MEXC_SECRET_KEY: \${{ secrets.MEXC_SECRET_KEY }}
          BLOCKPIT_API_KEY: \${{ secrets.BLOCKPIT_API_KEY }}
        run: |
          ./gradlew assembleRelease --no-daemon --stacktrace

      - name: 📦 Upload Signed APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: zizo-bot-release-apk
          path: app/build/outputs/apk/release/*.apk
          retention-days: 14
`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateWorkflowYaml());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 dir-rtl" dir="rtl">
      {/* Header Banner */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">مولد GitHub Actions لـ أندرويد (Android Workflow Builder)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Android 15 Native
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                توليد ملفات بناء سير العمل تلقائياً مع توقيع حزم APK الرقمية لجهاز <span className="text-cyan-400 font-bold font-mono">LT_9904</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'تم النسخ بنجاح!' : 'نسخ ملف YAML'}
            </button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              اسم الحزمة (Package Name)
            </label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              إصدار Java JDK
            </label>
            <select
              value={javaVersion}
              onChange={(e) => setJavaVersion(e.target.value as '17' | '21')}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="17">Java 17 (LTS المستقر)</option>
              <option value="21">Java 21 (LTS الأحدث)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              إصدار Gradle
            </label>
            <input
              type="text"
              value={gradleVersion}
              onChange={(e) => setGradleVersion(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              اسم مفتاح التوقيع (Key Alias)
            </label>
            <input
              type="text"
              value={keyAlias}
              onChange={(e) => setKeyAlias(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Terminal / Code Preview */}
      <div className="bg-[#090d1a] border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Terminal className="w-4 h-4" />
            <span>.github/workflows/main.yml</span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">جاهز لـ GitHub Actions Runner</span>
        </div>

        <pre className="bg-gray-950 p-4 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto max-h-96 leading-relaxed select-all">
          {generateWorkflowYaml()}
        </pre>
      </div>

      {/* Signing & Extraction Guide for LT_9904 */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          دليل المطورين لأوامر التوقيع واستخراج Base64 لجهاز LT_9904
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-cyan-400">1. توليد مفتاح التوقيع في Termux أو الحاسوب</h4>
            <pre className="bg-black/60 p-2.5 rounded text-[11px] font-mono text-gray-300 overflow-x-auto select-all">
              keytool -genkeypair -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
            </pre>
          </div>

          <div className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-emerald-400">2. استخراج Base64 لإضافته في GitHub Secrets</h4>
            <pre className="bg-black/60 p-2.5 rounded text-[11px] font-mono text-gray-300 overflow-x-auto select-all">
              {'base64 -w 0 release.keystore > keystore_base64.txt'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
