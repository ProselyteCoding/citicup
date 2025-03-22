from langchain_openai import ChatOpenAI
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from typing import List, Optional,Any
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from langchain.tools import tool
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import tools_condition
from langgraph.prebuilt import ToolNode
from langchain_core.prompts import PromptTemplate
import os

# 设置API密钥和端点
os.environ['OPENAI_API_KEY'] = 'sk-GQLASa7Vc1lY6NC9pw9X0OMpuct3i6eJz3CcHKfqAvwp5Xws'
os.environ['OPENAI_API_BASE'] = 'https://api.chatanywhere.tech/v1'


# 定义大语言模型 可以选择更好的 gpt-o1 模型 需要付费
# model_name="gpt-4o"
# model_name="deepseek-r1"#太jb慢了 还容易报错
# model_name="o1-preview"
#model_name = "deepseek-r1"
model_name = "gpt-4o-mini"

llm = ChatOpenAI(model=model_name)


# 定义输出
class CurrentHedgingAdvice(BaseModel):
    volatility: float = Field(description="市场波动率，数值型，范围0-1")
    emotion: str = Field(description="市场情绪，例如'偏多'（看涨）、'偏空'（看跌）、'中性'")
    suggestion: str = Field(description="对冲建议，简短的描述性文本")


class TermRisk(BaseModel):
    time: int = Field(description="时间分区（单位：天）")
    risk: float = Field(description="对应时间分区的风险值")


class MacroRiskCoefficient(BaseModel):
    month: int = Field(description="月份")
    all: float = Field(description="综合指数")
    economy: float = Field(description="经济指数")
    policy: float = Field(description="政策指标")
    market: float = Field(description="市场指标")


class RiskSignal(BaseModel):
    credit: float = Field(description="信用风险")
    policy: float = Field(description="政策风险")
    market: float = Field(description="市场流动性")
    politician: float = Field(description="政治风险")
    economy: float = Field(description="经济风险")


class RiskSignalAnalysis(BaseModel):
    current: RiskSignal = Field(description="当前风险情况")
    warning: RiskSignal = Field(description="预警阈值")


class SingleCurrencyAnalysis(BaseModel):
    currency: str = Field(description="货币代码")
    upper: float = Field(description="预测上限")
    lower: float = Field(description="预测下限")


class RiskData(BaseModel):
    currencyExposure: Optional[float] = Field(None, description="货币敞口及风险计算（暂未提供）")
    termRiskDistribution: List[TermRisk] = Field(description="账期风险分布")
    riskTransmissionPath: List[str] = Field(description="风险传导路径")
    macroRiskCoefficients: List[MacroRiskCoefficient] = Field(description="宏观风险系数(ERI)")
    riskSignalAnalysis: RiskSignalAnalysis = Field(description="风险信号分析")
    singleCurrencyAnalysis: List[SingleCurrencyAnalysis] = Field(description="单一货币对回测分析")


# 定义输出解析器
parser = JsonOutputParser(pydantic_object=RiskData)
parser.get_format_instructions()

# 定义prompt
prompt = f'''
### 任务描述：
你是一位金融风险分析专家。你的任务是将一组**货币持仓数据**转换为**风险分析报告**，输出格式为标准的 JSON 结构，并且所有数据都需要基于输入进行合理计算和推断。

---

### **输入数据（货币持仓信息）：**
以下是包含多个货币对的持仓数据，包括货币对名称、持仓量、持仓占比、盈亏、日波动率、风险敞口（VaR）、Beta 系数和对冲成本等信息：

{input}

---

### **输出数据生成规则：**
- **currencyExposure（货币敞口）**：
  - 计算基于所有货币对的持仓量、风险敞口（VaR）和波动率得出的整体货币敞口。如果无法计算，则返回 `None`。

- **termRiskDistribution（账期风险分布）**：
  - 构建短期（30 天）、中期（60 天）、长期（90+ 天）的风险分布，依据输入数据的波动率和 Beta 系数进行估算。

- **riskTransmissionPath（风险传导路径）**：
  - 选取持仓规模大、风险敞口（VaR）高的主要货币对，并按照其相对风险程度附加数值标签（如 `"JPY30"`、`"USD50"`）。

- **macroRiskCoefficients（宏观风险系数）**：
  - 提供基于 **经济、政策、市场** 相关指标的风险评估，确保生成的数据与当前市场情况合理匹配。

- **riskSignalAnalysis（风险信号分析）**：
  - **current（当前风险）**：根据货币持仓数据的波动率和集中度评估信用、政策、市场、政治和经济风险。
  - **warning（预警阈值）**：定义风险阈值，作为潜在风险升级的参考。

- **singleCurrencyAnalysis（单一货币对分析）**：
  - 对输入中的每个货币对，结合波动率和风险趋势预测**未来可能的价格上下限**。

---

### **输出格式（标准 JSON 结构）**
你的最终输出**必须严格遵循**以下 JSON 结构，并且所有值应基于输入数据计算得出：

'''

# 定义系统消息
sys_msg = SystemMessage(content=prompt)


# 定义工具
def calculate_portfolio_volatility(data: List[Dict]) -> float:
    """
    计算整体持仓组合的波动率（Volatility）。
    使用各货币对的日波动率（dailyVolatility）和其在持仓中的占比（proportion）计算加权平均波动率。
    """
    df = pd.DataFrame(data)
    return np.average(df["dailyVolatility"], weights=df["proportion"])


def determine_market_emotion(volatility: float) -> str:
    """
    根据组合波动率判断市场情绪。
    - 波动率 > 0.1 -> “偏多”
    - 波动率 < 0.05 -> “偏空”
    - 否则 -> “中性”
    """
    if volatility > 0.1:
        return "偏多"
    elif volatility < 0.05:
        return "偏空"
    return "中性"


def assess_risk(data: List[Dict]) -> Tuple[str, Dict]:
    """
    评估持仓组合的风险水平，基于各货币对 VaR（字符串如 '$15,000'），找出 VaR 最大的货币对并返回风险评级。
    - VaR < 15000 -> 低风险
    - 15000 <= VaR < 30000 -> 中风险
    - VaR >= 30000 -> 高风险
    """
    df = pd.DataFrame(data)
    df["VaR_value"] = df["valueAtRisk"].replace({'$': '', ',': ''}, regex=True).astype(float)
    highest_risk = df.loc[df["VaR_value"].idxmax()].to_dict()
    risk_level = "低风险" if highest_risk["VaR_value"] < 15000 else "中风险" if highest_risk["VaR_value"] < 30000 else "高风险"
    return risk_level, highest_risk
@tool
def compute_currency_exposure(data: List[Dict]) -> Optional[float]:
    """
    计算整体货币敞口（currencyExposure）。
    演示用：这里简单地将“加权组合波动率 * 持仓总量”视为货币敞口；如需更复杂逻辑，可自行扩展。

    Args:
        data (List[Dict]): 持仓数据列表，每个元素包含至少 'dailyVolatility', 'proportion', 'quantity' 等字段。

    Returns:
        Optional[float]: 返回根据组合波动率与持仓量估算的货币敞口；如果数据不足则返回 None。
    """
    if not data:
        return None

    portfolio_vol = calculate_portfolio_volatility(data)
    total_quantity = sum(d.get("quantity", 0) for d in data)
    currency_exposure = portfolio_vol * total_quantity
    return currency_exposure


@tool
def compute_term_risk_distribution(data: List[Dict]) -> List[Dict[str, float]]:
    """
    构建账期风险分布（termRiskDistribution）。
    示例：根据组合波动率分别对 30天、60天、90天（或更长）进行不同系数的风险估算。

    Args:
        data (List[Dict]): 持仓数据列表。

    Returns:
        List[Dict[str, float]]: 返回形如 [{"time": 30, "risk": 0.01}, ...] 的列表，包含多期风险估算。
    """
    if not data:
        return []

    portfolio_vol = calculate_portfolio_volatility(data)
    # 下列系数纯属演示：你可根据实际模型或逻辑来计算风险
    distribution = [
        {"time": 30, "risk": round(portfolio_vol * 0.5, 4)},
        {"time": 60, "risk": round(portfolio_vol * 0.8, 4)},
        {"time": 90, "risk": round(portfolio_vol * 1.2, 4)},
    ]
    return distribution


@tool
def compute_risk_transmission_path(data: List[Dict]) -> List[str]:
    """
    构建风险传导路径（riskTransmissionPath）。
    演示用：根据“quantity * dailyVolatility”计算 'risk_factor'，选取前几名货币对并附加数字标签。

    Args:
        data (List[Dict]): 持仓数据列表，每个元素至少包含 'currency', 'quantity', 'dailyVolatility'.

    Returns:
        List[str]: 示例形如 ["JPY30", "GBP40", "USD50"]，代表主要风险传导路径。
    """
    if not data:
        return []

    df = pd.DataFrame(data)
    df["risk_factor"] = df["quantity"] * df["dailyVolatility"]
    df = df.sort_values("risk_factor", ascending=False)

    # 简单演示：取前三个货币对，以 'currency + int(risk_factor/1000)' 为标签
    result = []
    top_risk = df.head(3)
    for _, row in top_risk.iterrows():
        # 去除斜杠或其他符号，拼接大致的风险强度数值
        cleaned_ccy = row["currency"].replace("/", "")
        factor_label = int(row["risk_factor"] / 1000)
        result.append(f"{cleaned_ccy}{factor_label}")

    return result


@tool
def generate_macro_risk_coefficients() -> List[Dict[str, float]]:
    """
    生成宏观风险系数（macroRiskCoefficients）。
    演示用：此函数返回一个示例月份的宏观指标；在实际场景可接入外部数据源或模型。

    Returns:
        List[Dict[str, float]]: 形如 [{"month": 1, "all": 80, "economy": 60, "policy": 40, "market": 20}].
    """
    return [
        {"month": 1, "all": 80.0, "economy": 60.0, "policy": 40.0, "market": 20.0}
    ]


@tool
def generate_risk_signal_analysis(data: List[Dict]) -> Dict[str, Any]:
    """
    生成风险信号分析（riskSignalAnalysis）。
    演示用：结合已存在的工具（如 determine_market_emotion、assess_risk）大致生成当前 & 预警风险值。

    Args:
        data (List[Dict]): 持仓数据列表。

    Returns:
        Dict[str, Any]:
        形如 {
          "current": {"credit":..., "policy":..., ...},
          "warning": {...}
        } 的字典。
    """
    portfolio_vol = calculate_portfolio_volatility(data)
    emotion = determine_market_emotion(portfolio_vol)
    risk_level, highest_risk = assess_risk(data)

    # 根据情绪和风险等级做一个简单映射（纯属示例）
    # 你可以结合业务逻辑，自定义 credit/policy/market/politician/economy 的值
    if emotion == "偏多":
        current = {"credit": 60, "policy": 20, "market": 40, "politician": 30, "economy": 50}
    elif emotion == "偏空":
        current = {"credit": 80, "policy": 30, "market": 20, "politician": 50, "economy": 40}
    else:
        current = {"credit": 70, "policy": 25, "market": 30, "politician": 40, "economy": 45}

    # 简单规则：warning 比 current 各增加 10
    warning = {k: v + 10 for k, v in current.items()}

    return {
        "current": current,
        "warning": warning
    }


@tool
def compute_single_currency_analysis(data: List[Dict]) -> List[Dict[str, float]]:
    """
    根据输入持仓数据，对每个货币对进行单一分析，输出预估的价格区间 upper、lower（演示用）。

    演示中：
    - 假设基准价为 1.0
    - 根据 dailyVolatility 做一个简单波动上下限（vol * 0.05）
    - 可结合实际汇率数据改进本逻辑

    Args:
        data (List[Dict]): 持仓数据列表，每个字典至少包含 'currency'、'dailyVolatility'.

    Returns:
        List[Dict[str, float]]: 形如 [{"currency": "USD/JPY", "upper": 1.05, "lower": 0.95}, ...].
    """
    if not data:
        return []

    analysis = []
    base_price = 1.0  # 演示基准价

    for item in data:
        vol = item.get("dailyVolatility", 0.0)
        upper = round(base_price + (vol * 0.05), 4)
        lower = round(base_price - (vol * 0.05), 4)
        analysis.append({
            "currency": item["currency"],
            "upper": upper,
            "lower": lower
        })

    return analysis


tools = [compute_single_currency_analysis, generate_risk_signal_analysis, generate_macro_risk_coefficients, compute_risk_transmission_path,
         compute_term_risk_distribution,compute_currency_exposure]

# 绑定工具
llm_with_tools = llm.bind_tools(tools)


# 大模型结点
def assistant(state: MessagesState):
    return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}


# 实现react架构
builder = StateGraph(MessagesState)

builder.add_node("assistant", assistant)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "assistant")
builder.add_conditional_edges(
    "assistant",
    # If the latest message (result) from assistant is a tool call -> tools_condition routes to tools
    # If the latest message (result) from assistant is a not a tool call -> tools_condition routes to END
    tools_condition,
)
builder.add_edge("tools", "assistant")
react_graph = builder.compile()


# 输入持仓比例List 输出对冲策略Json
def Risk_strategy(input: list) -> dict:
    message = [HumanMessage(content=str(input))]
    result_raw = react_graph.invoke({"messages": message})
    prompt = PromptTemplate(
        template="你是一个自然语言解析成json格式的专家，你的任务是根据我的输入解析成json格式，\n输入{input}，\n{format_instructions}",
        input_variables=["input"],
        partial_variables={"format_instructions": parser.get_format_instructions()})
    # 给修复器使用
    prompt_value = prompt.format_prompt(input=result_raw['messages'][-1].content)
    chain = prompt | llm | parser
    try:
        result_json = chain.invoke({"input": result_raw['messages'][-1].content})
    except OutputParserException as e:
        print(e)
        # 如果解析错误的话 使用修复器 目前还用不到
        # raw_llm_output = (prompt | llm).invoke({"input": result_raw['messages'][-1].content})
        # from langchain.output_parsers import RetryOutputParser
        # retry_parser = RetryOutputParser.from_llm(parser=parser, llm=llm)
        # retry_parser.parse_with_prompt(raw_llm_output, prompt_value)
        raise (e)
    return result_json


if __name__ == '__main__':
    # 模拟数据
    input = [
        {
            "currency": "EUR/USD",
            "quantity": 1000000,
            "proportion": 0.35,
            "benefit": 2500,
            "dailyVolatility": 0.125,
            "valueAtRisk": 15000,
            "beta": 1.2,
            "hedgingCost": 0.0015
        },
        {
            "currency": "USD/JPY",
            "quantity": 2000000,
            "proportion": 0.45,
            "benefit": -1200,
            "dailyVolatility": 0.085,
            "valueAtRisk":25000,
            "beta": 0.9,
            "hedgingCost": 0.0012
        },
        {
            "currency": "GBP/USD",
            "quantity": 1500000,
            "proportion": 0.25,
            "benefit": 3200,
            "dailyVolatility": 0.095,
            "valueAtRisk": 18000,
            "beta": 1.1,
            "hedgingCost": 0.0013
        },
        {
            "currency": "AUD/USD",
            "quantity": 1200000,
            "proportion": 0.2,
            "benefit": -500,
            "dailyVolatility": 0.075,
            "valueAtRisk": 12000,
            "beta": 0.85,
            "hedgingCost": 0.0011
        },
        {
            "currency": "USD/CAD",
            "quantity": 1800000,
            "proportion": 0.3,
            "benefit": 1500,
            "dailyVolatility": 0.082,
            "valueAtRisk": 20000,
            "beta": 0.95,
            "hedgingCost": 0.0014
        },
        {
            "currency": "NZD/USD",
            "quantity": 900000,
            "proportion": 0.15,
            "benefit": -200,
            "dailyVolatility": 0.065,
            "valueAtRisk": 10000,
            "beta": 0.75,
            "hedgingCost": 0.001
        },
        {
            "currency": "EUR/GBP",
            "quantity": 800000,
            "proportion": 0.1,
            "benefit": 1000,
            "dailyVolatility": 0.055,
            "valueAtRisk": 8000,
            "beta": 1.05,
            "hedgingCost": 0.0012
        },
        {
            "currency": "USD/CHF",
            "quantity": 1700000,
            "proportion": 0.28,
            "benefit": -2500,
            "dailyVolatility": 0.078,
            "valueAtRisk": 22000,
            "beta": 0.92,
            "hedgingCost": 0.0013
        },
        {
            "currency": "EUR/JPY",
            "quantity": 1300000,
            "proportion": 0.22,
            "benefit": 1800,
            "dailyVolatility": 0.088,
            "valueAtRisk": 17000,
            "beta": 1.15,
            "hedgingCost": 0.0015
        },
        {
            "currency": "GBP/JPY",
            "quantity": 1400000,
            "proportion": 0.24,
            "benefit": -600,
            "dailyVolatility": 0.092,
            "valueAtRisk": 19000,
            "beta": 1.1,
            "hedgingCost": 0.0016
        }
    ]

    print(Risk_strategy(input))
