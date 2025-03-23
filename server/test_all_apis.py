import requests
import json
import time

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
        "valueAtRisk": "15,000",
        "beta": 1.2,
        "hedgingCost": 0.0015
    },
    {
        "currency": "USD/JPY",
        "quantity": 2000000,
        "proportion": 0.45,
        "benefit": -1200,
        "dailyVolatility": 0.085,
        "valueAtRisk": "25,000",
        "beta": 0.9,
        "hedgingCost": 0.0012
    }
]

# 测试场景
test_scenario = "美联储加息100bp"
test_currency = "EUR/USD"

def test_api(method, url, data=None, desc=""):
    """通用API测试函数"""
    print(f"\n===== 测试{desc} =====")
    print(f"请求: {method} {url}")
    
    if data:
        print(f"请求数据: {json.dumps(data, ensure_ascii=False)[:200]}...")
    
    try:
        if method.upper() == "GET":
            response = requests.get(url)
        else:
            response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        
        print(f"状态码: {response.status_code}")
        
        if response.ok:
            result = response.json()
            success = result.get("success", False)
            print(f"请求成功: {success}")
            
            if success:
                if "data" in result:
                    print(f"数据: {json.dumps(result['data'], ensure_ascii=False, indent=2)[:500]}...")
                else:
                    print(f"消息: {result.get('message', '无消息')}")
                return True, result
            else:
                print(f"请求失败: {result.get('message', '未知错误')}")
                return False, result
        else:
            print(f"HTTP错误: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"请求异常: {str(e)}")
        return False, None

def test_all_apis():
    """测试所有API接口"""
    results = {}
    
    # 测试1: 上传持仓数据
    success, _ = test_api(
        "POST", 
        f"{BASE_URL}/portfolio/upload", 
        test_portfolio,
        "上传持仓数据"
    )
    results["上传持仓数据"] = success
    
    if not success:
        print("上传持仓数据失败，后续测试可能不准确")
    
    # 等待数据处理
    time.sleep(1)
    
    # 测试2: 获取风险信号分析
    success, _ = test_api(
        "GET", 
        f"{BASE_URL}/portfolio/risk-signals",
        None,
        "风险信号分析"
    )
    results["风险信号分析"] = success
    
    # 测试3: 获取对冲建议
    success, _ = test_api(
        "GET", 
        f"{BASE_URL}/portfolio/hedging-advice",
        None, 
        "对冲建议"
    )
    results["对冲建议"] = success
    
    # 测试4: 压力测试
    success, _ = test_api(
        "POST", 
        f"{BASE_URL}/risk/stress-test",
        {"scenario": test_scenario},
        "压力测试"
    )
    results["压力测试"] = success
    
    # 测试5: 货币预测
    success, _ = test_api(
        "POST", 
        f"{BASE_URL}/risk/currency-prediction",
        {"currency": test_currency},
        "货币预测"
    )
    results["货币预测"] = success
    
    # 打印测试结果摘要
    print("\n===== 测试结果摘要 =====")
    for api, result in results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{api}: {status}")

if __name__ == "__main__":
    print("开始测试所有API接口...\n")
    test_all_apis()