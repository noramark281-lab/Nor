"""
Kivy GUI for MEXC Auto-Trading Bot
Cross-platform desktop and mobile interface
"""
import logging
from typing import Optional, Callable
from datetime import datetime
from threading import Thread

from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.spinner import Spinner
from kivy.uix.popup import Popup
from kivy.uix.switch import Switch
from kivy.uix.togglebutton import ToggleButton
from kivy.uix.image import Image
from kivy.garden.matplotlib.backend_kivyagg import FigureCanvasKivyAgg
from kivy.clock import Clock
from kivy.properties import StringProperty, BooleanProperty, NumericProperty

logger = logging.getLogger(__name__)

class MEXCTradingBotApp(App):
    """Main Kivy application for MEXC Auto-Trading Bot"""
    
    # Observable properties
    status_text = StringProperty("Disconnected")
    balance_text = StringProperty("USDT: $0.00")
    trading_active = BooleanProperty(False)
    log_text = StringProperty("")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.title = "MEXC Spot Auto-Trading Bot"
        self.client = None
        self.trading_bot = None
        self.log_history = []
        self.max_log_lines = 100
    
    def build(self):
        """Build the UI layout"""
        main_layout = BoxLayout(orientation='vertical', padding=10, spacing=10)
        
        # Header Section
        header = self._build_header()
        main_layout.add_widget(header)
        
        # Content Section
        content_layout = BoxLayout(orientation='horizontal', spacing=10)
        
        # Left Panel - Controls
        left_panel = self._build_left_panel()
        content_layout.add_widget(left_panel)
        
        # Right Panel - Status & Logs
        right_panel = self._build_right_panel()
        content_layout.add_widget(right_panel)
        
        main_layout.add_widget(content_layout)
        
        # Footer
        footer = self._build_footer()
        main_layout.add_widget(footer)
        
        # Schedule regular updates
        Clock.schedule_interval(self.update_ui, 1.0)  # Update every 1 second
        
        return main_layout
    
    def _build_header(self) -> BoxLayout:
        """Build header with title and status"""
        header = BoxLayout(orientation='horizontal', size_hint_y=0.1, spacing=10)
        
        title_label = Label(
            text="MEXC Spot Auto-Trading Bot",
            font_size='24sp',
            bold=True,
            size_hint_x=0.6
        )
        header.add_widget(title_label)
        
        status_box = BoxLayout(orientation='vertical', size_hint_x=0.4)
        status_box.add_widget(Label(text="Status:", size_hint_y=0.4))
        status_box.add_widget(Label(
            text=self.status_text,
            size_hint_y=0.6,
            color=(0, 1, 0, 1)  # Green
        ))
        header.add_widget(status_box)
        
        return header
    
    def _build_left_panel(self) -> BoxLayout:
        """Build left control panel"""
        left_panel = BoxLayout(orientation='vertical', size_hint_x=0.4, spacing=10)
        
        # API Configuration Section
        api_section = self._build_api_section()
        left_panel.add_widget(api_section)
        
        # Trading Controls Section
        controls_section = self._build_controls_section()
        left_panel.add_widget(controls_section)
        
        # Settings Section
        settings_section = self._build_settings_section()
        left_panel.add_widget(settings_section)
        
        return left_panel
    
    def _build_api_section(self) -> BoxLayout:
        """Build API configuration section"""
        api_box = BoxLayout(orientation='vertical', spacing=5)
        
        api_box.add_widget(Label(
            text="API Configuration",
            size_hint_y=0.15,
            bold=True,
            font_size='16sp'
        ))
        
        # API Key Input
        api_key_layout = BoxLayout(orientation='horizontal', size_hint_y=0.2, spacing=5)
        api_key_layout.add_widget(Label(text="API Key:", size_hint_x=0.3))
        self.api_key_input = TextInput(
            hint_text="Enter MEXC API Key",
            password=True,
            multiline=False,
            size_hint_x=0.7
        )
        api_key_layout.add_widget(self.api_key_input)
        api_box.add_widget(api_key_layout)
        
        # API Secret Input
        api_secret_layout = BoxLayout(orientation='horizontal', size_hint_y=0.2, spacing=5)
        api_secret_layout.add_widget(Label(text="API Secret:", size_hint_x=0.3))
        self.api_secret_input = TextInput(
            hint_text="Enter MEXC API Secret",
            password=True,
            multiline=False,
            size_hint_x=0.7
        )
        api_secret_layout.add_widget(self.api_secret_input)
        api_box.add_widget(api_secret_layout)
        
        # Connect Button
        connect_btn = Button(
            text="Connect to MEXC",
            size_hint_y=0.2,
            background_color=(0.2, 0.6, 0.2, 1)
        )
        connect_btn.bind(on_press=self.on_connect_pressed)
        api_box.add_widget(connect_btn)
        
        # Balance Display
        balance_box = BoxLayout(orientation='horizontal', size_hint_y=0.25, spacing=5)
        balance_box.add_widget(Label(text="Balance:"))
        balance_box.add_widget(Label(text=self.balance_text))
        api_box.add_widget(balance_box)
        
        return api_box
    
    def _build_controls_section(self) -> BoxLayout:
        """Build trading controls section"""
        controls_box = BoxLayout(orientation='vertical', spacing=5)
        
        controls_box.add_widget(Label(
            text="Trading Controls",
            size_hint_y=0.15,
            bold=True,
            font_size='16sp'
        ))
        
        # Allocation Input
        allocation_layout = BoxLayout(orientation='horizontal', size_hint_y=0.2, spacing=5)
        allocation_layout.add_widget(Label(text="Allocation (USD):", size_hint_x=0.4))
        self.allocation_input = TextInput(
            text="1.0",
            hint_text="$1.00",
            multiline=False,
            input_filter='float',
            size_hint_x=0.6
        )
        allocation_layout.add_widget(self.allocation_input)
        controls_box.add_widget(allocation_layout)
        
        # Start/Stop Toggle Button
        self.start_stop_btn = ToggleButton(
            text="START TRADING",
            size_hint_y=0.2,
            background_color=(0.6, 0.2, 0.2, 1),
            state='normal'
        )
        self.start_stop_btn.bind(on_press=self.on_start_stop_pressed)
        controls_box.add_widget(self.start_stop_btn)
        
        # Scan Pairs Button
        scan_btn = Button(
            text="Scan Pairs",
            size_hint_y=0.2,
            background_color=(0.2, 0.4, 0.6, 1)
        )
        scan_btn.bind(on_press=self.on_scan_pressed)
        controls_box.add_widget(scan_btn)
        
        # Check News Button
        news_btn = Button(
            text="Check News",
            size_hint_y=0.2,
            background_color=(0.6, 0.4, 0.2, 1)
        )
        news_btn.bind(on_press=self.on_news_pressed)
        controls_box.add_widget(news_btn)
        
        return controls_box
    
    def _build_settings_section(self) -> BoxLayout:
        """Build settings section"""
        settings_box = BoxLayout(orientation='vertical', spacing=5)
        
        settings_box.add_widget(Label(
            text="Settings",
            size_hint_y=0.15,
            bold=True,
            font_size='16sp'
        ))
        
        # Min Volume Filter
        min_vol_layout = BoxLayout(orientation='horizontal', size_hint_y=0.2, spacing=5)
        min_vol_layout.add_widget(Label(text="Min 24h Volume:", size_hint_x=0.4))
        self.min_volume_input = TextInput(
            text="1000000",
            hint_text="$1,000,000",
            multiline=False,
            input_filter='float',
            size_hint_x=0.6
        )
        min_vol_layout.add_widget(self.min_volume_input)
        settings_box.add_widget(min_vol_layout)
        
        # Stop Loss %
        stop_loss_layout = BoxLayout(orientation='horizontal', size_hint_y=0.2, spacing=5)
        stop_loss_layout.add_widget(Label(text="Stop Loss %:", size_hint_x=0.4))
        self.stop_loss_input = TextInput(
            text="2.0",
            hint_text="2.0%",
            multiline=False,
            input_filter='float',
            size_hint_x=0.6
        )
        stop_loss_layout.add_widget(self.stop_loss_input)
        settings_box.add_widget(stop_loss_layout)
        
        # Enable News Sentiment
        news_sentiment_layout = BoxLayout(orientation='horizontal', size_hint_y=0.2, spacing=5)
        news_sentiment_layout.add_widget(Label(text="News Sentiment:"))
        self.news_sentiment_switch = Switch(size_hint_x=0.5)
        news_sentiment_layout.add_widget(self.news_sentiment_switch)
        settings_box.add_widget(news_sentiment_layout)
        
        return settings_box
    
    def _build_right_panel(self) -> BoxLayout:
        """Build right status and logs panel"""
        right_panel = BoxLayout(orientation='vertical', size_hint_x=0.6, spacing=10)
        
        # Active Positions
        right_panel.add_widget(Label(
            text="Active Positions",
            size_hint_y=0.1,
            bold=True,
            font_size='16sp'
        ))
        
        self.positions_scroll = ScrollView(size_hint_y=0.3)
        self.positions_grid = GridLayout(
            cols=1,
            spacing=5,
            size_hint_y=None,
            height=0
        )
        self.positions_grid.bind(minimum_height=self.positions_grid.setter('height'))
        self.positions_scroll.add_widget(self.positions_grid)
        right_panel.add_widget(self.positions_scroll)
        
        # Logs Section
        right_panel.add_widget(Label(
            text="Activity Log",
            size_hint_y=0.08,
            bold=True,
            font_size='14sp'
        ))
        
        self.log_scroll = ScrollView(size_hint_y=0.52)
        self.log_label = Label(
            text=self.log_text,
            size_hint_y=None,
            markup=True,
            halign='left',
            valign='top'
        )
        self.log_label.bind(texture_size=self.log_label.setter('size'))
        self.log_scroll.add_widget(self.log_label)
        right_panel.add_widget(self.log_scroll)
        
        return right_panel
    
    def _build_footer(self) -> BoxLayout:
        """Build footer with action buttons"""
        footer = BoxLayout(orientation='horizontal', size_hint_y=0.08, spacing=10)
        
        settings_btn = Button(
            text="Settings",
            size_hint_x=0.25
        )
        footer.add_widget(settings_btn)
        
        help_btn = Button(
            text="Help",
            size_hint_x=0.25
        )
        footer.add_widget(help_btn)
        
        about_btn = Button(
            text="About",
            size_hint_x=0.25
        )
        footer.add_widget(about_btn)
        
        exit_btn = Button(
            text="Exit",
            size_hint_x=0.25,
            background_color=(1, 0.2, 0.2, 1)
        )
        exit_btn.bind(on_press=self.on_exit_pressed)
        footer.add_widget(exit_btn)
        
        return footer
    
    def log_message(self, message: str, level: str = "INFO"):
        """
        Add message to log display
        
        Args:
            message: Message to log
            level: Log level (INFO, WARNING, ERROR, SUCCESS)
        """
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Color code by level
        color_map = {
            "INFO": "[color=CCCCCC]",
            "WARNING": "[color=FFCC00]",
            "ERROR": "[color=FF6666]",
            "SUCCESS": "[color=66FF66]"
        }
        
        color_code = color_map.get(level, "[color=CCCCCC]")
        formatted_msg = f"{color_code}[{timestamp}] {level}: {message}[/color]"
        
        self.log_history.append(formatted_msg)
        
        # Limit log history
        if len(self.log_history) > self.max_log_lines:
            self.log_history.pop(0)
        
        # Update log display
        self.log_text = "\n".join(self.log_history)
        self.log_label.text = self.log_text
    
    def on_connect_pressed(self, instance):
        """Handle connect button press"""
        api_key = self.api_key_input.text
        api_secret = self.api_secret_input.text
        
        if not api_key or not api_secret:
            self.log_message("Please enter both API key and secret", "ERROR")
            return
        
        # Connect in background thread
        thread = Thread(target=self._connect_mexc, args=(api_key, api_secret))
        thread.daemon = True
        thread.start()
    
    def _connect_mexc(self, api_key: str, api_secret: str):
        """Connect to MEXC API (background thread)"""
        try:
            from src.api.mexc_spot_client import MEXCSpotClient
            
            self.client = MEXCSpotClient(api_key, api_secret)
            balance = self.client.get_usdt_balance()
            
            Clock.schedule_once(lambda dt: self.log_message(f"Connected! USDT Balance: ${balance:.2f}", "SUCCESS"))
            Clock.schedule_once(lambda dt: setattr(self, 'balance_text', f"USDT: ${balance:.2f}"))
            Clock.schedule_once(lambda dt: setattr(self, 'status_text', "Connected"))
        
        except Exception as e:
            Clock.schedule_once(lambda dt: self.log_message(f"Connection failed: {str(e)}", "ERROR"))
    
    def on_start_stop_pressed(self, instance):
        """Handle start/stop trading button press"""
        if instance.state == 'down':
            self.log_message("Trading started", "SUCCESS")
            instance.text = "STOP TRADING"
            instance.background_color = (0.2, 0.6, 0.2, 1)
            self.trading_active = True
        else:
            self.log_message("Trading stopped", "WARNING")
            instance.text = "START TRADING"
            instance.background_color = (0.6, 0.2, 0.2, 1)
            self.trading_active = False
    
    def on_scan_pressed(self, instance):
        """Handle scan pairs button press"""
        if not self.client:
            self.log_message("Connect to MEXC first", "ERROR")
            return
        
        self.log_message("Scanning pairs...", "INFO")
        thread = Thread(target=self._scan_pairs_thread)
        thread.daemon = True
        thread.start()
    
    def _scan_pairs_thread(self):
        """Scan pairs in background thread"""
        try:
            from src.strategy.scanner import PairScanner
            
            tickers = self.client.get_24h_ticker()
            scanner = PairScanner(min_volume_usdt=float(self.min_volume_input.text))
            
            top_pairs = scanner.get_top_pairs(tickers, limit=10, criteria="volume")
            
            msg = f"Found {len(top_pairs)} high-volume pairs:\n"
            for pair in top_pairs[:5]:
                msg += f"  {pair['symbol']}: ${pair['volume_usdt']:,.0f}\n"
            
            Clock.schedule_once(lambda dt: self.log_message(msg, "INFO"))
        
        except Exception as e:
            Clock.schedule_once(lambda dt: self.log_message(f"Scan failed: {str(e)}", "ERROR"))
    
    def on_news_pressed(self, instance):
        """Handle check news button press"""
        self.log_message("Fetching news...", "INFO")
        thread = Thread(target=self._check_news_thread)
        thread.daemon = True
        thread.start()
    
    def _check_news_thread(self):
        """Check news in background thread"""
        try:
            from src.strategy.news_sentiment import NewsSentimentAnalyzer
            
            analyzer = NewsSentimentAnalyzer()
            news = analyzer.fetch_news()
            analyzed = analyzer.analyze_news_batch(news[:5])
            summary = analyzer.get_sentiment_summary(analyzed)
            
            msg = f"Market Sentiment: {summary['market_sentiment']}\n"
            msg += f"Positive: {summary['positive_percent']:.1f}%\n"
            msg += f"Avg Confidence: {summary['avg_confidence']:.2f}"
            
            Clock.schedule_once(lambda dt: self.log_message(msg, "INFO"))
        
        except Exception as e:
            Clock.schedule_once(lambda dt: self.log_message(f"News check failed: {str(e)}", "ERROR"))
    
    def on_exit_pressed(self, instance):
        """Handle exit button press"""
        self.stop()
    
    def update_ui(self, dt):
        """Update UI elements periodically"""
        # This is called every second for live updates
        pass

def run_gui_app():
    """Run the Kivy application"""
    app = MEXCTradingBotApp()
    app.run()

if __name__ == '__main__':
    run_gui_app()
