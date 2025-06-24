import requests
import json
from datetime import datetime, timedelta

class IFindForexService:

    def __init__(self, refresh_token):
        self.refresh_token = refresh_token
        self.base_url = "https://ft.10jqka.com.cn"
        self.access_token = None
        self.token_expires_at = None

    def get_access_token(self):
        """获取或刷新访问令牌"""
        if self.access_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return self.access_token

        url = f"{self.base_url}/api/v1/get_access_token"
        headers = {
            "Content-Type": "application/json",
            "refresh_token": self.refresh_token,
        }

        try:
            resp = requests.post(url, headers=headers, timeout=8)
            if resp.status_code != 200:
                raise RuntimeError(f"获取 token 失败: {resp.text}")

            res = resp.json()                 # ① 统一按照官方格式解析
            data = res["data"] if "data" in res else res

            self.access_token = data.get("access_token")
            if not self.access_token:
                raise RuntimeError("响应中缺少 access_token")

            # ② 既兼容 expire_at，也兼容 expires_in
            if "expire_at" in data:
                self.token_expires_at = (
                    datetime.strptime(data["expire_at"], "%Y-%m-%d %H:%M:%S")
                    - timedelta(seconds=60)   # 提前 60 s 刷新
                )
            else:
                expires_in = int(data.get("expires_in", 3600))
                self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 60)

            print(f"获取token成功: {self.access_token}, 有效期至: {self.token_expires_at}")
            return self.access_token

        except Exception as e:
            print(f"获取token错误: {e}")
            raise

    def get_forex_realtime_data(self, currency_pairs: str):
        """实时行情数据"""
        url = f"{self.base_url}/api/v1/real_time_quotation"
        headers = {"Content-Type": "application/json", "access_token": self.get_access_token()}
        body = {
            "codes": currency_pairs,
            "indicators": "open,high,low,latest,changeRatio"
        }

        resp = requests.post(url, json=body, headers=headers, timeout=10)
        if resp.status_code != 200:
            raise RuntimeError(f"实时行情接口错误: {resp.text}")
        return resp.json()

    def get_forex_kline_data(self, currency_pair: str, period: str = "1d", count: int = 100):
        """K线数据（日线及以上周期）"""
        if period not in ["1d", "1w", "1m", "1q", "1y"]:
            raise ValueError("K线数据 period 仅支持 1d/1w/1m/1q/1y")

        today = datetime.now().date()
        delta_map = {
            "1d": timedelta(days=1),
            "1w": timedelta(weeks=1),
            "1m": timedelta(days=31),
            "1q": timedelta(days=93),
            "1y": timedelta(days=365)
        }

        start_date = (today - delta_map[period] * count).strftime("%Y-%m-%d")
        end_date = today.strftime("%Y-%m-%d")

        url = f"{self.base_url}/api/v1/cmd_history_quotation"
        headers = {"Content-Type": "application/json", "access_token": self.get_access_token()}
        body = {
            "codes": currency_pair,
            "indicators": "open,high,low,close,volume,amount,changeRatio",
            "startdate": start_date,
            "enddate": end_date,
            "functionpara": {"Interval": period.upper().replace("1", "")}
        }        resp = requests.post(url, json=body, headers=headers, timeout=10)
        if resp.status_code != 200:
            raise RuntimeError(f"K线接口错误: {resp.text}")
        return resp.json()

    def get_forex_minute_data(self, currency_pair: str, interval: str = "1", count: int = 500):
        """分钟级数据（支持1/5/15/30/60分钟）"""
        if interval not in ["1", "5", "15", "30", "60"]:
            raise ValueError("分钟数据 interval 仅支持 1/5/15/30/60")

        end_dt = datetime.now()
        minutes = int(interval) * count
        start_dt = end_dt - timedelta(minutes=minutes)

        url = f"{self.base_url}/api/v1/high_frequency"
        headers = {"Content-Type": "application/json", "access_token": self.get_access_token()}
        body = {
            "codes": currency_pair,
            "indicators": "latest,open,high,low,close",
            "starttime": start_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "endtime": end_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "functionpara": {
                "Interval": interval,
                "Fill": "Previous"
            }
        }

        resp = requests.post(url, json=body, headers=headers, timeout=10)
        if resp.status_code != 200:
            raise RuntimeError(f"分钟数据接口错误: {resp.text}")
        return resp.json()

    def get_forex_indicators(self, currency_pair: str,
                             indicator_type: str = "MA",
                             period: int = 20,
                             count: int = 500,
                             interval: str = "1"):
        """技术指标数据"""
        if interval not in ["1", "5", "15", "30", "60"]:
            raise ValueError("技术指标 interval 仅支持 1/5/15/30/60")

        end_dt = datetime.now()
        minutes = int(interval) * count
        start_dt = end_dt - timedelta(minutes=minutes)

        url = f"{self.base_url}/api/v1/high_frequency"
        headers = {"Content-Type": "application/json", "access_token": self.get_access_token()}
        body = {
            "codes": currency_pair,
            "indicators": indicator_type,
            "starttime": start_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "endtime": end_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "functionpara": {
                "Interval": interval,
                "Fill": "Original",
                "calculate": {indicator_type: str(period)}
            }
        }

        resp = requests.post(url, json=body, headers=headers, timeout=10)
        if resp.status_code != 200:
            raise RuntimeError(f"技术指标接口错误: {resp.text}")
        return resp.json()

    def format_chart_data(self, raw_data: dict, chart_type: str = "line"):
        """
        iFinD 统一返回:
        1) cmd_history_quotation  → raw_data['tables'][0]['table'] 内含 open/high/...
        2) high_frequency        → raw_data['tables'][0]['table'] 内含 latest / MA / MACD ...
        """
        if not raw_data or "tables" not in raw_data:
            return []

        formatted = []
        for tbl in raw_data["tables"]:
            time_arr  = tbl.get("time", [])
            values    = tbl["table"]      # dict，key 是指标名

            # -------- k 线 --------
            if chart_type == "kline":
                opens  = values.get("open",   [])
                closes = values.get("latest", []) or values.get("close", [])
                lows   = values.get("low",    [])
                highs  = values.get("high",   [])
                vols   = values.get("volume", []) or []
                for i in range(len(time_arr)):
                    # 任一价位为空直接跳过；volume 允许空 ⇒ 0
                    if None in (opens[i], closes[i], lows[i], highs[i]):
                        continue
                    v = float(vols[i]) if i < len(vols) and vols[i] is not None else 0.0
                    formatted.append([
                        time_arr[i],
                        float(opens[i]),
                        float(closes[i]),
                        float(lows[i]),
                        float(highs[i]),
                        v,
                    ])            # -------- 折线 / 指标 --------
            else:
                # 先尝试latest字段，再尝试close字段
                latest_values = values.get("latest", [])
                close_values = values.get("close", [])
                
                # 选择有数据的字段
                price_values = latest_values if latest_values else close_values
                
                for i in range(len(time_arr)):
                    if i < len(price_values) and price_values[i] is not None:
                        formatted.append([time_arr[i], float(price_values[i])])

        # 保证按时间升序
        formatted.sort(key=lambda x: x[0])
        return formatted

    def format_realtime_data(self, raw_data: dict):
        """
        格式化实时数据为前端需要的格式
        """
        if not raw_data or "tables" not in raw_data:
            return []

        formatted_data = []
        for table in raw_data["tables"]:
            thscode = table.get("thscode", "")
            table_data = table.get("table", {})
            
            # 构造数据对象
            data_obj = {
                "code": thscode,
                "latest": table_data.get("latest", [0])[0] if table_data.get("latest") else 0,
                "changeRatio": table_data.get("changeRatio", [0])[0] if table_data.get("changeRatio") else 0,
                "open": table_data.get("open", [0])[0] if table_data.get("open") else 0,
                "high": table_data.get("high", [0])[0] if table_data.get("high") else 0,
                "low": table_data.get("low", [0])[0] if table_data.get("low") else 0,
            }
            formatted_data.append(data_obj)
        
        return formatted_data

# 全局实例化
_forex_service = None

def init_forex_service(refresh_token: str):
    global _forex_service
    _forex_service = IFindForexService(refresh_token)
    return _forex_service

def get_forex_service() -> IFindForexService:
    if _forex_service is None:
        raise RuntimeError("请先调用 init_forex_service(refresh_token) 初始化服务！")
    return _forex_service
