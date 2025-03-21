from flask import Flask, jsonify
from flask_cors import CORS
from routes.portfolio_routes import portfolio_bp
from routes.risk_routes import risk_bp

app = Flask(__name__)
CORS(app)  # 启用CORS支持

# 注册蓝图路由
app.register_blueprint(portfolio_bp, url_prefix="/api/portfolio")
app.register_blueprint(risk_bp, url_prefix="/api/risk")


# 基础路由，用于测试服务器是否正常运行
@app.route("/")
def home():
    return "RiskFX API 服务运行正常"


# 健康检查路由
@app.route("/health")
def health_check():
    return jsonify({"status": "ok", "message": "RiskFX服务运行正常"})


if __name__ == "__main__":
    port = 5000
    print(f"RiskFX 服务器正在端口 {port} 上运行")
    app.run(host="0.0.0.0", port=port, debug=True)
