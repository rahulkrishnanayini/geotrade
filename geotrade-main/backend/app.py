from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timezone

app = Flask(__name__)

# Allow ALL origins - fixes cross-domain requests from Vercel to Render
CORS(app)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Access-Control-Allow-Methods'] = '*'
    return response

@app.route('/')
def index():
    return jsonify({"status": "GeoTrade backend running"})

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "ts": datetime.now(timezone.utc).isoformat()})

def get_modules():
    from nlp_engine import NLPEngine
    from signal_generator import SignalGenerator
    from data_feeds import DataFeedAggregator
    return NLPEngine(), SignalGenerator(), DataFeedAggregator()

@app.route('/api/gti')
def get_gti():
    try:
        nlp, sig, feeds = get_modules()
        return jsonify(sig.compute_gti([nlp.score_event(e) for e in feeds.get_latest_events()]))
    except Exception as e:
        return jsonify({"value": 45.0, "change": 0.0, "level": "MODERATE", "trend": []})

@app.route('/api/events')
def get_events():
    try:
        nlp, sig, feeds = get_modules()
        return jsonify([nlp.score_event(e) for e in feeds.get_latest_events()])
    except Exception as e:
        return jsonify([])

@app.route('/api/signals')
def get_signals():
    try:
        nlp, sig, feeds = get_modules()
        return jsonify(sig.generate_signals([nlp.score_event(e) for e in feeds.get_latest_events()]))
    except Exception as e:
        return jsonify([])

@app.route('/api/country-tensions')
def get_tensions():
    try:
        from dynamic_tension import get_all_tensions_list
        return jsonify(get_all_tensions_list())
    except Exception as e:
        print(f"[tensions error] {e}")
        return jsonify([])

@app.route('/api/country/<path:name>')
def get_country(name):
    try:
        from realtime_country import get_country_realtime
        return jsonify(get_country_realtime(name))
    except Exception as e:
        print(f"[country error] {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e), "news": [], "stocks": [], "commodities": [], "currency": "USD", "flag": "🌍"})

@app.route('/api/country-analysis/<path:name>')
def get_analysis(name):
    try:
        from country_signals import get_country_full_analysis
        return jsonify(get_country_full_analysis(name))
    except Exception as e:
        print(f"[analysis error] {e}")
        return jsonify({"error": str(e), "signals": [], "forex": [], "crypto": [], "indices": [], "commodities": [], "etfs": [], "bonds": [], "sanctions": {}})

@app.route('/api/forecast/<path:country>')
def get_forecast(country):
    try:
        from realtime_country import get_country_realtime
        from stock_forecast import batch_forecast
        years = int(request.args.get("years", 10))
        data = get_country_realtime(country)
        forecasts = batch_forecast(data.get("stocks", []), country, data.get("fx_rate", 1.0), years)
        return jsonify({"country": country, "currency": data.get("currency", "USD"), "years": years, "forecasts": forecasts})
    except Exception as e:
        print(f"[forecast error] {e}")
        return jsonify({"error": str(e), "forecasts": []})

@app.route('/api/waitlist', methods=['POST'])
def waitlist():
    data = request.get_json() or {}
    print(f"[Waitlist] {data.get('email')}")
    return jsonify({"success": True})

if __name__ == '__main__':
    print("🌍 GeoTrade Backend running on http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')
