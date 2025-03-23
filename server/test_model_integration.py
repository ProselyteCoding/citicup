import requests
import json

# 服务器基础URL
BASE_URL = "http://localhost:5000/api"

# 测试数据
test_portfolio = [
    {
        "currency": "EUR/USD",
        "quantity": 1000000,
        "proportion": 0.35,
        "benefit": 2500,
        "dailyVolatility": 0.125,
        "valueAtRisk": "$15,000",
        "beta": 1.2,
        "hedgingCost": 0.0015
    },
    {
        "currency": "USD/JPY",
        "quantity": 2000000,
        "proportion": 0.45,
        "benefit": -1200,
        "dailyVolatility": 0.085,
        "valueAtRisk": "$25,000",
        "beta": 0.9,
        "hedgingCost": 0.0012
    }
]

def test_risk_signals_flow():
    """测试完整流程：上传持仓数据然后获取风险信号分析"""
    # 步骤1：上传持仓数据
    response = requests.post(
        f"{BASE_URL}/portfolio/upload",
        json=test_portfolio,
        headers={"Content-Type": "application/json"}
    )
    
    print("上传持仓数据响应:")
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {response.json()}")
    
    # 检查上传是否成功
    if not response.ok or not response.json().get("success"):
        print("❌ 上传持仓数据失败，终止测试")
        return
    
    print("\n✅ 上传持仓数据成功")
    
    # 步骤2：获取风险信号分析
    response = requests.get(f"{BASE_URL}/portfolio/risk-signals")
    
    print("\n获取风险信号分析响应:")
    print(f"状态码: {response.status_code}")
    
    # 检查请求是否成功
    if not response.ok:
        print(f"❌ 获取风险信号分析失败: HTTP {response.status_code}")
        return
    
    # 解析响应内容
    result = response.json()
    print(f"响应内容: {json.dumps(result, indent=2, ensure_ascii=False)}")
    
    # 验证响应格式
    if result.get("success") and "data" in result:
        data = result["data"]
        # 检查数据格式是否正确
        if "current" in data and "warning" in data:
            print("\n✅ 风险信号分析测试成功! 返回了正确的数据格式")
        else:
            print("\n❌ 风险信号分析数据格式错误: 缺少 'current' 或 'warning' 字段")
    else:
        print(f"\n❌ 风险信号分析请求失败: {result.get('message', '未知错误')}")

if __name__ == "__main__":
    # 确保服务器已启动
    print("开始测试风险信号分析接口...\n")
    test_risk_signals_flow()