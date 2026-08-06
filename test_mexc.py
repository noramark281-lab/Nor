import ccxt

# إعداد المنصة بالمفاتيح الخاصة بك
exchange = ccxt.mexc({
    'apiKey': 'mx0vglR6uY6sH90O9m',     # استبدله بمفتاحك
    'secret': '72cbe62e306d4c96a504b3cf836354d0',  # استبدله بالمفتاح السري
    'options': {
        'defaultType': 'swap',         # swap مخصصة للعقود الآجلة، استخدم 'spot' للتداول الفوري
    }
})

try:
    print("جاري التحقق من الاتصال ومزامنة الوقت مع سيرفرات MEXC...")
    # 1. اختبار جلب الأسعار اللحظية (لا يتطلب مفاتيح)
    ticker = exchange.fetch_ticker('BTC/USDT:USDT')
    print(f"الاتصال ناجح! سعر البيتكوين الحالي على MEXC: {ticker['last']} USDT")
    
    # 2. اختبار جلب رصيد المحفظة (يتطلب مفاتيح API صحيحة)
    print("\nجاري التحقق من مفاتيح الـ API وجلب رصيد المحفظة...")
    balance = exchange.fetch_balance()
    
    # طباعة الأرصدة المتاحة فقط والتي تمتلك قيمة أكبر من الصفر
    free_balances = {k: v for k, v in balance['free'].items() if v > 0}
    if free_balances:
        print("الأرصدة المتوفرة في حسابك الحقيقي:")
        for coin, amount in free_balances.items():
            print(f"- {coin}: {amount}")
    else:
        print("المفاتيح صحيحة، ولكن لا يوجد رصيد متاح في المحفظة المحددة.")

except ccxt.AuthenticationError:
    print("\n❌ خطأ في المصادقة: مفتاح الـ API أو الـ Secret غير صحيح، أو لم يتم تفعيل الصلاحيات المناسبة من إعدادات المنصة.")
except ccxt.NetworkError as e:
    print(f"\n❌ خطأ في الشبكة: تعذر الاتصال بخوادم المنصة. التفاصيل: {e}")
except Exception as e:
    print(f"\n❌ حدث خطأ غير متوقع: {e}")
