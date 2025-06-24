# 外汇数据 API 集成说明

本项目已集成同花顺 iFind API 来获取实时外汇数据，支持 K 线、分时、MA、MACD 等多种图表类型和技术指标。

## 配置步骤

### 1. 配置同花顺 API Token

1. 编辑 `server/.env` 文件
2. 将 `IFIND_REFRESH_TOKEN=your_refresh_token_here` 中的 `your_refresh_token_here` 替换为您的实际 refresh token

### 2. 安装依赖

```bash
# 安装后端依赖
cd server
pip install -r requirements.txt

# 安装前端依赖
cd ../client
npm install
```

### 3. 启动服务

```bash
# 启动后端服务
cd server
python app.py

# 启动前端服务
cd ../client
npm run dev
```

## API 接口说明

### 外汇实时数据

- **URL**: `GET /api/forex/realtime`
- **参数**: 无（默认获取 USDCNY, EURUSD, GBPUSD, USDJPY）
- **返回**: 实时价格和涨跌幅数据

### 外汇图表数据

- **URL**: `GET /api/forex/chart`
- **参数**:
  - `currency_pair`: 货币对（如 USDCNY）
  - `chart_type`: 图表类型（line=分时线, kline=K 线）
  - `period`: 时间周期（1min, 5min, 15min, 30min, 1h, 1d）
  - `count`: 数据条数
- **返回**: 格式化的图表数据

### 技术指标数据

- **URL**: `GET /api/forex/indicators`
- **参数**:
  - `currency_pair`: 货币对
  - `indicator_type`: 指标类型（MA, MACD, RSI 等）
  - `period`: 指标周期
  - `count`: 数据条数
- **返回**: 技术指标计算结果

### 多指标数据

- **URL**: `GET /api/forex/multi-indicators`
- **参数**:
  - `currency_pair`: 货币对
  - `count`: 数据条数
- **返回**: MA 和 MACD 指标数据

## 前端功能

### 外汇走势图

- 支持多种货币对切换（USD/CNY, EUR/USD, GBP/USD, USD/JPY）
- 支持多种图表类型：
  - **分时线**: 实时价格走势
  - **K 线图**: 开高低收四价显示
  - **MA**: 移动平均线
  - **MACD**: 指数平滑移动平均线

### 实时数据显示

- 顶部状态栏显示当前 USD/CNY 价格和涨跌幅
- 数据每 30 秒自动更新
- 分时线图表每分钟自动更新

## 测试

运行测试脚本验证 API 功能：

```bash
cd server
python test_forex_api.py
```

## 注意事项

1. **API Token**: 请确保同花顺 iFind API token 有效且有足够权限
2. **网络连接**: 需要稳定的网络连接访问同花顺 API
3. **数据限制**: 请注意 API 调用频率限制
4. **错误处理**: 当 API 调用失败时，系统会自动使用模拟数据作为后备

## 文件说明

- `server/services/forex_service.py`: 同花顺 API 集成服务
- `server/controllers/forex_controller.py`: 外汇数据控制器
- `server/routes/forex_routes.py`: 外汇 API 路由
- `client/src/components/Api/api.jsx`: 前端 API 调用函数
- `client/src/pages/Home/Home.jsx`: 首页组件（集成外汇图表）
- `server/test_forex_api.py`: API 测试脚本

## 故障排除

1. **Token 错误**: 检查 `.env` 文件中的 token 配置
2. **网络错误**: 检查网络连接和防火墙设置
3. **API 限制**: 检查是否达到 API 调用频率限制
4. **数据格式**: 确保同花顺 API 返回的数据格式与预期一致

如有问题，请查看控制台日志获取详细错误信息。
