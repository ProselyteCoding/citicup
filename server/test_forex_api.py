"""
外汇API测试脚本
用于测试同花顺iFind API集成功能
"""

import requests
import json
import time

# 服务器地址
BASE_URL = "http://localhost:5000"


def test_forex_realtime():
    """测试外汇实时数据接口"""
    print("测试外汇实时数据接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/forex/realtime")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_forex_chart_data():
    """测试外汇图表数据接口"""
    print("\n测试外汇图表数据接口...")
    params = {
        "currency_pair": "USDCNY",
        "chart_type": "line",
        "period": "1min",
        "count": 10,
    }
    try:
        response = requests.get(f"{BASE_URL}/api/forex/chart", params=params)
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_forex_kline_data():
    """测试K线数据接口"""
    print("\n测试K线数据接口...")
    params = {
        "currency_pair": "USDCNY",
        "chart_type": "kline",
        "period": "5min",
        "count": 10,
    }
    try:
        response = requests.get(f"{BASE_URL}/api/forex/chart", params=params)
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_forex_indicators():
    """测试技术指标接口"""
    print("\n测试技术指标接口...")
    params = {
        "currency_pair": "USDCNY",
        "indicator_type": "MA",
        "period": 20,
        "count": 10,
    }
    try:
        response = requests.get(f"{BASE_URL}/api/forex/indicators", params=params)
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_forex_multi_indicators():
    """测试多指标接口"""
    print("\n测试多指标接口...")
    params = {"currency_pair": "USDCNY", "count": 10}
    try:
        response = requests.get(f"{BASE_URL}/api/forex/multi-indicators", params=params)
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_server_health():
    """测试服务器健康状态"""
    print("测试服务器健康状态...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def main():
    """主测试函数"""
    print("开始测试外汇API...")
    print("=" * 50)

    # 测试服务器健康状态
    if not test_server_health():
        print("服务器未启动或出现问题，请检查服务器状态")
        return

    # 测试各个API接口
    tests = [
        ("外汇实时数据", test_forex_realtime),
        ("外汇图表数据", test_forex_chart_data),
        ("K线数据", test_forex_kline_data),
        ("技术指标", test_forex_indicators),
        ("多指标", test_forex_multi_indicators),
    ]

    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        success = test_func()
        results.append((test_name, success))
        time.sleep(1)  # 避免请求过快

    # 输出测试结果
    print(f"\n{'='*50}")
    print("测试结果汇总:")
    for test_name, success in results:
        status = "✓ 通过" if success else "✗ 失败"
        print(f"{test_name}: {status}")

    success_count = sum(1 for _, success in results if success)
    print(f"\n总计: {success_count}/{len(results)} 个测试通过")


if __name__ == "__main__":
    main()
